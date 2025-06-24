const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const authValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('dateOfBirth')
      .isISO8601()
      .custom((value) => {
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return age >= 18 && age <= 100;
      })
      .withMessage('Must be between 18 and 100 years old'),
    body('gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Invalid gender'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .notEmpty()
      .withMessage('Password required'),
    handleValidationErrors
  ],

  updateProfile: [
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be under 500 characters'),
    body('interests')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Maximum 10 interests allowed'),
    body('location')
      .optional()
      .matches(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)
      .withMessage('Invalid location coordinates'),
    handleValidationErrors
  ]
};

const paymentValidation = {
  purchaseCoins: [
    body('packageId')
      .isIn(['starter', 'popular', 'value', 'premium'])
      .withMessage('Invalid package'),
    body('paymentMethodId')
      .notEmpty()
      .withMessage('Payment method required'),
    handleValidationErrors
  ],

  createSubscription: [
    body('plan')
      .isIn(['basic', 'premium', 'elite'])
      .withMessage('Invalid subscription plan'),
    body('paymentMethodId')
      .notEmpty()
      .withMessage('Payment method required'),
    handleValidationErrors
  ]
};

const matchValidation = {
  swipe: [
    param('userId')
      .isUUID()
      .withMessage('Invalid user ID'),
    body('action')
      .isIn(['like', 'pass', 'superlike'])
      .withMessage('Invalid action'),
    handleValidationErrors
  ],

  sendMessage: [
    param('matchId')
      .isUUID()
      .withMessage('Invalid match ID'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    handleValidationErrors
  ]
};

const sanitizeInput = (req, res, next) => {
  // Recursively clean all string inputs
  const clean = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove any HTML tags and trim
        obj[key] = obj[key].replace(/<[^>]*>/g, '').trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        clean(obj[key]);
      }
    }
  };

  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};

module.exports = {
  authValidation,
  paymentValidation,
  matchValidation,
  sanitizeInput,
  handleValidationErrors
};