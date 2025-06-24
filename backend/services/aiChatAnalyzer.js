const logger = require('../utils/logger');

class AIChatAnalyzer {
  constructor() {
    this.conversationPatterns = new Map();
  }

  // Analyze conversation style between two users
  async analyzeConversation(messages) {
    if (!messages || messages.length < 10) {
      return null; // Need enough messages for analysis
    }

    const analysis = {
      responseTime: this.analyzeResponseTimes(messages),
      messageLength: this.analyzeMessageLengths(messages),
      emotionalTone: this.analyzeEmotionalTone(messages),
      topicsDiscussed: this.extractTopics(messages),
      conversationBalance: this.analyzeBalance(messages),
      compatibility: 0
    };

    // Calculate overall compatibility
    analysis.compatibility = this.calculateChatCompatibility(analysis);

    return analysis;
  }

  analyzeResponseTimes(messages) {
    const responseTimes = [];
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].senderId !== messages[i-1].senderId) {
        const timeDiff = new Date(messages[i].createdAt) - new Date(messages[i-1].createdAt);
        responseTimes.push(timeDiff / 1000 / 60); // Convert to minutes
      }
    }

    return {
      average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      pattern: this.determineResponsePattern(responseTimes)
    };
  }

  analyzeMessageLengths(messages) {
    const user1Messages = messages.filter((m, i) => i % 2 === 0);
    const user2Messages = messages.filter((m, i) => i % 2 === 1);

    const avg1 = user1Messages.reduce((sum, m) => sum + m.content.length, 0) / user1Messages.length;
    const avg2 = user2Messages.reduce((sum, m) => sum + m.content.length, 0) / user2Messages.length;

    return {
      user1Average: avg1,
      user2Average: avg2,
      similarity: 1 - Math.abs(avg1 - avg2) / Math.max(avg1, avg2)
    };
  }

  analyzeEmotionalTone(messages) {
    const positiveWords = ['love', 'great', 'awesome', 'happy', 'excited', 'wonderful', 'amazing', 'fantastic', 'good', 'like'];
    const negativeWords = ['hate', 'bad', 'terrible', 'sad', 'angry', 'awful', 'horrible', 'dislike', 'upset', 'frustrated'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let emojiCount = 0;
    let exclamationCount = 0;
    let questionCount = 0;

    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      positiveWords.forEach(word => {
        if (content.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (content.includes(word)) negativeCount++;
      });
      
      emojiCount += (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
      exclamationCount += (content.match(/!/g) || []).length;
      questionCount += (content.match(/\?/g) || []).length;
    });

    const totalWords = messages.reduce((sum, m) => sum + m.content.split(' ').length, 0);
    
    return {
      positivity: positiveCount / totalWords,
      negativity: negativeCount / totalWords,
      emojiUsage: emojiCount / messages.length,
      enthusiasm: exclamationCount / messages.length,
      curiosity: questionCount / messages.length,
      overallTone: positiveCount > negativeCount * 2 ? 'positive' : 
                   negativeCount > positiveCount * 2 ? 'negative' : 'neutral'
    };
  }

  extractTopics(messages) {
    const topics = {
      personal: 0,
      work: 0,
      hobbies: 0,
      philosophy: 0,
      future: 0,
      emotions: 0
    };

    const topicKeywords = {
      personal: ['family', 'friend', 'life', 'story', 'experience', 'childhood', 'memory'],
      work: ['work', 'job', 'career', 'project', 'business', 'professional', 'office'],
      hobbies: ['hobby', 'interest', 'fun', 'enjoy', 'love to', 'passion', 'free time'],
      philosophy: ['think', 'believe', 'meaning', 'purpose', 'why', 'philosophy', 'opinion'],
      future: ['future', 'plan', 'goal', 'dream', 'hope', 'will', 'going to'],
      emotions: ['feel', 'emotion', 'happy', 'sad', 'love', 'afraid', 'excited']
    };

    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            topics[topic]++;
          }
        });
      });
    });

    // Normalize and return top topics
    const totalTopics = Object.values(topics).reduce((a, b) => a + b, 0);
    const normalizedTopics = {};
    
    Object.entries(topics).forEach(([topic, count]) => {
      if (count > 0) {
        normalizedTopics[topic] = count / totalTopics;
      }
    });

    return normalizedTopics;
  }

  analyzeBalance(messages) {
    const user1Count = messages.filter((m, i) => i % 2 === 0).length;
    const user2Count = messages.filter((m, i) => i % 2 === 1).length;
    
    const balance = Math.min(user1Count, user2Count) / Math.max(user1Count, user2Count);
    
    return {
      messageCountBalance: balance,
      isBalanced: balance > 0.7
    };
  }

  determineResponsePattern(responseTimes) {
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    if (avg < 5) return 'rapid-fire';
    if (avg < 30) return 'engaged';
    if (avg < 120) return 'thoughtful';
    return 'sporadic';
  }

  calculateChatCompatibility(analysis) {
    let score = 0;
    
    // Response time compatibility (prefer similar patterns)
    if (analysis.responseTime.pattern === 'engaged') score += 20;
    
    // Message length similarity
    score += analysis.messageLength.similarity * 20;
    
    // Emotional tone (prefer positive)
    if (analysis.emotionalTone.overallTone === 'positive') score += 20;
    score += Math.min(analysis.emotionalTone.positivity * 100, 10);
    
    // Conversation balance
    if (analysis.conversationBalance.isBalanced) score += 20;
    
    // Topic diversity (more topics = better)
    const topicCount = Object.keys(analysis.topicsDiscussed).length;
    score += Math.min(topicCount * 2, 10);
    
    return Math.min(Math.round(score), 100);
  }

  // Get conversation insights for display
  generateInsights(analysis) {
    const insights = [];
    
    if (analysis.responseTime.pattern === 'rapid-fire') {
      insights.push("You both enjoy quick, energetic conversations!");
    } else if (analysis.responseTime.pattern === 'thoughtful') {
      insights.push("You take time to craft meaningful responses");
    }
    
    if (analysis.messageLength.similarity > 0.8) {
      insights.push("Your communication styles are well-matched");
    }
    
    if (analysis.emotionalTone.emojiUsage > 0.3) {
      insights.push("Lots of emotional expression through emojis! 😊");
    }
    
    if (analysis.emotionalTone.curiosity > 0.2) {
      insights.push("Great at asking questions and showing interest");
    }
    
    const topTopics = Object.entries(analysis.topicsDiscussed)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([topic]) => topic);
    
    if (topTopics.length > 0) {
      insights.push(`You connect well discussing: ${topTopics.join(' and ')}`);
    }
    
    return insights;
  }
}

module.exports = new AIChatAnalyzer();