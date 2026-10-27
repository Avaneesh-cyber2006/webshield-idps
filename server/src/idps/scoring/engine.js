const idpsConfig = require('../../config/idps');

/**
 * Risk Scoring Engine
 * Calculates risk score from detection results
 */
class RiskScoringEngine {
  constructor() {
    this.config = idpsConfig;
  }

  calculate(detectionResults) {
    if (!detectionResults || detectionResults.length === 0) {
      return {
        score: 0,
        severity: 'LOW',
        categories: []
      };
    }

    let totalScore = 0;
    const categories = [];
    const severities = [];

    for (const result of detectionResults) {
      totalScore += result.score || 0;
      categories.push(result.category);
      severities.push(result.severity);
    }

    // Cap at 100
    totalScore = Math.min(totalScore, 100);

    // Determine severity based on score
    let severity = 'LOW';
    if (totalScore >= this.config.riskLevels.CRITICAL.min) {
      severity = 'CRITICAL';
    } else if (totalScore >= this.config.riskLevels.HIGH.min) {
      severity = 'HIGH';
    } else if (totalScore >= this.config.riskLevels.MEDIUM.min) {
      severity = 'MEDIUM';
    }

    return {
      score: totalScore,
      severity,
      categories: [...new Set(categories)], // Unique categories
      severities: [...new Set(severities)] // Unique severities
    };
  }

  getSeverity(score) {
    if (score >= this.config.riskLevels.CRITICAL.min) return 'CRITICAL';
    if (score >= this.config.riskLevels.HIGH.min) return 'HIGH';
    if (score >= this.config.riskLevels.MEDIUM.min) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = RiskScoringEngine;
