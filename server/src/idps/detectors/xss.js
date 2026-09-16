/**
 * XSS Pattern Detector
 * Detects cross-site scripting patterns in request parameters
 */
class XSSDetector {
  constructor() {
    this.patterns = [
      /<script[^>]*>.*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i, // onclick=, onerror=, onload=, etc.
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /<meta[^>]*>/i,
      /document\./i,
      /window\./i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /fromCharCode/i,
      /&#(\d+);/g,
      /&#x([0-9a-fA-F]+);/g,
      /%3Cscript/i,
      /%3E/i,
      /alert\s*\(/i,
      /confirm\s*\(/i,
      /prompt\s*\(/i
    ];
  }

  detect(data) {
    const { query, body, path } = data;
    const input = this.combineInput(query, body, path);

    for (const pattern of this.patterns) {
      if (pattern.test(input)) {
        return {
          matched: true,
          category: 'XSS',
          severity: 'HIGH',
          score: 35,
          description: 'Cross-site scripting pattern detected'
        };
      }
    }

    return { matched: false };
  }

  combineInput(query, body, path) {
    const parts = [];

    if (query) {
      parts.push(typeof query === 'string' ? query : JSON.stringify(query));
    }

    if (body) {
      parts.push(typeof body === 'string' ? body : JSON.stringify(body));
    }

    if (path) {
      parts.push(path);
    }

    return parts.join(' ');
  }
}

module.exports = XSSDetector;
