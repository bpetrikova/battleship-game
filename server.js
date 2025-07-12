const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game state management
const games = new Map();
const players = new Map();

// Game lobby
const lobby = {
    waitingPlayers: [],
    gameRooms: new Map()
};

function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generatePlayerId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createGame(player1, player2) {
    const gameId = generateGameId();
    const game = {
        id: gameId,
        players: [player1, player2],
        state: 'setup',
        currentPlayer: 0,
        boards: {
            [player1.id]: Array(10).fill().map(() => Array(10).fill(0)),
            [player2.id]: Array(10).fill().map(() => Array(10).fill(0))
        },
        shots: {
            [player1.id]: Array(10).fill().map(() => Array(10).fill(0)),
            [player2.id]: Array(10).fill().map(() => Array(10).fill(0))
        },
        ships: {
            [player1.id]: {
                carrier: { size: 5, placed: false },
                battleship: { size: 4, placed: false },
                cruiser: { size: 3, placed: false },
                submarine: { size: 3, placed: false },
                destroyer: { size: 2, placed: false }
            },
            [player2.id]: {
                carrier: { size: 5, placed: false },
                battleship: { size: 4, placed: false },
                cruiser: { size: 3, placed: false },
                submarine: { size: 3, placed: false },
                destroyer: { size: 2, placed: false }
            }
        },
        shipsSunk: {
            [player1.id]: 0,
            [player2.id]: 0
        },
        totalShots: {
            [player1.id]: 0,
            [player2.id]: 0
        },
        readyPlayers: new Set()
    };
    
    games.set(gameId, game);
    lobby.gameRooms.set(gameId, game);
    
    // Assign players to game
    player1.gameId = gameId;
    player2.gameId = gameId;
    player1.playerNumber = 1;
    player2.playerNumber = 2;
    
    // Notify players
    player1.send(JSON.stringify({
        type: 'game_start',
        gameId: gameId,
        playerNumber: 1,
        opponent: player2.name
    }));
    
    player2.send(JSON.stringify({
        type: 'game_start',
        gameId: gameId,
        playerNumber: 2,
        opponent: player1.name
    }));
    
    console.log(`Game ${gameId} created between ${player1.name} and ${player2.name}`);
    return game;
}

function findOpponent(player) {
    if (lobby.waitingPlayers.length > 0) {
        const opponent = lobby.waitingPlayers.shift();
        return createGame(opponent, player);
    } else {
        lobby.waitingPlayers.push(player);
        player.send(JSON.stringify({
            type: 'waiting_for_opponent',
            message: 'Waiting for another player to join...'
        }));
        return null;
    }
}

function broadcastToGame(gameId, message, excludePlayer = null) {
    const game = games.get(gameId);
    if (!game) return;
    
    game.players.forEach(player => {
        if (player !== excludePlayer && player.readyState === WebSocket.OPEN) {
            player.send(JSON.stringify(message));
        }
    });
}

function handleShipPlacement(ws, data) {
    const game = games.get(data.gameId);
    if (!game) return;
    
    const playerId = ws.playerId;
    const { row, col, shipType, orientation } = data;
    
    // Validate ship placement
    if (canPlaceShip(game.boards[playerId], row, col, game.ships[playerId][shipType].size, orientation)) {
        placeShip(game.boards[playerId], row, col, game.ships[playerId][shipType].size, orientation, 1);
        game.ships[playerId][shipType].placed = true;
        
        // Notify both players
        broadcastToGame(data.gameId, {
            type: 'ship_placed',
            playerId: playerId,
            shipType: shipType,
            row: row,
            col: col,
            orientation: orientation
        });
        
        // Check if all ships are placed
        const allShipsPlaced = Object.values(game.ships[playerId]).every(ship => ship.placed);
        if (allShipsPlaced) {
            game.readyPlayers.add(playerId);
            
            if (game.readyPlayers.size === 2) {
                // Both players ready, start combat phase
                game.state = 'playing';
                broadcastToGame(data.gameId, {
                    type: 'combat_start',
                    currentPlayer: game.players[0].id
                });
            }
        }
    }
}

function handleShot(ws, data) {
    const game = games.get(data.gameId);
    if (!game || game.state !== 'playing') return;
    
    const playerId = ws.playerId;
    const opponentId = game.players.find(p => p.id !== playerId).id;
    const { row, col } = data;
    
    // Check if it's player's turn
    if (game.players[game.currentPlayer].id !== playerId) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Not your turn!'
        }));
        return;
    }
    
    // Check if already shot here
    if (game.shots[playerId][row][col] !== 0) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Already shot at this position!'
        }));
        return;
    }
    
    // Process shot
    const hit = game.boards[opponentId][row][col] > 0;
    game.shots[playerId][row][col] = hit ? 2 : 1;
    game.totalShots[playerId]++;
    
    let shipSunk = false;
    if (hit) {
        if (isShipSunk(game.boards[opponentId], game.shots[playerId], row, col)) {
            game.shipsSunk[opponentId]++;
            markSunkShip(game.boards[opponentId], game.shots[playerId], row, col);
            shipSunk = true;
        }
    }
    
    // Check for game end
    if (game.shipsSunk[opponentId] === 5) {
        broadcastToGame(data.gameId, {
            type: 'game_over',
            winner: playerId,
            winnerName: ws.name,
            loserName: game.players.find(p => p.id === opponentId).name
        });
        return;
    }
    
    // Switch turns
    game.currentPlayer = (game.currentPlayer + 1) % 2;
    
    // Notify both players
    broadcastToGame(data.gameId, {
        type: 'shot_result',
        playerId: playerId,
        row: row,
        col: col,
        hit: hit,
        shipSunk: shipSunk,
        nextPlayer: game.players[game.currentPlayer].id,
        nextPlayerName: game.players[game.currentPlayer].name
    });
}

// Game logic functions
function canPlaceShip(board, row, col, size, horizontal) {
    if (horizontal) {
        if (col + size > 10) return false;
        for (let i = 0; i < size; i++) {
            if (board[row][col + i] !== 0) return false;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const newRow = row + dr;
                    const newCol = col + i + dc;
                    if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
                        if (board[newRow][newCol] !== 0) return false;
                    }
                }
            }
        }
    } else {
        if (row + size > 10) return false;
        for (let i = 0; i < size; i++) {
            if (board[row + i][col] !== 0) return false;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const newRow = row + i + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
                        if (board[newRow][newCol] !== 0) return false;
                    }
                }
            }
        }
    }
    return true;
}

function placeShip(board, row, col, size, horizontal, value) {
    if (horizontal) {
        for (let i = 0; i < size; i++) {
            board[row][col + i] = value;
        }
    } else {
        for (let i = 0; i < size; i++) {
            board[row + i][col] = value;
        }
    }
}

function isShipSunk(board, shots, row, col) {
    const visited = Array(10).fill().map(() => Array(10).fill(false));
    const shipCells = [];
    
    function dfs(r, c) {
        if (r < 0 || r >= 10 || c < 0 || c >= 10 || visited[r][c] || board[r][c] === 0) {
            return;
        }
        visited[r][c] = true;
        shipCells.push([r, c]);
        
        dfs(r - 1, c);
        dfs(r + 1, c);
        dfs(r, c - 1);
        dfs(r, c + 1);
    }
    
    dfs(row, col);
    return shipCells.every(([r, c]) => shots[r][c] === 2);
}

function markSunkShip(board, shots, row, col) {
    const visited = Array(10).fill().map(() => Array(10).fill(false));
    
    function dfs(r, c) {
        if (r < 0 || r >= 10 || c < 0 || c >= 10 || visited[r][c] || board[r][c] === 0) {
            return;
        }
        visited[r][c] = true;
        shots[r][c] = 3;
        
        dfs(r - 1, c);
        dfs(r + 1, c);
        dfs(r, c - 1);
        dfs(r, c + 1);
    }
    
    dfs(row, col);
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    const playerId = generatePlayerId();
    ws.playerId = playerId;
    players.set(playerId, ws);
    
    console.log(`Player ${playerId} connected`);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data); // DEBUG LOG
            
            switch (data.type) {
                case 'join_game':
                    ws.name = data.name || `Player ${playerId}`;
                    findOpponent(ws);
                    break;
                case 'place_ship':
                    // DEBUG: log all fields
                    if (!data.gameId || typeof data.gameId !== 'string') {
                        console.error('Invalid place_ship: missing or invalid gameId', data);
                        ws.send(JSON.stringify({ type: 'error', message: 'Invalid place_ship: missing or invalid gameId' }));
                        return;
                    }
                    if (!data.shipType || typeof data.shipType !== 'string') {
                        console.error('Invalid place_ship: missing or invalid shipType', data);
                        ws.send(JSON.stringify({ type: 'error', message: 'Invalid place_ship: missing or invalid shipType' }));
                        return;
                    }
                    if (typeof data.row !== 'number' || typeof data.col !== 'number') {
                        console.error('Invalid place_ship: row/col not numbers', data);
                        ws.send(JSON.stringify({ type: 'error', message: 'Invalid place_ship: row/col not numbers' }));
                        return;
                    }
                    if (typeof data.orientation !== 'boolean') {
                        console.error('Invalid place_ship: orientation not boolean', data);
                        ws.send(JSON.stringify({ type: 'error', message: 'Invalid place_ship: orientation not boolean' }));
                        return;
                    }
                    handleShipPlacement(ws, data);
                    break;
                case 'fire_shot':
                    handleShot(ws, data);
                    break;
                case 'chat_message':
                    const game = games.get(data.gameId);
                    if (game) {
                        broadcastToGame(data.gameId, {
                            type: 'chat_message',
                            playerId: playerId,
                            playerName: ws.name,
                            message: data.message
                        });
                    }
                    break;
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });
    
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        
        // Remove from waiting list
        const waitingIndex = lobby.waitingPlayers.indexOf(ws);
        if (waitingIndex > -1) {
            lobby.waitingPlayers.splice(waitingIndex, 1);
        }
        
        // Handle game disconnection
        if (ws.gameId) {
            const game = games.get(ws.gameId);
            if (game) {
                const opponent = game.players.find(p => p.id !== playerId);
                if (opponent && opponent.readyState === WebSocket.OPEN) {
                    opponent.send(JSON.stringify({
                        type: 'opponent_disconnected',
                        message: 'Your opponent has disconnected'
                    }));
                }
                games.delete(ws.gameId);
                lobby.gameRooms.delete(ws.gameId);
            }
        }
        
        players.delete(playerId);
    });
    
    ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        players: players.size,
        games: games.size,
        waiting: lobby.waitingPlayers.length
    });
});

// Game status endpoint
app.get('/status', (req, res) => {
    res.json({
        activeGames: games.size,
        waitingPlayers: lobby.waitingPlayers.length,
        totalPlayers: players.size
    });
});

// Railway specific port handling
const PORT = process.env.PORT || process.env.RAILWAY_STATIC_URL_PORT || 3000;
console.log(`Environment variables:`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- RAILWAY_STATIC_URL_PORT: ${process.env.RAILWAY_STATIC_URL_PORT}`);
console.log(`- Using PORT: ${PORT}`);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚢 Battleship multiplayer server running on port ${PORT}`);
    console.log(`📱 Access the game at: http://localhost:${PORT}`);
    console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`🌐 Railway URL will be available at your project domain`);
});

// Cleanup inactive games every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [gameId, game] of games.entries()) {
        // Remove games that have been inactive for 30 minutes
        if (now - game.lastActivity > 30 * 60 * 1000) {
            console.log(`Removing inactive game ${gameId}`);
            games.delete(gameId);
            lobby.gameRooms.delete(gameId);
        }
    }
}, 5 * 60 * 1000); 