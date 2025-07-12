# ⚡ Quick Start Guide

## 🚀 Deploy in 5 Minutes

### Option 1: GitHub Pages (Recommended)
1. **Upload to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/battleship-game.git
   git push -u origin main
   ```

2. **Enable Pages:**
   - Go to repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "main"
   - Save

3. **Your game is live at:** `https://YOUR_USERNAME.github.io/battleship-game/`

### Option 2: Netlify (Drag & Drop)
1. Go to [netlify.com](https://netlify.com)
2. Drag your `battleship-game` folder to the deploy area
3. Wait 30 seconds
4. Your game is live!

### Option 3: Local Testing
```bash
cd battleship-game
python3 -m http.server 8000
# Open http://localhost:8000
```

## 📁 What's Included

- ✅ **index.html** - Complete game interface
- ✅ **css/style.css** - Beautiful responsive design
- ✅ **js/game.js** - Full game logic
- ✅ **README.md** - Comprehensive documentation
- ✅ **DEPLOYMENT.md** - Detailed deployment guide
- ✅ **LICENSE** - MIT license
- ✅ **package.json** - Project metadata

## 🎮 Game Features

- 🚢 Two-player battleship gameplay
- 📱 Fully responsive (mobile-friendly)
- 🎨 Beautiful animations and effects
- 🇨🇿 Czech language interface
- 🎲 Random ship placement
- ✏️ Edit mode for ship management
- 📊 Real-time statistics
- 🏆 Victory celebrations

## 🔧 Customization

### Change Colors
Edit `css/style.css`:
```css
body {
    background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}
```

### Add Analytics
Add to `index.html` before `</head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
```

## 📞 Need Help?

1. Check the browser console for errors
2. Ensure all files are uploaded
3. Verify file paths are correct
4. Read the full `DEPLOYMENT.md` guide

---

**Your Battleship game is ready to play! 🚢⚓** 