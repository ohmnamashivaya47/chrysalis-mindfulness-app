# 🚀 CHRYSALIS - Deployment Instructions

## GitHub Repository Setup

### 1. Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a new repository
2. Repository name: `chrysalis-meditation-app`
3. Make it public or private (your choice)
4. Do NOT initialize with README (we already have one)

### 2. Push to GitHub
Run these commands in your terminal:

```bash
cd /Users/sachinphilander/Desktop/ohm

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/chrysalis-meditation-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🖥️ Backend Deployment (Render)

### 1. Connect to Render
1. Go to [Render.com](https://render.com)
2. Sign up/Login with your GitHub account
3. Click "New +" → "Web Service"
4. Connect your `chrysalis-meditation-app` repository

### 2. Render Configuration
- **Name**: `chrysalis-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Environment Variables
Add these in Render dashboard:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
NEON_DATABASE_URL=your-neon-postgres-connection-string
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
SENTRY_DSN=your-sentry-dsn-url-optional
PORT=3001
```

### 4. Deploy Backend
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Note your backend URL: `https://chrysalis-backend.onrender.com`

## 🌐 Frontend Deployment (Netlify)

### 1. Update Environment Variables
Before deploying frontend, update `src/services/api.ts`:

```typescript
private baseUrl = import.meta.env.DEV 
  ? 'http://localhost:3001/api'
  : 'https://YOUR_RENDER_APP_NAME.onrender.com/api';
```

Replace `YOUR_RENDER_APP_NAME` with your actual Render app name.

### 2. Deploy to Netlify
1. Go to [Netlify.com](https://netlify.com)
2. "Add new site" → "Import from Git"
3. Choose your GitHub repository
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Root directory: `/` (leave empty)

### 3. Environment Variables (Netlify)
Add in Netlify dashboard → Site settings → Environment variables:

```
VITE_API_URL=https://YOUR_RENDER_APP_NAME.onrender.com/api
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_SENTRY_DSN=your-sentry-dsn-optional
```

## 🔧 Database Setup (Neon)

### 1. Create Neon Database
1. Go to [Neon.tech](https://neon.tech)
2. Create new project: "Chrysalis Meditation DB"
3. Copy connection string

### 2. Run Database Schema
Use the connection string in `backend/.env` and the schema will auto-initialize.

## ✅ Verification Checklist

### Backend Health Check
- [ ] Visit: `https://YOUR_RENDER_APP.onrender.com/health`
- [ ] Should return: `{"status":"ok","service":"chrysalis-backend"}`

### Frontend Check
- [ ] Visit your Netlify URL
- [ ] Registration/Login works
- [ ] Groups and Friends features load
- [ ] QR code generation/scanning works

### Database Check
- [ ] New user registration creates database entries
- [ ] Login authenticates properly
- [ ] Group creation works

## 🐛 Troubleshooting

### Common Issues:

1. **Backend 503 Error**: Check environment variables, especially `NEON_DATABASE_URL`
2. **Frontend API Errors**: Verify `VITE_API_URL` points to correct Render URL
3. **CORS Errors**: Backend has CORS configured for all origins in production
4. **Database Connection**: Neon free tier has connection limits, upgrade if needed

### Monitoring:
- **Backend Logs**: Render Dashboard → Your Service → Logs
- **Frontend Logs**: Netlify Dashboard → Your Site → Functions/Deploys
- **Database**: Neon Dashboard → Your Project → Monitor

## 🎉 Production URLs

After deployment, your app will be available at:
- **Frontend**: `https://YOUR_NETLIFY_SITE.netlify.app`
- **Backend**: `https://YOUR_RENDER_APP.onrender.com`

## 📱 Features Ready for Production

✅ **Core Features**:
- User authentication (registration/login)
- Meditation session tracking
- User profiles with picture upload
- Friends system (add, accept, search)
- Groups system with QR codes
- Global/Friends/Groups leaderboards
- Daily wisdom quotes
- Professional onboarding flow

✅ **Technical Features**:
- Responsive design (mobile-first)
- Real-time session tracking
- QR code generation/scanning
- Secure JWT authentication
- PostgreSQL database with Neon
- Cloudinary image uploads
- Professional error handling
- CORS configured
- Rate limiting
- Security headers

## 🔥 Next Steps After Deployment

1. **Test Registration**: Create account and verify email flow
2. **Test Social Features**: Add friends, create groups, join via QR
3. **Test Meditation**: Complete a session, check leaderboards
4. **Monitor Performance**: Check Render/Netlify metrics
5. **Set Up Monitoring**: Configure Sentry alerts
6. **Custom Domain**: Add your own domain to Netlify

---

**🎊 Congratulations! Your Chrysalis meditation app is now live in production!**
