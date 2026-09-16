/**
 * Path Traversal Detector
 * Detects path traversal attempts like ../ or ..\
 */
class PathTraversalDetector {
  constructor() {
    this.patterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e\\/gi,
      /%252e%252e%252f/gi,
      /..%5c/gi,
      /%5c%5c/gi,
      /\/etc\//gi,
      /\/windows\//gi,
      /c:\\/gi,
      /file:\/\//gi,
      /~\/+/g
    ];
  }

  detect(data) {
    const { query, body, path } = data;
    const input = this.combineInput(query, body, path);

    for (const pattern of this.patterns) {
      if (pattern.test(input)) {
        return {
          matched: true,
          category: 'PATH_TRAVERSAL',
          severity: 'HIGH',
          score: 30,
          description: 'Path traversal pattern detected'
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

module.exports = PathTraversalDetector;
