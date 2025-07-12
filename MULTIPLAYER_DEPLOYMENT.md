# 🚢 Lodě - Multiplayer Deployment Guide

## Overview
This guide will help you deploy the multiplayer Battleship game to various hosting platforms. The game now includes a Node.js WebSocket server for real-time multiplayer functionality.

## Prerequisites
- Node.js 14.0.0 or higher
- npm or yarn package manager
- Git (for version control)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The game will be available at `http://localhost:3000`

## Deployment Options

### Option 1: Heroku (Recommended for Beginners)

1. **Create Heroku Account**
   - Sign up at [heroku.com](https://heroku.com)

2. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

3. **Login to Heroku**
   ```bash
   heroku login
   ```

4. **Create Heroku App**
   ```bash
   heroku create your-battleship-game
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "Initial multiplayer deployment"
   git push heroku main
   ```

6. **Open Your App**
   ```bash
   heroku open
   ```

### Option 2: Railway

1. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Configure Environment**
   - Railway will automatically detect Node.js
   - Set `PORT` environment variable (optional, Railway sets this automatically)

3. **Deploy**
   - Railway will automatically deploy on every push to main branch

### Option 3: Render

1. **Create Render Account**
   - Sign up at [render.com](https://render.com)

2. **Create New Web Service**
   - Connect your GitHub repository
   - Choose "Node" as the environment
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Deploy**
   - Render will automatically deploy your application

### Option 4: DigitalOcean App Platform

1. **Create DigitalOcean Account**
   - Sign up at [digitalocean.com](https://digitalocean.com)

2. **Create App**
   - Go to App Platform
   - Connect your GitHub repository
   - Choose Node.js environment

3. **Configure**
   - Build command: `npm install`
   - Run command: `npm start`

### Option 5: Vercel (with Serverless Functions)

1. **Create Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)

2. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Configure WebSocket Support**
   - Note: Vercel has limitations with WebSocket connections
   - Consider using a separate WebSocket service like Pusher or Socket.io

### Option 6: AWS/Google Cloud/Azure

For cloud providers, you'll need to:

1. **Set up a VM or container**
2. **Install Node.js**
3. **Clone your repository**
4. **Install dependencies**
5. **Start the server**
6. **Configure firewall rules for port 3000**

## Environment Variables

Create a `.env` file for local development:

```env
PORT=3000
NODE_ENV=production
```

## Production Considerations

### 1. Security
- Add rate limiting
- Implement user authentication
- Use HTTPS/WSS
- Add input validation

### 2. Performance
- Enable compression
- Add caching headers
- Use a CDN for static files
- Monitor server resources

### 3. Scaling
- Use a load balancer
- Implement session management
- Consider Redis for game state
- Use multiple server instances

## Monitoring

### Health Check Endpoint
The server includes a health check at `/health`:
```bash
curl https://your-domain.com/health
```

### Game Status Endpoint
Check game statistics at `/status`:
```bash
curl https://your-domain.com/status
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

2. **WebSocket Connection Failed**
   - Check if your hosting provider supports WebSocket
   - Verify firewall settings
   - Check browser console for errors

3. **Memory Issues**
   - Monitor server memory usage
   - Implement game cleanup
   - Consider using Redis for game state

### Logs
Check server logs for debugging:
```bash
# Heroku
heroku logs --tail

# Railway
railway logs

# Render
# Check logs in dashboard
```

## Development vs Production

### Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production
```bash
npm start    # Uses node directly
```

## SSL/HTTPS Setup

For production, ensure you have SSL certificates:

### Let's Encrypt (Free)
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com
```

### Cloudflare (Recommended)
1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption mode to "Full"

## Backup and Recovery

### Database Backup (if using Redis)
```bash
# Redis backup
redis-cli BGSAVE
```

### Code Backup
- Use Git for version control
- Regular commits and pushes
- Consider automated backups

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review server logs
3. Test with different browsers
4. Verify WebSocket support
5. Check network connectivity

## Next Steps

After deployment:

1. **Test the game** with multiple players
2. **Monitor performance** and server resources
3. **Add analytics** to track usage
4. **Implement user accounts** for persistent stats
5. **Add more game modes** (AI opponent, tournaments)

## Cost Estimation

### Free Tiers
- **Heroku**: Free tier discontinued, paid plans start at $7/month
- **Railway**: $5/month for hobby plan
- **Render**: Free tier available
- **Vercel**: Free tier available (limited WebSocket support)

### Paid Hosting
- **DigitalOcean**: $5/month for basic droplet
- **AWS**: Pay-as-you-go, ~$10-20/month for small instance
- **Google Cloud**: Pay-as-you-go, similar to AWS

Choose based on your expected traffic and budget! 