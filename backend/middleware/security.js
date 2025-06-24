const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message
      });
    }
  });
};

// Different rate limiters for different endpoints
const limiters = {
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests, please try again later.'
  ),
  
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 requests per windowMs
    'Too many authentication attempts, please try again later.'
  ),
  
  payment: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // limit each IP to 10 payment requests per hour
    'Too many payment requests, please try again later.'
  ),
  
  messaging: createRateLimiter(
    1 * 60 * 1000, // 1 minute
    30, // limit each IP to 30 messages per minute
    'Too many messages, please slow down.'
  )
};

// Security middleware setup
const setupSecurity = (app) => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", 'https://js.stripe.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.stripe.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        frameSrc: ["'self'", 'https://js.stripe.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));

  // Body parsing security
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Data sanitization against NoSQL query injection
  // Disabled due to Express v5 incompatibility
  // app.use(mongoSanitize());

  // Data sanitization against XSS
  // Disabled due to Express v5 incompatibility with xss-clean
  // app.use(xss());

  // Prevent parameter pollution
  app.use(hpp({
    whitelist: ['sort', 'filter', 'page', 'limit']
  }));

  // Apply general rate limiting to all routes
  app.use(limiters.general);

  // Trust proxy for accurate IP addresses (important for rate limiting)
  app.set('trust proxy', 1);
};

// Middleware to check account status
const checkAccountStatus = async (req, res, next) => {
  try {
    if (req.user && req.user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account suspended. Please contact support.'
      });
    }
    
    if (req.user && req.user.status === 'banned') {
      return res.status(403).json({
        success: false,
        error: 'Account banned.'
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for subscription checks
const requireSubscription = (level = 'basic') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const subscription = await user.getActiveSubscription();
      
      if (!subscription) {
        return res.status(403).json({
          success: false,
          error: 'Subscription required',
          requiredLevel: level
        });
      }
      
      const levels = { basic: 1, premium: 2, elite: 3 };
      if (levels[subscription.plan] < levels[level]) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient subscription level',
          currentLevel: subscription.plan,
          requiredLevel: level
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  setupSecurity,
  limiters,
  checkAccountStatus,
  requireSubscription
};