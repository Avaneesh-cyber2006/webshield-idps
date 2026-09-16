/**
 * XSS Pattern Detector
 * Detects cross-site scripting patterns in request parameters
 */
class XSSDetector {
  constructor() {
    this.patterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // onclick=, onerror=, onload=, etc.
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<meta[^>]*>/gi,
      /document\./gi,
      /window\./gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /fromCharCode/gi,
      /&#(\d+);/g,
      /&#x([0-9a-fA-F]+);/g,
      /%3Cscript/gi,
      /%3E/gi,
      /alert\s*\(/gi,
      /confirm\s*\(/gi,
      /prompt\s*\(/gi
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
