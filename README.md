# 🚢 Lodě - Battleship Game

A modern, responsive two-player battleship game built with HTML, CSS, and JavaScript. Perfect for playing with friends on any device!

## 🌟 Features

- **Two-player gameplay** - Take turns placing ships and attacking
- **Interactive ship placement** - Drag and drop ships with horizontal/vertical orientation
- **Random placement** - Let the computer place ships for you
- **Edit mode** - Remove and replace ships during setup
- **Beautiful animations** - Smooth transitions and visual feedback
- **Responsive design** - Works perfectly on desktop, tablet, and mobile
- **Czech language** - Fully localized interface
- **Statistics tracking** - Monitor ships remaining and shots fired
- **Turn transitions** - Smooth handoff between players

## 🎮 How to Play

### Setup Phase
1. **Player 1** places their ships on the board
2. Select a ship type from the list (Carrier, Battleship, Cruiser, Submarine, Destroyer)
3. Click on the board to place the ship
4. Toggle orientation (horizontal/vertical) as needed
5. Use "Random Placement" for quick setup
6. Use "Edit Mode" to remove and replace ships
7. Click "Next Phase" when all ships are placed

### Combat Phase
1. **Player 1** takes the first shot
2. Click on the enemy's board to fire
3. Visual feedback shows hits (🔥), misses (🌊), and sunk ships (💀)
4. Players take turns until one player sinks all enemy ships
5. Winner is announced with celebration animation

## 🚀 Installation & Deployment

### Local Development
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start playing immediately!

### Server Deployment
1. Upload all files to your web server
2. Ensure the file structure is maintained:
   ```
   battleship-game/
   ├── index.html
   ├── css/
   │   └── style.css
   ├── js/
   │   └── game.js
   ├── assets/
   │   └── favicon.ico
   └── README.md
   ```
3. Access via your domain: `https://yourdomain.com/battleship-game/`

### GitHub Pages
1. Push this repository to GitHub
2. Go to Settings > Pages
3. Select source branch (usually `main`)
4. Your game will be available at: `https://username.github.io/repository-name/`

## 📱 Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Customization

### Colors
Edit `css/style.css` to change the color scheme:
```css
:root {
    --primary-color: #1e3c72;
    --secondary-color: #2a5298;
    --accent-color: #00ff88;
    --ship-color: #2c3e50;
    --hit-color: #e74c3c;
    --miss-color: #95a5a6;
}
```

### Ship Types
Modify ship configurations in `js/game.js`:
```javascript
const shipTemplates = {
    carrier: { size: 5, placed: false },
    battleship: { size: 4, placed: false },
    cruiser: { size: 3, placed: false },
    submarine: { size: 3, placed: false },
    destroyer: { size: 2, placed: false }
};
```

## 🔧 Technical Details

### Architecture
- **HTML5** - Semantic markup and accessibility
- **CSS3** - Modern styling with animations and responsive design
- **Vanilla JavaScript** - No dependencies, fast and lightweight
- **Grid Layout** - CSS Grid for perfect board alignment
- **Flexbox** - Responsive layouts and centering

### Performance
- Optimized animations using CSS transforms
- Efficient DOM manipulation
- Minimal memory usage
- Fast loading times

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- Clear visual feedback

## 🐛 Known Issues

- None currently reported

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the classic Battleship board game
- Built with modern web technologies
- Designed for maximum user experience
- Optimized for all devices and screen sizes

## 📞 Support

If you encounter any issues or have suggestions:
1. Check the browser console for errors
2. Ensure all files are properly uploaded
3. Try refreshing the page
4. Contact the developer with details

---

**Enjoy playing Battleship! 🚢⚓** 