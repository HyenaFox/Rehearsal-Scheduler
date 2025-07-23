const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  console.log('🔐 Auth middleware called for:', req.method, req.url);
  console.log('🍪 Cookies received:', req.cookies);
  console.log('🔑 Authorization header:', req.headers['authorization']);
  
  // Check for token in Authorization header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  // If no token in header, check for cookie
  if (!token && req.cookies) {
    token = req.cookies.auth_token;
    console.log('🍪 Using token from cookie:', !!token);
  }

  if (!token) {
    console.log('❌ No token found in request');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('✅ Authentication successful for user:', user.email);
    req.user = user;
    req.userId = user._id;
    next();
  } catch (_error) {
    console.log('❌ Token verification failed:', _error.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = { authenticateToken, requireAdmin };
