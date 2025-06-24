class CoCreationMatcher {
  constructor() {
    this.weights = {
      sharedInterests: 0.25,
      collaborationStyle: 0.25,
      contributionScore: 0.20,
      activityAlignment: 0.15,
      proximityScore: 0.15
    };
  }

  calculateMatch(user1, user2) {
    const scores = {
      sharedInterests: this.calculateSharedInterests(user1, user2),
      collaborationStyle: this.calculateCollaborationStyle(user1, user2),
      contributionScore: this.calculateContributionCompatibility(user1, user2),
      activityAlignment: this.calculateActivityAlignment(user1, user2),
      proximityScore: this.calculateProximity(user1, user2)
    };

    const totalScore = Object.keys(scores).reduce((sum, key) => {
      return sum + (scores[key] * this.weights[key]);
    }, 0);

    return {
      score: Math.round(totalScore * 100),
      breakdown: scores,
      coCreationPotential: this.assessCoCreationPotential(user1, user2, totalScore)
    };
  }

  calculateSharedInterests(user1, user2) {
    const interests1 = new Set(user1.interests || []);
    const interests2 = new Set(user2.interests || []);
    
    const intersection = [...interests1].filter(x => interests2.has(x));
    const union = new Set([...interests1, ...interests2]);
    
    return union.size > 0 ? intersection.length / union.size : 0;
  }

  calculateCollaborationStyle(user1, user2) {
    const style1 = user1.contributionHistory || [];
    const style2 = user2.contributionHistory || [];
    
    if (style1.length === 0 || style2.length === 0) return 0.5;
    
    const avgContribution1 = style1.reduce((sum, h) => sum + h.value, 0) / style1.length;
    const avgContribution2 = style2.reduce((sum, h) => sum + h.value, 0) / style2.length;
    
    const difference = Math.abs(avgContribution1 - avgContribution2);
    return Math.max(0, 1 - difference / 100);
  }

  calculateContributionCompatibility(user1, user2) {
    const score1 = user1.coCreationScore || 0;
    const score2 = user2.coCreationScore || 0;
    
    const avgScore = (score1 + score2) / 2;
    const scoreDiff = Math.abs(score1 - score2);
    
    const compatibility = avgScore / 100 * (1 - scoreDiff / 100);
    return Math.min(1, Math.max(0, compatibility));
  }

  calculateActivityAlignment(user1, user2) {
    const activities1 = this.extractActivities(user1.contributionHistory || []);
    const activities2 = this.extractActivities(user2.contributionHistory || []);
    
    const commonActivities = activities1.filter(a => activities2.includes(a));
    const totalActivities = [...new Set([...activities1, ...activities2])].length;
    
    return totalActivities > 0 ? commonActivities.length / totalActivities : 0.5;
  }

  calculateProximity(user1, user2) {
    if (!user1.location || !user2.location) return 0;
    
    const lat1 = user1.location.lat;
    const lng1 = user1.location.lng;
    const lat2 = user2.location.lat;
    const lng2 = user2.location.lng;
    
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
    
    const distance = this.haversineDistance(lat1, lng1, lat2, lng2);
    const maxDistance = Math.max(user1.preferences?.distance || 50, user2.preferences?.distance || 50);
    
    return Math.max(0, 1 - distance / maxDistance);
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  extractActivities(history) {
    return history.map(h => h.type).filter(Boolean);
  }

  assessCoCreationPotential(user1, user2, score) {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Moderate';
    return 'Low';
  }

  async findMatches(userId, candidates, limit = 10) {
    const user = candidates.find(u => u.id === userId);
    if (!user) return [];

    const matches = candidates
      .filter(candidate => candidate.id !== userId)
      .map(candidate => ({
        user: candidate,
        matchData: this.calculateMatch(user, candidate)
      }))
      .sort((a, b) => b.matchData.score - a.matchData.score)
      .slice(0, limit);

    return matches;
  }
}

module.exports = new CoCreationMatcher();