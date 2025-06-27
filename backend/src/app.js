const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables - dotenv will look for .env in the current working directory
require('dotenv').config();

const { initDB } = require('./models/database');
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const actorsRoutes = require('./routes/actors');
const timeslotsRoutes = require('./routes/timeslots');
const scenesRoutes = require('./routes/scenes');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory (web app)
// Handle different deployment scenarios
let distPath;
if (process.env.NODE_ENV === 'production') {
  // Production: try different possible paths
  const productionPaths = [
    path.resolve(process.cwd(), '../dist'),           // If backend is in subfolder
    path.resolve(process.cwd(), 'dist'),              // If at root level
    path.resolve(process.cwd(), '../../dist'),        // Two levels up
    path.resolve(process.cwd(), '../../../dist')      // Three levels up
  ];
  
  // Use the first path that exists
  for (const testPath of productionPaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(testPath)) {
        distPath = testPath;
        break;
      }
    } catch (_err) {
      // Continue to next path
    }
  }
  
  if (!distPath) {
    console.log('⚠️ Warning: dist directory not found in production. Web app will not be served.');
    console.log('🔍 Searched paths:', productionPaths);
    distPath = path.resolve(process.cwd(), 'dist'); // Fallback
  }
} else {
  // Development: dist is in parent directory
  distPath = path.resolve(process.cwd(), '../dist');
}

console.log('📁 Serving static files from:', distPath);
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('✅ Static file serving enabled');
} else {
  console.log('❌ Static files directory not found - web app will not be served');
  console.log('🔍 Tried path:', distPath);
}

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app.com'] // Add your production domains here
    : true, // Allow all origins in development
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📝 [${timestamp}] ${req.method} ${req.url}`);
  console.log(`📝 Headers:`, JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📝 Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'MongoDB',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/actors', actorsRoutes);
app.use('/api/timeslots', timeslotsRoutes);
app.use('/api/scenes', scenesRoutes);

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
      timeslots: {
        'GET /api/timeslots': 'Get all timeslots (requires auth)',
        'POST /api/timeslots': 'Create a new timeslot (requires auth)',
        'PUT /api/timeslots/:id': 'Update a timeslot (requires auth)',
        'DELETE /api/timeslots/:id': 'Delete a timeslot (requires auth)'
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
        'POST /api/calendar/check-timeslots': 'Check timeslots against calendar and update availability (requires auth)',
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
      timeslots: {
        'GET /api/timeslots': 'Get all timeslots (requires auth)',
        'POST /api/timeslots': 'Create a new timeslot (requires auth)',
        'PUT /api/timeslots/:id': 'Update a timeslot (requires auth)',
        'DELETE /api/timeslots/:id': 'Delete a timeslot (requires auth)'
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
      'POST /api/calendar/auth/google/callback',
      'GET /api/calendar/status',
      'GET /api/calendar/available-slots',
      'POST /api/calendar/import-slots',
      'DELETE /api/calendar/disconnect',
      'GET /api/actors',
      'POST /api/actors',
      'PUT /api/actors/:id',
      'DELETE /api/actors/:id',
      'GET /api/timeslots',
      'POST /api/timeslots',
      'PUT /api/timeslots/:id',
      'DELETE /api/timeslots/:id',
      'GET /api/scenes',
      'POST /api/scenes',
      'PUT /api/scenes/:id',
      'DELETE /api/scenes/:id'
    ]
  });
});

// Catch all handler for web app - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve the web app for API or health routes
  if (req.url.startsWith('/api') || req.url.startsWith('/health')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  
  // Check if we have static files available
  if (!distPath || !fs.existsSync(distPath)) {
    return res.status(404).json({ 
      error: 'Web app not available',
      message: 'Static files not found. This is an API-only deployment.',
      api: {
        base: '/api',
        health: '/health'
      }
    });
  }
  
  // Serve the web app's index.html for all other routes
  const indexPath = path.resolve(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'Web app not available',
      message: 'index.html not found. This is an API-only deployment.',
      api: {
        base: '/api',
        health: '/health'
      }
    });
  }
});

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
