# Render Deployment Configuration

## Setup Steps

1. **Create Render Account**
   - Go to render.com and create an account
   - Connect your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Choose the backend folder: `/backend`

3. **Configuration Settings**
   - **Name**: `chrysalis-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (for testing) or `Starter` (for production)

4. **Environment Variables**
   Add these environment variables in Render dashboard:

   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://neondb_owner:npg_sdwOblMUk01P@ep-sparkling-firefly-a20g2oj9-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=chrysalis-super-secret-jwt-key-meditation-app-2024
   CLOUDINARY_CLOUD_NAME=ddblpagys
   CLOUDINARY_API_KEY=718768962237724
   CLOUDINARY_API_SECRET=HxmlPrLJM_a520dsLU59JVuvrjk
   SENTRY_DSN=https://6acc12b11e24a68b3c8b2c98eede7bcd@o4508690777956352.ingest.us.sentry.io/4508690779267072
   CORS_ORIGINS=https://chrysalis-meditation.netlify.app,https://main--chrysalis-meditation.netlify.app,http://localhost:5173
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend
   - Your API will be available at: `https://chrysalis-backend-XXXX.onrender.com`

## Health Check

Once deployed, test your API:
```bash
curl https://your-render-url.onrender.com/health
```

## Database Connection

The backend is configured to connect to the existing Neon PostgreSQL database. No additional database setup is required.

## Monitoring

- View logs in the Render dashboard
- Set up health checks on `/health` endpoint
- Monitor performance and usage
