# WebShield Viva Preparation Guide

This document provides concise answers to common viva questions about the WebShield IDPS project.

## Core Concepts

### What is IDS?

**Intrusion Detection System (IDS)** is a security system that monitors network or system activities for malicious activities or policy violations. It detects and alerts on potential security threats but does not automatically prevent them.

**Key characteristics**:
- Passive monitoring
- Detection and alerting
- No automatic blocking
- Analysis of traffic patterns

### What is IPS?

**Intrusion Prevention System (IPS)** is a security system that not only detects intrusions but also actively attempts to stop them by taking preventive actions.

**Key characteristics**:
- Active prevention
- Automatic blocking
- Real-time response
- Configurable policies

### IDS vs IPS?

| Aspect | IDS | IPS |
|--------|-----|-----|
| Action | Detect and alert only | Detect, alert, and prevent |
| Response | Passive | Active |
| Blocking | Manual | Automatic |
| Latency | Lower | Slightly higher |
| Risk | False positives allowed | False positives disruptive |
| Use case | Monitoring, analysis | Protection, prevention |

**WebShield implementation**:
- MONITOR mode: Log only (no detection)
- IDS mode: Detect, classify, log, alert
- IPS mode: Detect, classify, log, alert, prevent

### What is Signature-based IDS?

Signature-based IDS uses known patterns of attacks (signatures) to detect threats. It compares network traffic against a database of known attack patterns.

**Examples in WebShield**:
- SQL Injection patterns: `' OR '1'='1`, `UNION SELECT`
- XSS patterns: `<script>`, `javascript:`, `onerror=`
- Path traversal patterns: `../`, `..\`, encoded variants

**Advantages**:
- Low false positive rate
- Fast detection
- Easy to understand

**Limitations**:
- Cannot detect new/unknown attacks
- Requires signature updates
- Pattern evasion possible

### What is Anomaly/Behaviour-based IDS?

Behaviour-based IDS establishes a baseline of normal behaviour and flags deviations from this baseline as potential threats.

**Examples in WebShield**:
- Request rate abuse: Unusual request frequency
- Login abuse: Repeated authentication failures
- Suspicious user-agent: Missing or anomalous headers
- Payload size: Excessive request size

**Advantages**:
- Can detect new/unknown attacks
- Adaptive to environment
- No signature database needed

**Limitations**:
- Higher false positive rate
- Requires baseline period
- Complex configuration

### What is a False Positive?

A false positive occurs when the IDS incorrectly identifies normal/benign traffic as malicious.

**Example**: A legitimate search query containing "SELECT" is flagged as SQL injection.

**Impact**:
- Unnecessary alerts
- Alert fatigue
- Potential blocking of legitimate users
- Reduced trust in system

**Mitigation in WebShield**:
- Configurable thresholds
- Multiple indicator correlation
- Manual review capability
- Adjustable detection rules

### What is a False Negative?

A false negative occurs when the IDS fails to detect actual malicious traffic.

**Example**: A sophisticated SQL injection variant bypasses pattern matching.

**Impact**:
- Security breach
- Undetected attacks
- Data compromise
- System vulnerability

**Mitigation in WebShield**:
- Multiple detection methods
- Comprehensive pattern library
- Behaviour-based detection
- Regular testing and updates

### Which is More Dangerous?

**False negatives are generally more dangerous** because they represent actual security breaches going undetected. However, excessive false positives can also be problematic by causing alert fatigue and potentially blocking legitimate users.

**Balance**: WebShield aims to minimize both through:
- Comprehensive detection rules
- Configurable sensitivity
- Manual review capabilities
- Threshold tuning

## Technical Implementation

### How Does WebShield Inspect Traffic?

WebShield uses Express middleware to inspect each HTTP request:

1. **Request ID Generation**: Unique ID for each request
2. **IP Extraction**: Normalize client IP from headers/socket
3. **Data Collection**: Extract query, body, path, headers
4. **Detector Execution**: Run all detection modules
5. **Risk Calculation**: Combine detection results into score
6. **Decision Making**: Apply IDS/IPS policy
7. **Prevention**: Execute blocking if needed
8. **Logging**: Store security event and traffic data
9. **Real-time Update**: Emit Socket.IO event

**Code flow**:
```
Express → IDPS Middleware → Detectors → Risk Engine → Decision Engine → Prevention → Response
```

### How Does SQL Injection Detection Work?

WebShield uses pattern matching to detect SQL injection:

**Patterns detected**:
- `' OR '1'='1` - Boolean-based
- `UNION SELECT` - Union-based
- `DROP TABLE` - DDL statements
- `--`, `#`, `/* */` - SQL comments
- `1=1` - Always true conditions
- `EXEC`, `EXECUTE` - Command execution

**Implementation**:
```javascript
patterns = [
  /(\s|^)(OR|AND)(\s+)(\d+|'[^']*')(\s*)(=|!=|<>|<|>)(\s*)(\d+|'[^']*')/gi,
  /UNION(\s+)SELECT/gi,
  /(\s|^)(DROP|DELETE|INSERT|UPDATE)(\s+)(TABLE|DATABASE)/gi,
  // ... more patterns
]
```

**Safety**: Uses parameterized queries in actual database operations; patterns only used for detection.

### How Does XSS Detection Work?

WebShield detects cross-site scripting patterns:

**Patterns detected**:
- `<script>...</script>` - Script tags
- `javascript:` - JavaScript protocol
- `onerror=`, `onload=` - Event handlers
- `<iframe>`, `<object>`, `<embed>` - HTML elements
- `document.`, `window.` - DOM access
- `eval(` - Code execution
- `&#...;` - HTML entity encoding

**Implementation**:
```javascript
patterns = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>/gi,
  // ... more patterns
]
```

**Safety**: Never executes submitted HTML/JavaScript; renders content safely.

### How Does Brute-Force Detection Work?

WebShield detects login abuse through:

**Mechanism**:
1. Track authentication failures per source IP
2. Store failure timestamps in memory
3. Remove failures older than time window (60 seconds)
4. Count recent failures
5. Trigger detection if threshold exceeded (5 failures)

**Implementation**:
```javascript
failureMap = new Map() // IP -> [timestamp1, timestamp2, ...]

if (recentFailures.length >= 5) {
  return { matched: true, category: 'LOGIN_ABUSE', score: 10 }
}
```

**Response**:
- IDS mode: Alert and log
- IPS mode: Rate limit or temporary block

### How Does Rate-Based Detection Work?

WebShield detects request rate abuse:

**Mechanism**:
1. Track all requests per source IP
2. Store request timestamps in memory
3. Remove requests older than time window (60 seconds)
4. Count recent requests
5. Trigger detection if threshold exceeded (50 requests)

**Implementation**:
```javascript
requestMap = new Map() // IP -> [timestamp1, timestamp2, ...]

if (recentRequests.length >= 50) {
  return { matched: true, category: 'REQUEST_RATE_ABUSE', score: 20 }
}
```

**Response**:
- IDS mode: Alert and log
- IPS mode: Rate limit (429 response)

### How Is Risk Calculated?

WebShield calculates risk scores from detection results:

**Scoring**:
- Suspicious User-Agent: 10 points
- Authentication Failure: 10 points
- Request Rate Abuse: 20 points
- Path Traversal: 30 points
- XSS Pattern: 35 points
- SQL Injection Pattern: 40 points
- Payload Size Exceeded: 15 points

**Calculation**:
```javascript
totalScore = sum(detectionScores)
totalScore = min(totalScore, 100) // Cap at 100
```

**Severity Levels**:
- 0-19: LOW
- 20-39: MEDIUM
- 40-69: HIGH
- 70-100: CRITICAL

**Multiple Indicators**: If multiple detectors match, scores are combined.

### How Is a Request Blocked?

WebShield blocks requests through application-level middleware:

**Blocking Process**:
1. Check if source IP is in blocked list
2. If blocked, return 403 immediately
3. If not blocked, proceed with detection
4. If IPS mode and risk score ≥ 70: Permanent block
5. If IPS mode and risk score ≥ 40: Temporary block (5 minutes)
6. If IPS mode and risk score ≥ 20: Rate limit
7. Store block in database
8. Return 403 with block information

**Block Response**:
```json
{
  "success": false,
  "message": "Request blocked by WebShield IDPS",
  "requestId": "REQ-20260916-ABC123",
  "riskScore": 85
}
```

**Note**: Does not modify OS firewall; uses application-level blocking.

### Why Socket.IO?

Socket.IO is used for real-time updates:

**Benefits**:
- Real-time dashboard updates without page refresh
- Efficient bidirectional communication
- Automatic reconnection
- Room-based subscriptions (admin room)
- Works across different browsers

**Events Used**:
- `traffic:new`: New traffic event
- `security:new`: New security event
- `security:blocked`: Source blocked
- `mode:changed`: IDPS mode changed

**Alternative considered**: Polling (less efficient, higher latency)

### Why SQLite?

SQLite is used for the database:

**Reasons**:
- Zero configuration (file-based)
- No separate database server needed
- Easy setup and portability
- Sufficient for educational/demo purposes
- Prisma ORM support
- ACID compliant

**Limitations**:
- Not suitable for high-concurrency production
- Single-writer limitation
- No network access

**Alternative for production**: PostgreSQL, MySQL

### Why Prisma?

Prisma is used as the ORM:

**Benefits**:
- Type-safe database access
- Auto-generated TypeScript types
- Migration management
- Seed data support
- Clean API
- Good developer experience

**Features Used**:
- Schema definition
- Migrations
- Seeding
- Query builder
- Relations

### Why React?

React is used for the frontend:

**Benefits**:
- Component-based architecture
- Virtual DOM for performance
- Large ecosystem
- Good state management
- Reusable components
- Modern development experience

**Libraries Used**:
- React Router: Navigation
- Axios: HTTP client
- Recharts: Data visualization
- Socket.IO Client: Real-time updates
- Tailwind CSS: Styling
- Lucide React: Icons

### How Does Multi-Computer Operation Work?

WebShield supports multi-computer LAN operation:

**Key Features**:
1. **0.0.0.0 Binding**: Server listens on all interfaces
2. **IP Normalization**: Handles IPv6-mapped IPv4 addresses
3. **Relative API Paths**: Frontend uses `/api` in production
4. **Socket.IO LAN Support**: WebSocket connections across LAN
5. **Device Labels**: Friendly names for IP addresses

**IP Normalization**:
```javascript
// Handles ::ffff:192.168.1.1 -> 192.168.1.1
// Handles ::1 -> 127.0.0.1
function normalizeIp(ip) {
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }
  return ip
}
```

**Access Pattern**:
- Development: http://localhost:3000 + http://localhost:5000
- Production: http://localhost:8080
- LAN: http://192.168.1.10:8080

### How Do You Determine Source IP?

WebShield determines client IP through:

**Priority Order**:
1. `X-Forwarded-For` header (first IP)
2. `X-Real-IP` header
3. `socket.remoteAddress`

**Implementation**:
```javascript
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const remoteAddr = req.socket.remoteAddress

  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : realIp || remoteAddr

  return normalizeIp(ip)
}
```

**Considerations**:
- Proxy scenarios
- IPv6-mapped IPv4
- Localhost variations
- Trusted proxies only

## Testing and Metrics

### How Is the Project Tested?

WebShield uses multiple testing approaches:

**Automated Tests**:
- Unit tests (Vitest)
- Integration tests (Supertest)
- Detector logic tests
- Risk scoring tests
- Decision engine tests
- Metrics calculation tests

**Manual Tests**:
- Security Test Lab
- Predefined test cases
- IDS vs IPS comparison
- Multi-computer scenarios

**Test Coverage**:
- Detectors: SQLi, XSS, path traversal
- Risk scoring: Single and multiple detections
- Decision engine: All modes (MONITOR, IDS, IPS)
- Prevention: Blocking, rate limiting
- Metrics: TP, TN, FP, FN, accuracy, precision, recall, F1

### Explain TP/TN/FP/FN

**Confusion Matrix**:

| Actual \ Predicted | Attack | Normal |
|-------------------|--------|--------|
| **Attack** | TP | FN |
| **Normal** | FP | TN |

**True Positive (TP)**: Attack correctly detected
- Example: SQL injection pattern detected and flagged

**True Negative (TN)**: Normal traffic correctly allowed
- Example: Normal search query allowed without alert

**False Positive (FP)**: Normal traffic incorrectly flagged
- Example: Legitimate query with "SELECT" flagged as SQLi

**False Negative (FN)**: Attack incorrectly allowed
- Example: SQL injection variant bypasses detection

### Explain Accuracy

**Accuracy** measures overall correctness of predictions:

```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
```

**Example**:
- TP = 80, TN = 15, FP = 3, FN = 2
- Total = 100
- Accuracy = (80 + 15) / 100 = 0.95 = 95%

**Interpretation**: 95% of all predictions were correct.

**Limitation**: Can be misleading with imbalanced datasets.

### Explain Precision

**Precision** measures correctness of positive predictions:

```
Precision = TP / (TP + FP)
```

**Example**:
- TP = 80, FP = 3
- Precision = 80 / 83 = 0.964 = 96.4%

**Interpretation**: When the system predicts "attack", it's correct 96.4% of the time.

**Importance**: High precision means few false alarms.

### Explain Recall

**Recall** (Sensitivity) measures ability to detect actual attacks:

```
Recall = TP / (TP + FN)
```

**Example**:
- TP = 80, FN = 2
- Recall = 80 / 82 = 0.976 = 97.6%

**Interpretation**: The system detects 97.6% of actual attacks.

**Importance**: High recall means few missed attacks.

### Explain F1

**F1 Score** is the harmonic mean of precision and recall:

```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
```

**Example**:
- Precision = 0.964, Recall = 0.976
- F1 = 2 * (0.964 * 0.976) / (0.964 + 0.976) = 0.970 = 97.0%

**Interpretation**: Balanced measure of precision and recall.

**Importance**: Better single metric than accuracy for imbalanced data.

## Limitations

### Limitations of the Current System

**Detection Limitations**:
- Pattern-based detection cannot detect novel attacks
- Behaviour-based detection may produce false positives
- No machine learning or anomaly detection
- Limited to HTTP layer (no network-level analysis)

**Architecture Limitations**:
- Single-server architecture (not distributed)
- SQLite not suitable for high-concurrency production
- In-memory state not shared across instances
- No high availability or failover

**Feature Limitations**:
- No threat intelligence feeds
- No GeoIP blocking
- No email/SMS alerts
- No custom rule builder
- No advanced reporting

**Security Limitations**:
- No SSL/TLS (HTTP only)
- Educational focus, not production-hardened
- Limited input validation
- No rate limiting on authentication endpoints

**Scalability Limitations**:
- Not designed for high-traffic production
- No caching layer
- No load balancing
- No horizontal scaling

## Future Enhancements

### Potential Future Improvements

**Detection Enhancements**:
- Machine learning anomaly detection
- Behavioural profiling and baselining
- Threat intelligence feed integration
- Advanced payload analysis
- API-specific detection rules

**Architecture Improvements**:
- Microservices architecture
- Distributed detection nodes
- Central SOC server
- Message queue (RabbitMQ, Kafka)
- Event-driven architecture

**Infrastructure Improvements**:
- PostgreSQL for production
- Redis for caching and state
- Reverse proxy (Nginx, Apache)
- Container deployment (Docker, Kubernetes)
- SSL/TLS termination

**Feature Enhancements**:
- GeoIP blocking
- Email/SMS/webhook alerts
- Advanced reporting and analytics
- Custom rule builder UI
- API security testing integration
- SIEM integration

**Scalability Improvements**:
- Horizontal scaling
- Load balancing
- Database sharding
- CDN integration
- Edge computing

**Security Enhancements**:
- Multi-factor authentication
- Role-based access control
- Audit logging
- Encryption at rest
- Secure key management

## Conclusion

WebShield demonstrates core IDPS concepts including signature-based and behaviour-based detection, risk scoring, IDS/IPS modes, and comprehensive metrics. While designed for educational purposes, it provides a solid foundation for understanding real-world intrusion detection and prevention systems.
