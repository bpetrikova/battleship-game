/**
 * Battleship Game - Real-time Multiplayer JavaScript Logic
 * A two-player battleship game with WebSocket support for live gameplay
 */

// Game state variables
let gameState = 'connecting';
let currentPlayer = null;
let gameId = null;
let playerNumber = null;
let opponentName = null;
let isMyTurn = false;

let myBoard = Array(10).fill().map(() => Array(10).fill(0));
let opponentBoard = Array(10).fill().map(() => Array(10).fill(0));
let myShots = Array(10).fill().map(() => Array(10).fill(0));
let opponentShots = Array(10).fill().map(() => Array(10).fill(0));

let selectedShip = null;
let isHorizontal = true;
let shipsSunk = { me: 0, opponent: 0 };
let totalShots = { me: 0, opponent: 0 };
let editMode = false;
let isReady = false;

// WebSocket connection
let ws = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// 1. Uložím jméno hráče při připojení
let myName = '';

// Ship templates
const shipTemplates = {
    carrier: { size: 5, placed: false },
    battleship: { size: 4, placed: false },
    cruiser: { size: 3, placed: false },
    submarine: { size: 3, placed: false },
    destroyer: { size: 2, placed: false }
};

let myShips = JSON.parse(JSON.stringify(shipTemplates));

// Chat functionality
let chatMessages = [];

/**
 * Initialize the multiplayer game
 */
function initMultiplayerGame() {
    console.log('initMultiplayerGame called');
    showConnectionScreen();
    connectToServer();
}

/**
 * Show connection screen
 */
function showConnectionScreen() {
    const gameContainer = document.querySelector('.game-container');
    gameContainer.innerHTML = `
        <div class="connection-screen">
            <h1>🚢 Lodě - Online Multiplayer</h1>
            <div class="connection-status" id="connectionStatus">
                <div class="spinner"></div>
                <p>Připojování k serveru...</p>
            </div>
            <div class="player-form" id="playerForm" style="display: none;">
                <h2>Zadej své jméno</h2>
                <input type="text" id="playerName" placeholder="Tvé jméno" maxlength="20" value="Hráč">
                <button onclick="joinGame()" class="control-btn">🎮 Začít hrát</button>
            </div>
            <div class="waiting-screen" id="waitingScreen" style="display: none;">
                <h2>⏳ Čekání na protivníka...</h2>
                <div class="spinner"></div>
                <p>Hledáme dalšího hráče pro tebe</p>
            </div>
        </div>
    `;
}

/**
 * Connect to WebSocket server
 */
function connectToServer() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('Connected to server');
            updateConnectionStatus('connected', 'Připojeno k serveru');
            showPlayerForm();
        };
        
        ws.onmessage = (event) => {
            handleServerMessage(JSON.parse(event.data));
        };
        
        ws.onclose = () => {
            console.log('Disconnected from server');
            updateConnectionStatus('disconnected', 'Odpojeno od serveru');
            handleDisconnection();
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus('error', 'Chyba připojení');
        };
        
    } catch (error) {
        console.error('Failed to connect:', error);
        updateConnectionStatus('error', 'Nelze se připojit k serveru');
    }
}

/**
 * Update connection status display
 */
function updateConnectionStatus(status, message) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.innerHTML = `
            <div class="status-indicator ${status}"></div>
            <p>${message}</p>
        `;
    }
}

/**
 * Show player name form
 */
function showPlayerForm() {
    const playerForm = document.getElementById('playerForm');
    const waitingScreen = document.getElementById('waitingScreen');
    
    if (playerForm) playerForm.style.display = 'block';
    if (waitingScreen) waitingScreen.style.display = 'none';
}

/**
 * Join the game
 */
function joinGame() {
    const playerName = document.getElementById('playerName').value.trim() || 'Hráč';
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'join_game',
            name: playerName
        }));
        
        showWaitingScreen();
    }
}

/**
 * Show waiting screen
 */
function showWaitingScreen() {
    const playerForm = document.getElementById('playerForm');
    const waitingScreen = document.getElementById('waitingScreen');
    
    if (playerForm) playerForm.style.display = 'none';
    if (waitingScreen) waitingScreen.style.display = 'block';
}

/**
 * Handle server messages
 */
function handleServerMessage(data) {
    console.log('Server message:', data);
    
    switch (data.type) {
        case 'waiting_for_opponent':
            showMessage(data.message, 'info');
            break;
            
        case 'game_start':
            startGame(data);
            break;
            
        case 'ship_placed':
            handleOpponentShipPlacement(data);
            // Pokud mám všechny lodě umístěné, zkusím se připravit
            if (Object.values(myShips).every(ship => ship.placed) && !isReady) {
                console.log('Všechny lodě umístěny, odesílám player_ready...');
                ws.send(JSON.stringify({
                    type: 'player_ready',
                    gameId: gameId
                }));
            }
            break;
            
        case 'combat_start':
            startCombatPhase(data);
            // Reset ready stavu, protože hra začíná
            isReady = false;
            break;
            
        case 'shot_result':
            handleShotResult(data);
            break;
            
        case 'game_over':
            handleGameOver(data);
            break;
            
        case 'opponent_disconnected':
            handleOpponentDisconnection(data);
            break;
            
        case 'error':
            showMessage(data.message, 'error');
            break;
            
        case 'chat_message':
            handleChatMessage(data);
            break;
        case 'not_ready':
            // Pokud server odmítl ready, resetuji stav a zkusím to znovu
            console.log('Server odmítl ready, resetuji stav a zkouším znovu...');
            isReady = false;
            const readyBtn = document.getElementById('readyBtn');
            if (readyBtn) {
                readyBtn.disabled = false;
                readyBtn.textContent = '✅ Jsem připraven';
            }
            setTimeout(() => {
                if (Object.values(myShips).every(ship => ship.placed) && !isReady) {
                    console.log('Odesílám player_ready znovu...');
                    ws.send(JSON.stringify({
                        type: 'player_ready',
                        gameId: gameId
                    }));
                }
            }, 200);
            break;
    }
}

/**
 * Start the game
 */
function startGame(data) {
    gameId = data.gameId;
    playerNumber = data.playerNumber;
    opponentName = data.opponent;
    myName = data.myName || 'Hráč';
    // Pokud mají oba stejné jméno, přidej rozlišení
    if (myName === opponentName) {
        myName = myName + ' (Ty)';
        opponentName = opponentName + ' (Protivník)';
    }
    // Uložím si playerId z game_start
    if (ws) ws.playerId = data.playerId;
    gameState = 'setup';
    console.log('startGame:', { gameId, playerNumber, opponentName, myName, playerId: data.playerId });
    showGameInterface();
    showMessage(`Hra začíná! Tvůj protivník: ${opponentName}`, 'success');
    console.log('myShips at start:', myShips);
    console.log('myBoard at start:', myBoard);
}

/**
 * Show the main game interface
 */
function showGameInterface() {
    const gameContainer = document.querySelector('.game-container');
    gameContainer.innerHTML = `
        <h1>🚢 Lodě - Online Multiplayer</h1>
        
        <div class="game-info">
            <div class="player-info">
                <span class="player-name">${myName}</span>
                <span class="opponent-name">${opponentName}</span>
            </div>
            <div class="connection-indicator" id="connectionIndicator">
                <span class="dot connected"></span>
                Online
            </div>
        </div>

        <div class="game-phase" id="gamePhase">Umísti své lodě na herní pole</div>

        <div class="setup-controls" id="setupControls">
            <button class="control-btn" onclick="toggleOrientation()">
                <span id="orientationText">Horizontálně</span>
            </button>
            <button class="control-btn" onclick="randomPlacement()">🎲 Náhodné umístění</button>
            <button class="control-btn" onclick="clearBoard()">🗑️ Vymazat vše</button>
            <button class="control-btn" onclick="toggleEditMode()" id="editBtn">✏️ Upravit lodě</button>
            <button class="control-btn" onclick="readyUp()" id="readyBtn" disabled>✅ Jsem připraven</button>
        </div>

        <div class="edit-mode-info" id="editModeInfo">
            📝 Režim úprav: Klikni na loď pro její odstranění, pak ji umísti znovu
        </div>

        <div class="ship-list" id="shipList">
            <div class="ship-item" data-ship="carrier">
                <div>Letadlová loď</div>
                <div>(5 polí)</div>
            </div>
            <div class="ship-item" data-ship="battleship">
                <div>Bitevní loď</div>
                <div>(4 pole)</div>
            </div>
            <div class="ship-item" data-ship="cruiser">
                <div>Křižník</div>
                <div>(3 pole)</div>
            </div>
            <div class="ship-item" data-ship="submarine">
                <div>Ponorka</div>
                <div>(3 pole)</div>
            </div>
            <div class="ship-item" data-ship="destroyer">
                <div>Torpédoborec</div>
                <div>(2 pole)</div>
            </div>
        </div>

        <div class="boards-container">
            <div class="board-section">
                <div class="board-title">Tvé lodě</div>
                <div class="game-board" id="myBoard"></div>
            </div>
            <div class="board-section">
                <div class="board-title">Nepřátelské vody</div>
                <div class="game-board" id="opponentBoard"></div>
            </div>
        </div>

        <div class="stats" id="gameStats">
            <div class="stat-item">
                <div class="stat-label">Tvé lodě</div>
                <div class="stat-value" id="myShips">5</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Protivníkovy lodě</div>
                <div class="stat-value" id="opponentShips">5</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Tvé výstřely</div>
                <div class="stat-value" id="myShots">0</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Protivníkovy výstřely</div>
                <div class="stat-value" id="opponentShots">0</div>
            </div>
        </div>

        <div class="chat-container" id="chatContainer">
            <div class="chat-messages" id="chatMessages"></div>
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="Napiš zprávu..." maxlength="100">
                <button onclick="sendChatMessage()" class="control-btn">📤</button>
            </div>
        </div>

        <div class="message" id="gameMessage"></div>

        <div class="game-controls">
            <button class="control-btn" onclick="newGame()">🔄 Nová hra</button>
            <button class="control-btn" onclick="disconnect()">❌ Opustit hru</button>
        </div>
    `;
    
    createBoards();
    addShipListeners();
    updateDisplay();
}

/**
 * Create game boards
 */
function createBoards() {
    const myBoardElement = document.getElementById('myBoard');
    const opponentBoardElement = document.getElementById('opponentBoard');
    
    // Create my board
    myBoardElement.innerHTML = '';
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleMyBoardClick(i));
        myBoardElement.appendChild(cell);
    }
    
    // Create opponent board
    opponentBoardElement.innerHTML = '';
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleOpponentBoardClick(i));
        opponentBoardElement.appendChild(cell);
    }
}

/**
 * Handle clicks on my board
 */
function handleMyBoardClick(index) {
    console.log('Kliknuto na pole:', index, 'selectedShip:', selectedShip, 'editMode:', editMode, 'gameState:', gameState, 'myShips:', JSON.stringify(myShips));
    if (gameState !== 'setup') return;
    const row = Math.floor(index / 10);
    const col = index % 10;
    if (editMode && myBoard[row][col] > 0) {
        removeShipAt(row, col);
        updateDisplay();
        checkAllShipsPlaced();
        return;
    }
    if (!selectedShip || myShips[selectedShip].placed) {
        showMessage('Nejprve vyber typ lodě!', 'error');
        return;
    }
    if (gameId == null) {
        showMessage('Chyba: Hra není inicializována (gameId není nastaveno).', 'error');
        return;
    }
    // Debug log
    console.log('Placing ship:', { gameId, selectedShip, row, col, isHorizontal, size: myShips[selectedShip].size });
    if (canPlaceShip(myBoard, row, col, myShips[selectedShip].size, isHorizontal)) {
        placeShip(myBoard, row, col, myShips[selectedShip].size, isHorizontal, 1);
        myShips[selectedShip].placed = true;
        console.log('Po umístění lodě, myBoard:', JSON.stringify(myBoard));
        ws.send(JSON.stringify({
            type: 'place_ship',
            gameId: gameId,
            shipType: selectedShip,
            row: row,
            col: col,
            orientation: isHorizontal
        }));
        selectedShip = null;
        updateDisplay();
        checkAllShipsPlaced();
    } else {
        console.log('Nelze umístit loď na tuto pozici:', { row, col, size: myShips[selectedShip].size, isHorizontal });
    }
}

/**
 * Handle clicks on opponent board
 */
function handleOpponentBoardClick(index) {
    if (gameState !== 'playing' || !isMyTurn) return;
    
    const row = Math.floor(index / 10);
    const col = index % 10;
    
    if (myShots[row][col] !== 0) {
        showMessage('Již jsi střílel na toto pole!', 'warning');
        return;
    }
    
    // Send shot to server
    ws.send(JSON.stringify({
        type: 'fire_shot',
        gameId: gameId,
        row: row,
        col: col
    }));
}

/**
 * Handle opponent ship placement
 */
function handleOpponentShipPlacement(data) {
    // Update opponent's board (we don't see their ships, just track for game logic)
    showMessage(`${opponentName} umístil loď`, 'info');
    // Po každé odpovědi ship_placed zkontroluji, jestli jsem ready
    setTimeout(() => {
        if (Object.values(myShips).every(ship => ship.placed) && !isReady) {
            ws.send(JSON.stringify({
                type: 'player_ready',
                gameId: gameId
            }));
        }
    }, 100); // malá prodleva kvůli asynchronnímu zpracování
}

/**
 * Start combat phase
 */
function startCombatPhase(data) {
    gameState = 'playing';
    // Porovnávám s ws.playerId
    isMyTurn = data.currentPlayer === ws.playerId;
    
    document.getElementById('setupControls').style.display = 'none';
    document.getElementById('shipList').style.display = 'none';
    document.getElementById('editModeInfo').style.display = 'none';
    
    document.getElementById('gamePhase').textContent = isMyTurn ?
        'Jsi na tahu! Klikni na nepřátelské pole.' :
        `Čekáš na tah: ${opponentName}`;
    
    showMessage('Hra začíná!', 'success');
}

/**
 * Handle shot result
 */
function handleShotResult(data) {
    const { playerId, row, col, hit, shipSunk, nextPlayer, nextPlayerName } = data;
    let overlayEmoji = '';
    let overlayMsg = '';
    if (playerId === ws.playerId) {
        // My shot
        myShots[row][col] = hit ? 2 : 1;
        totalShots.me++;
        if (hit) {
            if (shipSunk) {
                shipsSunk.opponent++;
                showMessage('Dobrá práce, piráte. Doraž ho ať jsi vládcem moří.', 'success');
                overlayEmoji = '💀';
                overlayMsg = 'Potopil jsi loď!';
            } else {
                showMessage('Piráte, doraž ho', 'hit');
                overlayEmoji = '🎯';
                overlayMsg = 'Zásah!';
            }
        } else {
            showMessage('🌊 Minul!', 'miss');
            overlayEmoji = '🌊';
            overlayMsg = 'Voda!';
        }
    } else {
        // Opponent's shot
        opponentShots[row][col] = hit ? 2 : 1;
        totalShots.opponent++;
        if (hit) {
            if (shipSunk) {
                shipsSunk.me++;
                showMessage('💀 ' + opponentName + ' potopil tvou loď! Bojuj dál o přežití.', 'error');
                overlayEmoji = '💀';
                overlayMsg = opponentName + ' potopil tvou loď!';
            } else {
                showMessage('Tvoje loď byla zasažena. Bojuj dál o přežití.', 'hit');
                overlayEmoji = '🎯';
                overlayMsg = opponentName + ' trefil tvou loď!';
            }
        } else {
            showMessage('🌊 ' + opponentName + ' minul!', 'miss');
            overlayEmoji = '🌊';
            overlayMsg = opponentName + ' minul!';
        }
    }
    if (overlayEmoji && overlayMsg) {
        showShotOverlay(overlayEmoji, overlayMsg);
    }
    // Porovnávám s ws.playerId
    isMyTurn = nextPlayer === ws.playerId;
    document.getElementById('gamePhase').textContent = isMyTurn ?
        'Jsi na tahu! Klikni na nepřátelské pole.' :
        `Čekáš na tah: ${opponentName}`;
    updateDisplay();
}

/**
 * Handle game over
 */
function handleGameOver(data) {
    gameState = 'finished';
    const isWinner = data.winner === ws.playerId;
    
    if (isWinner) {
        showMessage(`🎉 Gratulujeme! Vyhrál jsi proti ${data.loserName}!`, 'victory');
    } else {
        showMessage(`😔 ${data.winnerName} vyhrál! Zkus to znovu!`, 'defeat');
    }
    
    document.getElementById('gamePhase').textContent = isWinner ? 'Vítězství!' : 'Prohra';
}

/**
 * Handle opponent disconnection
 */
function handleOpponentDisconnection(data) {
    showMessage('Protivník se odpojil. Hra končí.', 'warning');
    gameState = 'disconnected';
}

/**
 * Send chat message
 */
function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (message && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'chat_message',
            gameId: gameId,
            message: message
        }));
        
        chatInput.value = '';
    }
}

/**
 * Handle chat message
 */
function handleChatMessage(data) {
    chatMessages.push(data);
    updateChatDisplay();
}

/**
 * Update chat display
 */
function updateChatDisplay() {
    const chatMessagesElement = document.getElementById('chatMessages');
    if (!chatMessagesElement) return;
    
    chatMessagesElement.innerHTML = chatMessages.map(msg => `
        <div class="chat-message">
            <span class="chat-sender">${msg.playerName}:</span>
            <span class="chat-text">${msg.message}</span>
        </div>
    `).join('');
    
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}

/**
 * Ready up for combat
 */
function readyUp() {
    if (isReady) return;
    
    isReady = true;
    document.getElementById('readyBtn').disabled = true;
    document.getElementById('readyBtn').textContent = '⏳ Čekám na protivníka...';
    
    showMessage('Jsi připraven! Čekám na protivníka...', 'info');

    // Odeslat serveru informaci o připravenosti
    console.log('Uživatel klikl na ready, odesílám player_ready...');
    ws.send(JSON.stringify({
        type: 'player_ready',
        gameId: gameId
    }));
}

/**
 * Handle disconnection
 */
function handleDisconnection() {
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(() => {
            showMessage(`Připojování... (${reconnectAttempts}/${maxReconnectAttempts})`, 'info');
            connectToServer();
        }, 2000);
    } else {
        showMessage('Nelze se připojit k serveru. Zkus to později.', 'error');
    }
}

/**
 * Disconnect from game
 */
function disconnect() {
    if (ws) {
        ws.close();
    }
    initMultiplayerGame();
}

/**
 * New game
 */
function newGame() {
    disconnect();
}

// Game logic functions (same as before)
function selectShip(shipType) {
    if (editMode) return;
    
    if (myShips[shipType].placed) return;
    
    selectedShip = shipType;
    updateDisplay();
}

function addShipListeners() {
    document.querySelectorAll('.ship-item').forEach(item => {
        item.addEventListener('click', () => {
            selectShip(item.dataset.ship);
        });
    });
}

function toggleEditMode() {
    editMode = !editMode;
    const editBtn = document.getElementById('editBtn');
    const editInfo = document.getElementById('editModeInfo');
    
    if (editMode) {
        editBtn.textContent = '✅ Hotovo';
        editBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        editInfo.style.display = 'block';
        selectedShip = null;
    } else {
        editBtn.textContent = '✏️ Upravit lodě';
        editBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        editInfo.style.display = 'none';
    }
    
    updateDisplay();
}

function toggleOrientation() {
    isHorizontal = !isHorizontal;
    document.getElementById('orientationText').textContent = isHorizontal ? 'Horizontálně' : 'Vertikálně';
}

function randomPlacement() {
    // Clear board
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            myBoard[i][j] = 0;
        }
    }
    Object.keys(myShips).forEach(ship => myShips[ship].placed = false);
    
    const shipSizes = [5, 4, 3, 3, 2];
    const shipNames = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
    
    shipSizes.forEach((size, index) => {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
            const row = Math.floor(Math.random() * 10);
            const col = Math.floor(Math.random() * 10);
            const horizontal = Math.random() < 0.5;
            
            if (canPlaceShip(myBoard, row, col, size, horizontal)) {
                placeShip(myBoard, row, col, size, horizontal, 1);
                myShips[shipNames[index]].placed = true;
                
                // Send to server
                ws.send(JSON.stringify({
                    type: 'place_ship',
                    gameId: gameId,
                    shipType: shipNames[index],
                    row: row,
                    col: col,
                    orientation: horizontal
                }));
                
                placed = true;
            }
            attempts++;
        }
    });
    
    selectedShip = null;
    updateDisplay();
    checkAllShipsPlaced();
    console.log('randomPlacement:', { myShips, myBoard });
}

function clearBoard() {
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            myBoard[i][j] = 0;
        }
    }
    Object.keys(myShips).forEach(ship => myShips[ship].placed = false);
    selectedShip = null;
    editMode = false;
    document.getElementById('editBtn').textContent = '✏️ Upravit lodě';
    document.getElementById('editBtn').style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    document.getElementById('editModeInfo').style.display = 'none';
    updateDisplay();
    checkAllShipsPlaced();
}

function removeShipAt(row, col) {
    const visited = Array(10).fill().map(() => Array(10).fill(false));
    const shipCells = [];
    
    function findShip(r, c) {
        if (r < 0 || r >= 10 || c < 0 || c >= 10 || visited[r][c] || myBoard[r][c] === 0) {
            return;
        }
        visited[r][c] = true;
        shipCells.push([r, c]);
        
        findShip(r - 1, c);
        findShip(r + 1, c);
        findShip(r, c - 1);
        findShip(r, c + 1);
    }
    
    findShip(row, col);
    
    shipCells.forEach(([r, c]) => {
        myBoard[r][c] = 0;
    });
    
    const shipSize = shipCells.length;
    const shipTypes = Object.keys(myShips);
    
    for (let shipType of shipTypes) {
        if (myShips[shipType].size === shipSize && myShips[shipType].placed) {
            myShips[shipType].placed = false;
            break;
        }
    }
}

function canPlaceShip(board, row, col, size, horizontal) {
    console.log('canPlaceShip:', { row, col, size, horizontal });
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
    console.log('placeShip:', { row, col, size, horizontal, value });
    if (horizontal) {
        for (let i = 0; i < size; i++) {
            board[row][col + i] = value;
        }
    } else {
        for (let i = 0; i < size; i++) {
            board[row + i][col] = value;
        }
    }
    console.log('Stav boardu po placeShip:', JSON.stringify(board));
}

function checkAllShipsPlaced() {
    const allPlaced = Object.values(myShips).every(ship => ship.placed);
    document.getElementById('readyBtn').disabled = !allPlaced;
    if (allPlaced && !isReady) {
        // Automaticky odeslat player_ready, ale nenastavovat isReady = true
        console.log('Všechny lodě umístěny, odesílám player_ready...');
        ws.send(JSON.stringify({
            type: 'player_ready',
            gameId: gameId
        }));
    }
}

function updateDisplay() {
    console.log('updateDisplay: myShips:', JSON.stringify(myShips), 'myBoard:', JSON.stringify(myBoard));
    updateBoard('myBoard', myBoard, opponentShots, true);
    updateBoard('opponentBoard', opponentBoard, myShots, false);
    updateShipList();
    updateStats();
}

function updateBoard(boardId, board, shots, showShips) {
    console.log('updateBoard:', { boardId, showShips, board: JSON.stringify(board) });
    const boardElement = document.getElementById(boardId);
    const cells = boardElement.querySelectorAll('.cell');
    
    cells.forEach((cell, index) => {
        const row = Math.floor(index / 10);
        const col = index % 10;

        // Vždy začni s čistou třídou
        cell.className = 'cell';

        // PRIORITA: sunk > hit > miss > ship
        if (shots && shots[row][col] === 3) {
            cell.classList.add('sunk');
        } else if (shots && shots[row][col] === 2) {
            cell.classList.add('hit');
        } else if (shots && shots[row][col] === 1) {
            cell.classList.add('miss');
        } else if (showShips && board[row][col] > 0) {
            cell.classList.add('ship');
            if (editMode) {
                cell.classList.add('editable');
            }
        }
        // Speciální logika pro moje pole: pokud je tam loď a byla potopena, zobraz sunk a nikdy hit
        if (boardId === 'myBoard' && board[row][col] > 0) {
            if (opponentShots[row][col] === 3) {
                cell.classList.remove('hit');
                cell.classList.add('sunk');
            } else if (opponentShots[row][col] === 2 && opponentShots[row][col] !== 3) {
                cell.classList.add('hit');
            }
        }
    });
}

function updateShipList() {
    Object.keys(myShips).forEach(shipType => {
        const shipElement = document.querySelector(`[data-ship="${shipType}"]`);
        if (shipElement) {
            shipElement.className = 'ship-item';
            
            if (myShips[shipType].placed) {
                shipElement.classList.add('placed');
            } else if (selectedShip === shipType) {
                shipElement.classList.add('selected');
            }
        }
    });
}

function updateStats() {
    document.getElementById('myShips').textContent = 5 - shipsSunk.me;
    document.getElementById('opponentShips').textContent = 5 - shipsSunk.opponent;
    document.getElementById('myShots').textContent = totalShots.me;
    document.getElementById('opponentShots').textContent = totalShots.opponent;
}

function showMessage(text, type = '') {
    const messageElement = document.getElementById('gameMessage');
    if (messageElement) {
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        
        if (type !== 'victory' && type !== 'defeat') {
            setTimeout(() => {
                if (messageElement.textContent === text) {
                    messageElement.textContent = '';
                    messageElement.className = 'message';
                }
            }, 3000);
        }
    }
}

function showShotOverlay(emoji, message) {
    let overlay = document.getElementById('shotOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'shotOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.background = 'rgba(0,0,0,0.7)';
        overlay.style.transition = 'opacity 0.5s';
        overlay.style.opacity = '0';
        overlay.innerHTML = '';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div style="font-size: 8rem; margin-bottom: 1rem;">${emoji}</div>
        <div style="font-size: 2.5rem; color: white; text-shadow: 0 2px 8px #000;">${message}</div>
    `;
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
    }, 2000);
}

// Initialize multiplayer game when page loads
document.addEventListener('DOMContentLoaded', initMultiplayerGame); 