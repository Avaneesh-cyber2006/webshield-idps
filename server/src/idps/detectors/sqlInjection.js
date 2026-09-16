/**
 * SQL Injection Pattern Detector
 * Detects common SQL injection patterns in request parameters
 */
class SQLInjectionDetector {
  constructor() {
    this.patterns = [
      /' OR '1'='1/i,
      /' OR '1'='1'/i,
      /(\s|^)(OR|AND)(\s+)(\d+|'[^']*')(\s*)(=|!=|<>|<|>)(\s*)(\d+|'[^']*')/i,
      /UNION(\s+)SELECT/i,
      /(\s|^)(DROP|DELETE|INSERT|UPDATE)(\s+)(TABLE|DATABASE)/i,
      /(\s|^)(EXEC|EXECUTE)(\s+)/i,
      /(\s|^)(--|#|\/\*|\*\/)/,
      /(\s|^)(xp_|sp_)/i,
      /(\s|^)(WAITFOR|DELAY)(\s+)/i,
      /(\s|^)(1=1|1 = 1)/i,
      /(\s|^)('\s+OR\s+')/i,
      /(\s|^)('\s+AND\s+')/i,
      /(\s|^)(admin'|admin"|"or"1"="1)/i,
      /(\s|^)(ORDER\s+BY\s+\d+)/i,
      /(\s|^)(GROUP\s+BY\s+\d+)/i,
      /(\s|^)(HAVING\s+\d+|HAVING\s+'\w+')/i
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
