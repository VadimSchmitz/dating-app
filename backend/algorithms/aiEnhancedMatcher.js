const coCreationMatcher = require('./coCreationMatcher');
const logger = require('../utils/logger');

class AIEnhancedMatcher {
  constructor() {
    this.personalityTraits = [
      'openness', 'conscientiousness', 'extraversion', 
      'agreeableness', 'neuroticism', 'creativity',
      'leadership', 'collaboration', 'innovation'
    ];
  }

  // Analyze bio text to extract personality indicators
  analyzeBio(bio) {
    if (!bio) return {};
    
    const bioLower = bio.toLowerCase();
    const traits = {};
    
    // Keywords that indicate different personality traits
    const traitKeywords = {
      openness: ['creative', 'innovative', 'curious', 'artistic', 'imaginative', 'explore', 'new ideas'],
      conscientiousness: ['organized', 'reliable', 'responsible', 'detail', 'planning', 'structured'],
      extraversion: ['social', 'outgoing', 'energetic', 'talkative', 'party', 'people person', 'team'],
      agreeableness: ['kind', 'helpful', 'cooperative', 'empathetic', 'caring', 'supportive'],
      neuroticism: ['calm', 'stable', 'relaxed', 'stress-free', 'peaceful', 'balanced'],
      creativity: ['create', 'design', 'build', 'make', 'craft', 'art', 'music', 'write'],
      leadership: ['lead', 'manage', 'organize', 'initiative', 'founder', 'started', 'ceo'],
      collaboration: ['team', 'together', 'collaborate', 'partner', 'group', 'community'],
      innovation: ['innovate', 'disrupt', 'transform', 'revolutionize', 'pioneer', 'cutting-edge']
    };
    
    // Score each trait based on keyword presence
    Object.keys(traitKeywords).forEach(trait => {
      const keywords = traitKeywords[trait];
      const matches = keywords.filter(keyword => bioLower.includes(keyword)).length;
      traits[trait] = Math.min(1, matches / 3); // Normalize to 0-1
    });
    
    return traits;
  }

  // Extract values and goals from bio
  extractValues(bio) {
    if (!bio) return [];
    
    const values = [];
    const bioLower = bio.toLowerCase();
    
    const valueKeywords = {
      'sustainability': ['sustainable', 'environment', 'eco', 'green', 'climate'],
      'social impact': ['impact', 'change', 'help', 'volunteer', 'charity', 'nonprofit'],
      'personal growth': ['growth', 'learn', 'improve', 'develop', 'evolve'],
      'family': ['family', 'kids', 'children', 'parent'],
      'adventure': ['adventure', 'travel', 'explore', 'discover'],
      'health': ['health', 'fitness', 'wellness', 'yoga', 'meditation'],
      'technology': ['tech', 'code', 'software', 'digital', 'ai', 'startup'],
      'arts': ['art', 'music', 'dance', 'theater', 'creative', 'design']
    };
    
    Object.entries(valueKeywords).forEach(([value, keywords]) => {
      if (keywords.some(keyword => bioLower.includes(keyword))) {
        values.push(value);
      }
    });
    
    return values;
  }

  // Calculate compatibility based on personality traits
  calculatePersonalityCompatibility(traits1, traits2) {
    if (!traits1 || !traits2) return 0.5;
    
    // Some traits are better when similar, others when complementary
    const similarityTraits = ['openness', 'agreeableness', 'creativity', 'innovation'];
    const complementaryTraits = ['extraversion', 'leadership'];
    
    let totalScore = 0;
    let traitCount = 0;
    
    // Similar traits - closer is better
    similarityTraits.forEach(trait => {
      if (traits1[trait] !== undefined && traits2[trait] !== undefined) {
        const diff = Math.abs(traits1[trait] - traits2[trait]);
        totalScore += 1 - diff;
        traitCount++;
      }
    });
    
    // Complementary traits - some difference is good
    complementaryTraits.forEach(trait => {
      if (traits1[trait] !== undefined && traits2[trait] !== undefined) {
        const diff = Math.abs(traits1[trait] - traits2[trait]);
        // Optimal difference is around 0.5
        const score = 1 - Math.abs(diff - 0.5) * 2;
        totalScore += score;
        traitCount++;
      }
    });
    
    return traitCount > 0 ? totalScore / traitCount : 0.5;
  }

  // Enhanced matching with AI analysis
  async calculateEnhancedMatch(user1, user2) {
    // Get base match score
    const baseMatch = coCreationMatcher.calculateMatch(user1, user2);
    
    // Analyze bios
    const traits1 = this.analyzeBio(user1.bio);
    const traits2 = this.analyzeBio(user2.bio);
    
    const values1 = this.extractValues(user1.bio);
    const values2 = this.extractValues(user2.bio);
    
    // Calculate additional compatibility scores
    const personalityScore = this.calculatePersonalityCompatibility(traits1, traits2);
    const valuesScore = this.calculateSharedValues(values1, values2);
    
    // Communication style analysis
    const communicationScore = this.analyzeCommunicationStyle(user1.bio, user2.bio);
    
    // Combine scores with weights
    const enhancedScore = (
      baseMatch.score * 0.4 +
      personalityScore * 100 * 0.3 +
      valuesScore * 100 * 0.2 +
      communicationScore * 100 * 0.1
    );
    
    return {
      ...baseMatch,
      score: Math.round(enhancedScore),
      aiAnalysis: {
        personalityMatch: Math.round(personalityScore * 100),
        sharedValues: values1.filter(v => values2.includes(v)),
        communicationCompatibility: Math.round(communicationScore * 100),
        user1Traits: traits1,
        user2Traits: traits2,
        matchInsight: this.generateMatchInsight(traits1, traits2, values1, values2)
      }
    };
  }

  calculateSharedValues(values1, values2) {
    if (!values1.length || !values2.length) return 0.5;
    
    const shared = values1.filter(v => values2.includes(v)).length;
    const total = new Set([...values1, ...values2]).size;
    
    return total > 0 ? shared / total : 0;
  }

  analyzeCommunicationStyle(bio1, bio2) {
    if (!bio1 || !bio2) return 0.5;
    
    // Analyze communication indicators
    const style1 = {
      length: bio1.length,
      exclamations: (bio1.match(/!/g) || []).length,
      questions: (bio1.match(/\?/g) || []).length,
      emojis: (bio1.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,
      sentences: bio1.split(/[.!?]+/).length
    };
    
    const style2 = {
      length: bio2.length,
      exclamations: (bio2.match(/!/g) || []).length,
      questions: (bio2.match(/\?/g) || []).length,
      emojis: (bio2.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,
      sentences: bio2.split(/[.!?]+/).length
    };
    
    // Similar communication energy
    const lengthRatio = Math.min(style1.length, style2.length) / Math.max(style1.length, style2.length);
    const energyDiff = Math.abs(style1.exclamations - style2.exclamations) / 5;
    const emojiDiff = Math.abs(style1.emojis - style2.emojis) / 5;
    
    return (lengthRatio + (1 - energyDiff) + (1 - emojiDiff)) / 3;
  }

  generateMatchInsight(traits1, traits2, values1, values2) {
    const insights = [];
    
    // Personality insights
    if (traits1.creativity > 0.7 && traits2.creativity > 0.7) {
      insights.push("Both highly creative - expect innovative collaborations!");
    }
    
    if (traits1.extraversion > 0.7 && traits2.extraversion < 0.3) {
      insights.push("Complementary social styles - one leads, one supports");
    }
    
    // Shared values insights
    const sharedValues = values1.filter(v => values2.includes(v));
    if (sharedValues.length > 2) {
      insights.push(`Strong value alignment in: ${sharedValues.join(', ')}`);
    }
    
    // Collaboration potential
    if (traits1.collaboration > 0.6 && traits2.collaboration > 0.6) {
      insights.push("Both are team players - great co-creation potential!");
    }
    
    return insights.join('. ');
  }
}

module.exports = new AIEnhancedMatcher();