# 🦋 CHRYSALIS PRESENCE - Production Setup Guide

## Database Setup (FaunaDB)

1. **Create FaunaDB Account & Database:**
   - Go to https://dashboard.fauna.com/
   - Sign up for a free account
   - Create a new database called `chrysalis-presence`

2. **Create Database Schema:**
   - In the FaunaDB Shell, run the contents of `setup-faunadb.fql`
   - This creates all necessary collections and indexes

3. **Get Database Secret:**
   - Go to Security → Database Access Keys
   - Create a new key with "Server" role
   - Copy the secret key

4. **Set Environment Variables:**
   ```bash
   netlify env:set FAUNADB_SECRET "your-fauna-secret-here"
   ```

## Environment Variables Set
✅ JWT_SECRET: `ctBi4KOMFpYQqR11oXRgSEiGq0rh4pMoZtK96IdWGRo=`
🔄 FAUNADB_SECRET: (You need to set this)

## Deployment
Once you have the FaunaDB secret:
```bash
npm run deploy
```

## Live URLs
- **App URL**: https://chrysalis-presence-app.netlify.app
- **Admin**: https://app.netlify.com/projects/chrysalis-presence-app

## Features Deployed
- ✅ React 18 + TypeScript + Vite
- ✅ Tailwind CSS + Framer Motion
- ✅ Netlify Functions (serverless API)
- ✅ JWT Authentication
- ✅ FaunaDB Integration
- ✅ PWA (offline support)
- ✅ Presence Detection System
- ✅ Breathing Guides
- ✅ Progress Tracking

## Test the Authentication
Once deployed, you can:
1. Sign up with email/password
2. Sign in to your account
3. Start presence detection
4. Trigger breathing sessions
5. Track your progress

## Database Collections
- `users` - User accounts and profiles
- `presence_sessions` - Mindfulness sessions
- `wisdom_quotes` - Daily inspiration
- `user_stats` - Progress tracking

## Security Features
- 🔐 JWT-based authentication
- 🛡️ Secure password hashing (bcrypt)
- 🔒 Environment-based secrets
- 🚫 CORS protection
- 📊 Request validation
