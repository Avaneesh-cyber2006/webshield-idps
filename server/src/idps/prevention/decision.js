const idpsConfig = require('../../config/idps');

/**
 * Decision Engine
 * Determines the action to take based on risk score and system mode
 */
class DecisionEngine {
  constructor() {
    this.config = idpsConfig;
    this.currentMode = this.config.modes.IDS;
  }

  setMode(mode) {
    if (Object.values(this.config.modes).includes(mode)) {
      this.currentMode = mode;
      return true;
    }
    return false;
  }

  getMode() {
    return this.currentMode;
  }

  decide(riskScore, blockedSource) {
    // If source is already blocked, always block
    if (blockedSource && blockedSource.active) {
      return {
        action: this.config.actions.BLOCK,
        reason: 'Source is in blocked list'
      };
    }

    // In MONITOR mode, only log
    if (this.currentMode === this.config.modes.MONITOR) {
      return {
        action: this.config.actions.LOG,
        reason: 'Monitor mode - no prevention'
      };
    }

    // In IDS mode, alert but don't prevent
    if (this.currentMode === this.config.modes.IDS) {
      if (riskScore >= this.config.riskLevels.HIGH.min) {
        return {
          action: this.config.actions.ALERT,
          reason: 'IDS mode - alert generated for high risk'
        };
      }
      return {
        action: this.config.actions.LOG,
        reason: 'IDS mode - logging normal requests'
      };
    }

    // In IPS mode, take preventive action
    if (this.currentMode === this.config.modes.IPS) {
      if (riskScore >= this.config.riskLevels.CRITICAL.min) {
        return {
          action: this.config.actions.BLOCK,
          reason: 'IPS mode - critical risk blocked'
        };
      }

      if (riskScore >= this.config.riskLevels.HIGH.min) {
        return {
          action: this.config.actions.TEMP_BLOCK,
          reason: 'IPS mode - high risk temporarily blocked'
        };
      }

      if (riskScore >= this.config.riskLevels.MEDIUM.min) {
        return {
          action: this.config.actions.RATE_LIMIT,
          reason: 'IPS mode - medium risk rate limited'
        };
      }

      return {
        action: this.config.actions.ALERT,
        reason: 'IPS mode - alert for moderate risk'
      };
    }

    return {
      action: this.config.actions.ALLOW,
      reason: 'Default allow'
    };
  }
}

module.exports = DecisionEngine;
