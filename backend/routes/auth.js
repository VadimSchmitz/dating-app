const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const CoCreationCoin = require('../models/CoCreationCoin');
const Referral = require('../models/Referral');
const { authValidation } = require('../middleware/validation');
const { limiters } = require('../middleware/security');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Register new user
router.post('/register', limiters.auth, authValidation.register, async (req, res) => {
  const transaction = await User.sequelize.transaction();
  
  try {
    const { email, password, name, dateOfBirth, gender, referralCode } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      dateOfBirth,
      gender,
      verificationToken,
      verificationExpires,
      lastLogin: new Date(),
      verified: true // Auto-verify for now
    }, { transaction });
    
    // Create coin wallet with signup bonus
    await CoCreationCoin.create({
      userId: user.id,
      balance: parseInt(process.env.SIGNUP_BONUS_COINS) || 50,
      totalEarned: parseInt(process.env.SIGNUP_BONUS_COINS) || 50
    }, { transaction });
    
    // Handle referral if provided
    if (referralCode) {
      const referral = await Referral.findOne({ 
        where: { 
          referralCode,
          status: 'pending'
        }
      });
      
      if (referral && new Date() < referral.expiresAt) {
        referral.referredUserId = user.id;
        referral.status = 'completed';
        referral.claimedAt = new Date();
        await referral.save({ transaction });
        
        // Award referrer bonus
        const referrerWallet = await CoCreationCoin.findOne({
          where: { userId: referral.referrerId }
        });
        if (referrerWallet) {
          referrerWallet.balance += Referral.REWARDS.referrer.firstReferral.coins;
          referrerWallet.totalEarned += Referral.REWARDS.referrer.firstReferral.coins;
          await referrerWallet.save({ transaction });
        }
      }
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save({ transaction });
    
    await transaction.commit();
    
    // Send verification email - disabled for now
    // await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
    
    logger.info('New user registered', { userId: user.id, email: user.email });
    
    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed' 
    });
  }
});

// Login
router.post('/login', limiters.auth, authValidation.login, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Track failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.status = 'locked';
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();
      
      return res.status(401).json({ 
        success: false, 
        error: user.status === 'locked' ? 'Account locked due to too many failed attempts' : 'Invalid credentials'
      });
    }
    
    // Check account status
    if (user.status === 'locked' && user.lockedUntil > new Date()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account temporarily locked' 
      });
    }
    
    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ 
        success: false, 
        error: `Account ${user.status}` 
      });
    }
    
    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.lastFailedLogin = null;
    user.lockedUntil = null;
    user.status = 'active';
    user.lastLogin = new Date();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    await user.save();
    
    logger.info('User logged in', { userId: user.id });
    
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Refresh token required' 
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and validate refresh token
    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid refresh token' 
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    res.json({
      success: true,
      ...tokens
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Invalid refresh token' 
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationExpires: { [User.sequelize.Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired verification token' 
      });
    }
    
    user.verified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();
    
    logger.info('Email verified', { userId: user.id });
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Verification failed' 
    });
  }
});

// Request password reset
router.post('/forgot-password', limiters.auth, async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ 
        success: true, 
        message: 'If email exists, reset instructions sent' 
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    
    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    
    logger.info('Password reset requested', { userId: user.id });
    
    res.json({ 
      success: true, 
      message: 'If email exists, reset instructions sent' 
    });
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process request' 
    });
  }
});

// Reset password
router.post('/reset-password/:token', limiters.auth, async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [User.sequelize.Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired reset token' 
      });
    }
    
    // Hash new password
    user.password = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null; // Invalidate existing sessions
    await user.save();
    
    logger.info('Password reset completed', { userId: user.id });
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset password' 
    });
  }
});

module.exports = router;