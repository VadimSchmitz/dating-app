const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Referral = require('../models/Referral');
const CoCreationCoin = require('../models/CoCreationCoin');

class MarketingService {
  constructor() {
    // Email configuration (you'll need to set up SMTP credentials)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Generate unique referral code
  generateReferralCode(userId) {
    const hash = crypto.createHash('md5').update(userId + Date.now()).digest('hex');
    return `COCREATE_${hash.substring(0, 8).toUpperCase()}`;
  }

  // Create referral link
  async createReferralLink(userId) {
    const referralCode = this.generateReferralCode(userId);
    
    const referral = await Referral.create({
      referrerId: userId,
      referralCode,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    return {
      code: referralCode,
      link: `${process.env.APP_URL}/register?ref=${referralCode}`,
      shareText: `Join me on CoCreate Dating! Use my code ${referralCode} to get 100 bonus coins when you sign up. Find your perfect co-creation partner today! 🚀`
    };
  }

  // Process referral
  async processReferral(referralCode, newUserId) {
    const referral = await Referral.findOne({ 
      where: { 
        referralCode,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      }
    });

    if (!referral) return null;

    // Update referral status
    referral.referredUserId = newUserId;
    referral.status = 'completed';
    referral.claimedAt = new Date();
    await referral.save();

    // Give rewards
    await this.giveReferralRewards(referral.referrerId, newUserId);

    return referral;
  }

  // Give referral rewards
  async giveReferralRewards(referrerId, referredUserId) {
    // Reward referrer
    const referrerCoins = await CoCreationCoin.findOne({ where: { userId: referrerId } });
    if (referrerCoins) {
      referrerCoins.balance += Referral.REWARDS.referrer.firstReferral.coins;
      await referrerCoins.save();
    }

    // Reward new user
    await CoCreationCoin.create({
      userId: referredUserId,
      balance: Referral.REWARDS.referred.signupBonus.coins
    });
  }

  // Email campaigns
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: '"CoCreate Dating" <noreply@cocreatedating.com>',
      to: user.email,
      subject: 'Welcome to CoCreate Dating! 🎉',
      html: `
        <h2>Welcome ${user.name}!</h2>
        <p>You're now part of the CoCreate Dating community where meaningful connections are built through collaboration.</p>
        
        <h3>Get Started:</h3>
        <ul>
          <li>Complete your profile to get 50 bonus coins</li>
          <li>Add your co-creation interests</li>
          <li>Start matching with like-minded creators</li>
        </ul>
        
        <p><strong>Special Offer:</strong> Upgrade to Premium in the next 48 hours and get 20% off!</p>
        
        <a href="${process.env.APP_URL}/profile" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Your Profile</a>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendReengagementEmail(user, daysInactive) {
    const subject = daysInactive > 30 ? 
      "We miss you at CoCreate Dating! 💔" : 
      "New matches are waiting for you! 💕";

    const mailOptions = {
      from: '"CoCreate Dating" <noreply@cocreatedating.com>',
      to: user.email,
      subject,
      html: `
        <h2>Hi ${user.name},</h2>
        <p>You have ${Math.floor(Math.random() * 5) + 3} new potential co-creation matches!</p>
        
        <h3>Come back and:</h3>
        <ul>
          <li>See who's interested in your projects</li>
          <li>Claim your daily bonus coins</li>
          <li>Join our upcoming virtual co-creation event</li>
        </ul>
        
        <p><strong>Limited Time:</strong> Use code COMEBACK20 for 20% off Premium!</p>
        
        <a href="${process.env.APP_URL}/matches" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Matches</a>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  // Social media integration
  generateSocialShareContent(type = 'general') {
    const content = {
      general: {
        twitter: "Just joined @CoCreateDating - where meaningful connections happen through collaboration! 🚀 #CoCreation #Dating #Innovation",
        facebook: "I'm now on CoCreate Dating! It's not just about finding dates, it's about finding partners who share your creative vision. Join me!",
        linkedin: "Excited to be part of CoCreate Dating - a platform that matches professionals based on collaborative potential and shared creative interests."
      },
      success: {
        twitter: "Found my perfect co-creation partner on @CoCreateDating! 🎉 Sometimes the best relationships start with shared projects. #SuccessStory",
        facebook: "Amazing news! I connected with someone special on CoCreate Dating. We're already working on our first project together!",
        linkedin: "CoCreate Dating helped me find not just a partner, but a collaborator who shares my professional vision. Highly recommend!"
      },
      referral: {
        twitter: `Join me on @CoCreateDating! Use my referral code for 100 bonus coins. Let's create something amazing together! 🌟 #CoCreateDating`,
        facebook: "Hey friends! I'm loving CoCreate Dating. If you're looking for meaningful connections through shared interests, join me! You'll get bonus coins with my referral.",
        linkedin: "Inviting my network to join CoCreate Dating - a unique platform for professionals seeking collaborative partnerships. Message me for a referral code!"
      }
    };

    return content[type] || content.general;
  }

  // Campaign tracking
  async trackCampaign(campaignId, userId, action) {
    // This would integrate with analytics services
    const trackingData = {
      campaignId,
      userId,
      action,
      timestamp: new Date(),
      userAgent: null, // Would come from request
      source: null // Would be determined from referrer
    };

    // Log to analytics service (Google Analytics, Mixpanel, etc.)
    console.log('Campaign tracked:', trackingData);
  }

  // A/B testing for marketing messages
  getMarketingVariant(userId, campaign) {
    // Simple A/B test implementation
    const userIdHash = crypto.createHash('md5').update(userId).digest('hex');
    const variant = parseInt(userIdHash.substring(0, 2), 16) % 2 === 0 ? 'A' : 'B';

    const variants = {
      premium_upgrade: {
        A: {
          title: "Unlock Premium Features",
          cta: "Upgrade Now",
          discount: 20
        },
        B: {
          title: "Find Your Perfect Match Faster",
          cta: "Go Premium",
          discount: 25
        }
      },
      coin_purchase: {
        A: {
          title: "Running Low on Coins?",
          cta: "Buy Coins",
          bonus: 10
        },
        B: {
          title: "Special Coin Bundle Offer",
          cta: "Get More Coins",
          bonus: 15
        }
      }
    };

    return variants[campaign]?.[variant] || variants[campaign]?.A;
  }

  // Influencer program
  async createInfluencerCode(userId, commissionRate = 15) {
    const code = `INFLUENCE_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    // Store influencer data
    const influencerData = {
      userId,
      code,
      commissionRate,
      totalEarnings: 0,
      totalReferrals: 0,
      status: 'active'
    };

    // This would be stored in a separate Influencer model
    return influencerData;
  }
}

module.exports = new MarketingService();