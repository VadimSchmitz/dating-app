const coCreationMatcher = require('./coCreationMatcher');
const aiEnhancedMatcher = require('./aiEnhancedMatcher');
const aiChatAnalyzer = require('../services/aiChatAnalyzer');
const visualAnalyzer = require('../services/visualAnalyzer');
const logger = require('../utils/logger');
const Redis = require('ioredis');
const Bull = require('bull');

class SmartCoCreationMatcher {
  constructor() {
    // Check if Redis is disabled for demo mode
    if (process.env.DISABLE_REDIS !== 'true') {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      this.analysisQueue = new Bull('match-analysis', process.env.REDIS_URL);
    } else {
      // Mock Redis for demo mode
      this.redis = null;
      this.analysisQueue = null;
    }
    
    // Weights for different matching factors
    this.weights = {
      basic: 0.3,          // Original algorithm (interests, location)
      personality: 0.25,   // Bio analysis & personality test
      visual: 0.15,        // Photo/lifestyle analysis
      interaction: 0.2,    // Chat compatibility (if available)
      values: 0.1          // Shared values and goals
    };

    // Setup background job processor only if Redis is available
    if (!process.env.DISABLE_REDIS || process.env.DISABLE_REDIS !== 'true') {
      this.setupBackgroundJobs();
    }
  }

  setupBackgroundJobs() {
    // Process match analysis in background
    this.analysisQueue.process(async (job) => {
      const { userId, candidateId, analysisType } = job.data;
      
      try {
        if (analysisType === 'deep') {
          await this.performDeepAnalysis(userId, candidateId);
        } else if (analysisType === 'chat') {
          await this.analyzeChatCompatibility(userId, candidateId);
        }
      } catch (error) {
        logger.error('Background analysis failed:', error);
      }
    });
  }

  // Main matching function - combines all available data
  async findSmartMatches(user, candidates, options = {}) {
    const {
      limit = 10,
      includeAI = true,
      userTier = 'basic'
    } = options;

    // Get cached analysis data
    const cachedAnalyses = await this.getCachedAnalyses(user.id);

    // Calculate matches with available data
    const matches = await Promise.all(candidates
      .filter(candidate => candidate.id !== user.id)
      .map(async (candidate) => {
        const matchData = await this.calculateSmartMatch(
          user, 
          candidate, 
          cachedAnalyses[candidate.id],
          userTier
        );

        return {
          user: candidate,
          matchData,
          isPremiumMatch: matchData.usedPremiumFeatures
        };
      })
    );

    // Sort by score and premium status
    const sortedMatches = matches.sort((a, b) => {
      // Premium users see AI-enhanced matches first
      if (userTier !== 'basic') {
        if (a.isPremiumMatch && !b.isPremiumMatch) return -1;
        if (!a.isPremiumMatch && b.isPremiumMatch) return 1;
      }
      return b.matchData.score - a.matchData.score;
    });

    // Queue deep analysis for top matches (background job)
    if (userTier !== 'basic') {
      this.queueTopMatchAnalysis(user.id, sortedMatches.slice(0, 5));
    }

    return sortedMatches.slice(0, limit);
  }

  async calculateSmartMatch(user1, user2, cachedData = {}, userTier) {
    const scores = {
      basic: 0,
      personality: 0,
      visual: 0,
      interaction: 0,
      values: 0
    };

    // 1. Basic matching (always available)
    const basicMatch = coCreationMatcher.calculateMatch(user1, user2);
    scores.basic = basicMatch.score / 100;

    // 2. AI Bio Analysis (if available)
    if (user1.bio && user2.bio) {
      try {
        const aiMatch = await aiEnhancedMatcher.calculateEnhancedMatch(user1, user2);
        scores.personality = aiMatch.aiAnalysis.personalityMatch / 100;
        scores.values = aiMatch.aiAnalysis.sharedValues.length / 5; // Normalize to 0-1
        
        // Cache the analysis
        await this.cacheAnalysis(user1.id, user2.id, 'personality', aiMatch.aiAnalysis);
      } catch (error) {
        logger.error('AI matching error:', error);
        scores.personality = scores.basic; // Fallback
      }
    }

    // 3. Visual Analysis (premium feature)
    if (userTier !== 'basic' && user1.photos?.length && user2.photos?.length) {
      if (cachedData.visual) {
        scores.visual = cachedData.visual;
      } else {
        // Queue for background analysis
        this.analysisQueue.add({
          userId: user1.id,
          candidateId: user2.id,
          analysisType: 'visual'
        });
        scores.visual = scores.basic * 0.8; // Temporary estimate
      }
    }

    // 4. Chat Compatibility (if they've chatted before)
    if (cachedData.chatCompatibility) {
      scores.interaction = cachedData.chatCompatibility / 100;
    }

    // Calculate weighted total
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(scores).forEach(([key, score]) => {
      if (score > 0) {
        totalScore += score * this.weights[key];
        totalWeight += this.weights[key];
      }
    });

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 50;

    return {
      score: Math.round(finalScore),
      breakdown: scores,
      insights: this.generateInsights(scores, user1, user2, cachedData),
      usedPremiumFeatures: scores.visual > 0 || scores.interaction > 0,
      coCreationPotential: this.assessPotential(finalScore, scores),
      lastUpdated: cachedData.lastUpdated || new Date()
    };
  }

  generateInsights(scores, user1, user2, cachedData) {
    const insights = [];

    // Personality insights
    if (scores.personality > 0.8) {
      insights.push("🧠 Exceptional personality match!");
    } else if (scores.personality > 0.6) {
      insights.push("💭 Compatible thinking styles");
    }

    // Values insights
    if (cachedData.sharedValues?.length > 2) {
      insights.push(`🎯 Share values: ${cachedData.sharedValues.slice(0, 2).join(', ')}`);
    }

    // Visual/lifestyle insights
    if (cachedData.visualInsights) {
      insights.push(...cachedData.visualInsights.slice(0, 1));
    }

    // Chat insights (if available)
    if (cachedData.chatInsights) {
      insights.push(`💬 ${cachedData.chatInsights[0]}`);
    }

    // Basic compatibility
    if (scores.basic > 0.7) {
      const sharedInterests = user1.interests?.filter(i => 
        user2.interests?.includes(i)
      ) || [];
      if (sharedInterests.length > 0) {
        insights.push(`✨ Both love ${sharedInterests[0]}`);
      }
    }

    // Add AI confidence indicator for premium users
    if (scores.personality > 0 || scores.visual > 0) {
      const aiConfidence = (scores.personality + scores.visual) / 2;
      if (aiConfidence > 0.7) {
        insights.push("🤖 AI highly recommends this match!");
      }
    }

    return insights.slice(0, 3); // Return top 3 insights
  }

  assessPotential(score, breakdown) {
    // More nuanced assessment based on score components
    if (score >= 85 && breakdown.personality > 0.8) {
      return "Exceptional - Rare compatibility!";
    }
    if (score >= 75) {
      return "Excellent - Strong potential";
    }
    if (score >= 60 && breakdown.values > 0.7) {
      return "Good - Aligned values";
    }
    if (score >= 50) {
      return "Moderate - Worth exploring";
    }
    return "Low - Different paths";
  }

  // Cache management
  async getCachedAnalyses(userId) {
    const pattern = `analysis:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    const analyses = {};

    for (const key of keys) {
      const [, , candidateId, type] = key.split(':');
      if (!analyses[candidateId]) analyses[candidateId] = {};
      
      const data = await this.redis.get(key);
      if (data) {
        analyses[candidateId][type] = JSON.parse(data);
      }
    }

    return analyses;
  }

  async cacheAnalysis(userId, candidateId, type, data) {
    const key = `analysis:${userId}:${candidateId}:${type}`;
    const cacheData = {
      ...data,
      lastUpdated: new Date()
    };
    
    // Cache for 30 days
    await this.redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(cacheData));
    
    // Also cache reverse direction
    const reverseKey = `analysis:${candidateId}:${userId}:${type}`;
    await this.redis.setex(reverseKey, 30 * 24 * 60 * 60, JSON.stringify(cacheData));
  }

  // Queue analysis for top matches
  queueTopMatchAnalysis(userId, topMatches) {
    topMatches.forEach((match, index) => {
      // Stagger the analysis to avoid overload
      const delay = index * 5000; // 5 seconds between each
      
      this.analysisQueue.add({
        userId,
        candidateId: match.user.id,
        analysisType: 'deep'
      }, {
        delay,
        attempts: 3
      });
    });
  }

  // Deep analysis for premium users (runs in background)
  async performDeepAnalysis(userId, candidateId) {
    const user1 = await User.findByPk(userId);
    const user2 = await User.findByPk(candidateId);

    if (!user1 || !user2) return;

    // Visual analysis
    if (user1.photos?.length && user2.photos?.length) {
      const profile1 = await visualAnalyzer.analyzeUserPhotos(user1.photos);
      const profile2 = await visualAnalyzer.analyzeUserPhotos(user2.photos);
      
      if (profile1 && profile2) {
        const visualCompat = visualAnalyzer.calculateVisualCompatibility(profile1, profile2);
        const visualInsights = visualAnalyzer.generateVisualInsights(profile1, profile2, visualCompat);
        
        await this.cacheAnalysis(userId, candidateId, 'visual', {
          score: visualCompat,
          insights: visualInsights,
          profiles: { user1: profile1, user2: profile2 }
        });
      }
    }

    logger.info(`Deep analysis completed for ${userId} <-> ${candidateId}`);
  }

  // Analyze chat compatibility (triggered after X messages)
  async analyzeChatCompatibility(matchId) {
    const messages = await Message.findAll({
      where: { matchId },
      order: [['createdAt', 'ASC']],
      limit: 100 // Analyze last 100 messages
    });

    if (messages.length < 20) return; // Need enough data

    const analysis = await aiChatAnalyzer.analyzeConversation(messages);
    if (!analysis) return;

    const insights = aiChatAnalyzer.generateInsights(analysis);
    const match = await Match.findByPk(matchId);

    // Cache for both users
    await this.cacheAnalysis(match.user1Id, match.user2Id, 'chat', {
      compatibility: analysis.compatibility,
      insights,
      analysis
    });

    // Update match record with compatibility score
    match.compatibilityScore = analysis.compatibility;
    await match.save();

    logger.info(`Chat analysis completed for match ${matchId}`);
  }

  // Get match explanation for users
  async getMatchExplanation(userId, candidateId) {
    const cached = await this.getCachedAnalyses(userId);
    const matchData = cached[candidateId] || {};

    return {
      personalityAnalysis: matchData.personality || null,
      visualCompatibility: matchData.visual || null,
      chatCompatibility: matchData.chat || null,
      lastUpdated: matchData.lastUpdated || null,
      premium: Boolean(matchData.visual || matchData.chat)
    };
  }
}

module.exports = new SmartCoCreationMatcher();