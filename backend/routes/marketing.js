const express = require('express');
const router = express.Router();
const marketingService = require('../services/marketingService');
const Analytics = require('../models/Analytics');
const authMiddleware = require('../middleware/auth');

// Create referral link
router.post('/referral/create', authMiddleware, async (req, res) => {
  try {
    const referralData = await marketingService.createReferralLink(req.user.id);
    res.json({ success: true, ...referralData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track referral
router.post('/referral/track', async (req, res) => {
  try {
    const { referralCode, userId } = req.body;
    const result = await marketingService.processReferral(referralCode, userId);
    
    if (result) {
      // Track analytics
      await Analytics.create({
        userId,
        eventType: 'referral_completed',
        eventData: { referralCode, referrerId: result.referrerId }
      });
    }
    
    res.json({ success: !!result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get social share content
router.get('/social-share/:type', authMiddleware, async (req, res) => {
  try {
    const content = marketingService.generateSocialShareContent(req.params.type);
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track analytics event
router.post('/track', async (req, res) => {
  try {
    const { eventType, eventData, userId } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    const referrer = req.headers.referer;
    
    await Analytics.create({
      userId,
      eventType,
      eventData,
      userAgent,
      ipAddress,
      referrer,
      sessionId: req.sessionID
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get marketing metrics (admin only)
router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await Analytics.getMarketingMetrics(
      new Date(startDate),
      new Date(endDate)
    );
    
    const funnel = await Analytics.getFunnelMetrics(
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json({ success: true, metrics, funnel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// A/B test endpoint
router.get('/ab-test/:campaign', authMiddleware, async (req, res) => {
  try {
    const variant = marketingService.getMarketingVariant(req.user.id, req.params.campaign);
    res.json({ success: true, variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;