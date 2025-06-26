# Rehearsal Scheduler Backend API

This is the backend API for the Rehearsal Scheduler mobile app, built with Node.js and Express.

## Features

- User authentication (register/login)
- JWT-based session management
- User profile management
- Actor management with timeslots and scenes
- PostgreSQL database integration
- Ready for deployment on Render.com

## Local Development

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your variables:
   - `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `DATABASE_URL`: Your PostgreSQL connection string

3. **Run the server:**

   ```bash
   npm run dev
   ```

## Deployment to Render.com

### Option 1: Using Render Dashboard

1. **Create a new Web Service:**
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory
   - Use these settings:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

2. **Create a PostgreSQL database:**
   - Add a new PostgreSQL database in Render
   - Copy the connection string

3. **Set environment variables:**
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your PostgreSQL connection string from step 2
   - `JWT_SECRET`: Generate a secure random string

### Option 2: Using render.yaml (Infrastructure as Code)

1. **Update render.yaml:**
   - Edit `render.yaml` and update the service name
   - The file is already configured for automatic deployment

2. **Connect your repository:**
   - In Render dashboard, create a new service from the repository
   - Render will automatically detect and use the `render.yaml` configuration

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Actors

- `GET /api/actors` - Get all actors (requires authentication)

### Health Check

- `GET /health` - Health check endpoint

## Database Schema

### Users Table

- `id` (Primary Key)
- `email` (Unique)
- `password_hash`
- `name`
- `phone`
- `is_actor`
- `created_at`
- `updated_at`

### User Timeslots Table

- `id` (Primary Key)
- `user_id` (Foreign Key)
- `timeslot_id`

### User Scenes Table

- `id` (Primary Key)
- `user_id` (Foreign Key)
- `scene_id`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- CORS protection
- Helmet.js security headers

## Next Steps

After deploying the backend:

1. **Update your React Native app:**
   - Replace the API_BASE_URL in `app/services/api.ts` with your Render.com URL
   - Update your AuthContext to use the API service instead of local storage

2. **Test the integration:**
   - Test user registration and login
   - Test profile updates
   - Test actor functionality

## Getting Your Render.com URL

After deployment, your API will be available at:
`https://your-service-name.onrender.com`

Replace `your-service-name` with the actual name you chose during deployment.
