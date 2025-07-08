# CHRYSALIS Backend API

A Node.js/Express backend API for the Chrysalis meditation app, deployed on Render.

## Features

- RESTful API with Express.js
- PostgreSQL database (Neon)
- JWT authentication
- File upload with Cloudinary
- Rate limiting and security middleware
- CORS configuration
- Error handling and logging

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-profile-picture` - Upload profile picture

### Sessions
- `POST /api/sessions/complete` - Complete meditation session
- `GET /api/sessions/history` - Get session history
- `POST /api/sessions/pause` - Pause session
- `POST /api/sessions/resume` - Resume session

### Friends
- `GET /api/friends/list` - Get friends list
- `GET /api/friends/requests` - Get friend requests
- `POST /api/friends/add` - Send friend request
- `POST /api/friends/accept` - Accept friend request
- `POST /api/friends/decline` - Decline friend request
- `DELETE /api/friends/remove` - Remove friend
- `GET /api/friends/search` - Search users

### Groups
- `GET /api/groups/list` - Get user's groups
- `GET /api/groups/:id/details` - Get group details
- `POST /api/groups/create` - Create group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group
- `GET /api/groups/:id/leaderboard` - Get group leaderboard

### Leaderboards
- `GET /api/leaderboards/global` - Global leaderboard
- `GET /api/leaderboards/friends` - Friends leaderboard
- `GET /api/leaderboards/local` - Local leaderboard

### Presence
- `GET /api/presence/sessions` - Get presence sessions
- `POST /api/presence/sessions` - Record presence session
- `GET /api/presence/stats` - Get presence statistics

### Wisdom
- `GET /api/wisdom/quotes` - Get random quotes
- `GET /api/wisdom/quotes/daily` - Get daily quote
- `GET /api/wisdom/categories` - Get quote categories

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=your-neon-database-url
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
SENTRY_DSN=your-sentry-dsn
CORS_ORIGINS=your-allowed-origins
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Deployment

This backend is designed to be deployed on Render. The deployment automatically:

1. Installs dependencies
2. Sets up environment variables
3. Starts the Express server
4. Connects to the Neon PostgreSQL database

## Health Check

Visit `/health` to check server status.
