const express = require('express'); 
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Load environment variables - dotenv will look for .env in the current working directory
require('dotenv').config();

const { initDB } = require('./models/database');
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const actorsRoutes = require('./routes/actors');
const weeklyAvailabilityRoutes = require('./routes/weeklyAvailability');
const scenesRoutes = require('./routes/scenes');
const rehearsalsRoutes = require('./routes/rehearsals');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render.com deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      // Allow all localhost origins during development
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
        callback(null, true);
        return;
      }
    }
    
    const allowedOrigins = [
      'http://localhost:8081', // For Expo development server
      'http://localhost:8082', // Alternative frontend port
      'http://localhost:8083', // Additional development port
      'https://rehearsal-scheduler.onrender.com',
      'https://rehearsal-scheduler-frontend.onrender.com'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Security middleware
app.use(helmet());

// Rate limiting - very permissive for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: process.env.NODE_ENV === 'development' ? 10000 : 1000, // 10k requests per minute in dev, 1k in prod
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting entirely for development environment
    return process.env.NODE_ENV === 'development';
  }
});

// Only apply rate limiting in production
if (process.env.NODE_ENV !== 'development') {
  app.use(limiter);
  console.log('🛡️ Rate limiting enabled for production');
} else {
  console.log('🔓 Rate limiting disabled for development');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📝 [${timestamp}] ${req.method} ${req.url}`);
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/actors', actorsRoutes);
app.use('/api/weekly-availability', weeklyAvailabilityRoutes);
app.use('/api/scenes', scenesRoutes);
app.use('/api/rehearsals', rehearsalsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Version endpoint to verify deployment
app.get('/version', (req, res) => {
  res.json({
    version: '2.0.0',
    buildTime: new Date().toISOString(),
    features: ['rehearsals-api', 'actor-id-fix', 'navigation-fix'],
    commit: 'eb7a80b468e7b4b737b187209e6265718f19179d',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint - provide API information
app.get('/', (req, res) => {
  res.json({
    name: 'Rehearsal Scheduler API',
    version: '1.0.0',
    status: 'online',
    description: 'Backend API for the Rehearsal Scheduler mobile and web application',
    endpoints: {
      health: {
        'GET /health': 'API health check'
      },
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user', 
        'GET /api/auth/me': 'Get current user (requires auth)',
        'PUT /api/auth/profile': 'Update user profile (requires auth)'
      },
      actors: {
        'GET /api/actors': 'Get all actors (requires auth)',
        'POST /api/actors': 'Create a new actor (requires auth)',
        'PUT /api/actors/:id': 'Update an actor (requires auth)',
        'DELETE /api/actors/:id': 'Delete an actor (requires auth)'
      },
      weekly_availability: {
        'GET /api/weekly-availability': 'Get all weekly availability (requires auth)',
        'POST /api/weekly-availability': 'Create new weekly availability (requires auth)',
        'PUT /api/weekly-availability/:id': 'Update weekly availability (requires auth)',
        'DELETE /api/weekly-availability/:id': 'Delete weekly availability (requires auth)'
      },
      scenes: {
        'GET /api/scenes': 'Get all scenes (requires auth)',
        'POST /api/scenes': 'Create a new scene (requires auth)',
        'PUT /api/scenes/:id': 'Update a scene (requires auth)',
        'DELETE /api/scenes/:id': 'Delete a scene (requires auth)'
      },
      calendar: {
        'GET /api/calendar': 'Calendar API info',
        'GET /api/calendar/auth/google': 'Start Google OAuth (requires auth)',
        'GET /api/calendar/auth/google/callback': 'Handle OAuth redirect from Google',
        'POST /api/calendar/auth/google/callback': 'Handle OAuth callback (requires auth)', 
        'GET /api/calendar/status': 'Check connection status (requires auth)',
        'GET /api/calendar/import-availability': 'Import availability from calendar (requires auth)',
        'GET /api/calendar/available-slots': 'Get available slots (requires auth)',
        'POST /api/calendar/import-slots': 'Import slots (requires auth)',
        'DELETE /api/calendar/disconnect': 'Disconnect calendar (requires auth)'
      }
    },
    documentation: 'All endpoints except /, /health, and /api require authentication',
    mobile_app: 'This API serves a React Native mobile application',
    web_app: 'Web version available at a separate deployment'
  });
});

// API base route
app.get('/api', (req, res) => {
  res.json({
    message: 'Rehearsal Scheduler API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user (requires auth)',
        'PUT /api/auth/profile': 'Update user profile (requires auth)'
      },
      calendar: {
        'GET /api/calendar': 'Calendar API info',
        'GET /api/calendar/auth/google': 'Start Google OAuth (requires auth)',
        'GET /api/calendar/auth/google/callback': 'Handle OAuth redirect from Google',
        'POST /api/calendar/auth/google/callback': 'Handle OAuth callback (requires auth)',
        'GET /api/calendar/status': 'Check connection status (requires auth)',
        'GET /api/calendar/available-slots': 'Get available slots (requires auth)',
        'POST /api/calendar/import-slots': 'Import slots (requires auth)',
        'DELETE /api/calendar/disconnect': 'Disconnect calendar (requires auth)'
      },
      actors: {
        'GET /api/actors': 'Get all actors (requires auth)',
        'POST /api/actors': 'Create a new actor (requires auth)',
        'PUT /api/actors/:id': 'Update an actor (requires auth)',
        'DELETE /api/actors/:id': 'Delete an actor (requires auth)'
      },
      weekly_availability: {
        'GET /api/weekly-availability': 'Get all weekly availability (requires auth)',
        'POST /api/weekly-availability': 'Create new weekly availability (requires auth)',
        'PUT /api/weekly-availability/:id': 'Update weekly availability (requires auth)',
        'DELETE /api/weekly-availability/:id': 'Delete weekly availability (requires auth)'
      },
      scenes: {
        'GET /api/scenes': 'Get all scenes (requires auth)',
        'POST /api/scenes': 'Create a new scene (requires auth)',
        'PUT /api/scenes/:id': 'Update a scene (requires auth)',
        'DELETE /api/scenes/:id': 'Delete a scene (requires auth)'
      }
    },
    documentation: 'All endpoints except /api, /health, and / require authentication'
  });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'PUT /api/auth/profile',
      'GET /api/calendar/auth/google',
      'GET /api/calendar/auth/google/callback',
      'POST /api/calendar/auth/google/callback',
      'GET /api/calendar/status',
      'GET /api/calendar/import-availability',
      'GET /api/calendar/available-slots',
      'POST /api/calendar/import-slots',
      'DELETE /api/calendar/disconnect',
      'GET /api/actors',
      'POST /api/actors',
      'PUT /api/actors/:id',
      'DELETE /api/actors/:id',
      'GET /api/weekly-availability',
      'POST /api/weekly-availability',
      'PUT /api/weekly-availability/:id',
      'DELETE /api/weekly-availability/:id',
      'GET /api/scenes',
      'POST /api/scenes',
      'PUT /api/scenes/:id',
      'DELETE /api/scenes/:id'
    ]
  });
});

// Serve static files from the dist directory (web app)
let distPath;
if (process.env.NODE_ENV === 'production') {
  distPath = path.resolve(process.cwd(), 'dist');
} else {
  distPath = path.resolve(process.cwd(), '../dist');
}

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Only serve frontend for non-API routes
  app.get('*', (req, res) => {
    // Don't serve frontend for API routes - let them 404 normally
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve frontend for all other routes
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      error: 'Invalid ID format' 
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Token expired' 
    });
  }
  
  // Default error
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize MongoDB
    await initDB();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.log('💥 Force shutdown');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
