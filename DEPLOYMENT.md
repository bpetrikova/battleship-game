# 🚀 Deployment Guide

This guide will help you deploy your Battleship game to various hosting platforms.

## 📁 File Structure

Your repository should have this structure:
```
battleship-game/
├── index.html          # Main game file
├── css/
│   └── style.css       # Game styles
├── js/
│   └── game.js         # Game logic
├── assets/
│   └── favicon.ico     # Browser icon
├── README.md           # Documentation
├── LICENSE             # MIT License
├── package.json        # Project metadata
├── .gitignore          # Git ignore rules
└── DEPLOYMENT.md       # This file
```

## 🌐 Web Hosting Services

### 1. GitHub Pages (Free)

**Step 1: Create GitHub Repository**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/battleship-game.git
git push -u origin main
```

**Step 2: Enable GitHub Pages**
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section
4. Select "Deploy from a branch"
5. Choose "main" branch
6. Click "Save"

**Step 3: Access Your Game**
Your game will be available at: `https://yourusername.github.io/battleship-game/`

### 2. Netlify (Free)

**Step 1: Upload Files**
1. Go to [netlify.com](https://netlify.com)
2. Sign up/Login
3. Click "New site from Git" or "Deploy manually"
4. Drag and drop your `battleship-game` folder
5. Wait for deployment

**Step 2: Custom Domain (Optional)**
1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow the instructions

### 3. Vercel (Free)

**Step 1: Deploy**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

### 4. Traditional Web Hosting

**Step 1: Upload via FTP**
1. Use FileZilla or similar FTP client
2. Connect to your hosting server
3. Upload all files maintaining the folder structure
4. Ensure `index.html` is in the root directory

**Step 2: Set Permissions**
```bash
chmod 644 *.html *.css *.js *.ico
chmod 755 css/ js/ assets/
```

## 🔧 Local Development

### Using Python (Built-in)
```bash
cd battleship-game
python3 -m http.server 8000
# Open http://localhost:8000
```

### Using Node.js
```bash
cd battleship-game
npx live-server --port=8000
# Open http://localhost:8000
```

### Using PHP
```bash
cd battleship-game
php -S localhost:8000
# Open http://localhost:8000
```

## 📱 Mobile Testing

### iOS Safari
1. Deploy to a public URL
2. Open Safari on iPhone/iPad
3. Navigate to your game URL
4. Add to Home Screen for app-like experience

### Android Chrome
1. Deploy to a public URL
2. Open Chrome on Android
3. Navigate to your game URL
4. Add to Home Screen

## 🔍 Troubleshooting

### Common Issues

**1. Game not loading**
- Check browser console for errors
- Ensure all files are uploaded
- Verify file paths are correct

**2. Styling issues**
- Clear browser cache
- Check CSS file is accessible
- Verify CSS syntax

**3. JavaScript errors**
- Check browser console
- Ensure JavaScript file is loaded
- Verify no syntax errors

**4. Mobile responsiveness**
- Test on actual devices
- Check viewport meta tag
- Verify CSS media queries

### Performance Optimization

**1. Enable Gzip Compression**
Add to `.htaccess` (Apache):
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

**2. Set Cache Headers**
Add to `.htaccess`:
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
</IfModule>
```

## 🌍 CDN Integration (Optional)

For better performance, you can use CDNs:

**CSS (if needed)**
```html
<link href="https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css" rel="stylesheet">
```

**JavaScript (if needed)**
```html
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
```

## 📊 Analytics (Optional)

Add Google Analytics:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔒 Security Considerations

1. **HTTPS Only** - Always use HTTPS in production
2. **Content Security Policy** - Add CSP headers if needed
3. **No Sensitive Data** - Game doesn't store personal information
4. **Regular Updates** - Keep dependencies updated

## 📈 Monitoring

### Uptime Monitoring
- Use services like UptimeRobot or Pingdom
- Monitor your game URL
- Set up alerts for downtime

### Performance Monitoring
- Use Google PageSpeed Insights
- Monitor Core Web Vitals
- Check mobile performance

## 🎯 Success Checklist

- [ ] All files uploaded correctly
- [ ] Game loads without errors
- [ ] Responsive design works on mobile
- [ ] All game features functional
- [ ] HTTPS enabled
- [ ] Custom domain configured (if desired)
- [ ] Analytics set up (if desired)
- [ ] Performance optimized
- [ ] Tested on multiple browsers
- [ ] Tested on mobile devices

---

**Your Battleship game is now ready to play! 🚢⚓** 