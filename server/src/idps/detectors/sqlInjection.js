/**
 * SQL Injection Pattern Detector
 * Detects common SQL injection patterns in request parameters
 */
class SQLInjectionDetector {
  constructor() {
    this.patterns = [
      /' OR '1'='1/gi,
      /' OR '1'='1'/gi,
      /(\s|^)(OR|AND)(\s+)(\d+|'[^']*')(\s*)(=|!=|<>|<|>)(\s*)(\d+|'[^']*')/gi,
      /UNION(\s+)SELECT/gi,
      /(\s|^)(DROP|DELETE|INSERT|UPDATE)(\s+)(TABLE|DATABASE)/gi,
      /(\s|^)(EXEC|EXECUTE)(\s+)/gi,
      /(\s|^)(--|#|\/\*|\*\/)/g,
      /(\s|^)(xp_|sp_)/gi,
      /(\s|^)(WAITFOR|DELAY)(\s+)/gi,
      /(\s|^)(1=1|1 = 1)/gi,
      /(\s|^)('\s+OR\s+')/gi,
      /(\s|^)('\s+AND\s+')/gi,
      /(\s|^)(admin'|admin"|"or"1"="1)/gi,
      /(\s|^)(ORDER\s+BY\s+\d+)/gi,
      /(\s|^)(GROUP\s+BY\s+\d+)/gi,
      /(\s|^)(HAVING\s+\d+|HAVING\s+'\w+')/gi
    ];
  }

  detect(data) {
    const { query, body, path } = data;
    const input = this.combineInput(query, body, path);

    for (const pattern of this.patterns) {
      if (pattern.test(input)) {
        return {
          matched: true,
          category: 'SQL_INJECTION',
          severity: 'HIGH',
          score: 40,
          description: 'SQL injection pattern detected'
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

module.exports = SQLInjectionDetector;
