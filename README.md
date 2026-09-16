# WebShield: Real-Time Web Intrusion Detection and Prevention System

A comprehensive full-stack Intrusion Detection and Prevention System (IDPS) designed for educational cybersecurity demonstrations. WebShield provides real-time traffic monitoring, threat detection, automated prevention, and detailed security analytics.

## Problem Statement

Modern web applications face constant security threats from automated attacks, injection attempts, and malicious traffic. Traditional security solutions are often complex, expensive, or lack real-time visibility. WebShield addresses these challenges by providing an accessible, educational platform that demonstrates core IDPS concepts.

## Objectives

- **Real-time Monitoring**: Inspect and analyze web traffic in real-time
- **Threat Detection**: Identify common attack patterns (SQLi, XSS, path traversal)
- **Behavior Analysis**: Detect anomalous behavior (rate abuse, login abuse)
- **Risk Scoring**: Calculate comprehensive risk scores for each request
- **Automated Prevention**: Implement IDS and IPS modes with configurable policies
- **Multi-computer Support**: Demonstrate LAN-based security monitoring
- **Educational Testing**: Security Test Lab with confusion matrix metrics

## Features

### Core Capabilities

- **Signature-based Detection**: SQL Injection, XSS, Path Traversal patterns
- **Behavior-based Detection**: Rate abuse, login abuse, suspicious user agents
- **Risk Scoring**: 0-100 score with severity classification (LOW, MEDIUM, HIGH, CRITICAL)
- **System Modes**: MONITOR (log only), IDS (detect & alert), IPS (detect & prevent)
- **Prevention Actions**: ALLOW, LOG, ALERT, RATE_LIMIT, TEMP_BLOCK, BLOCK
- **Real-time Updates**: Socket.IO for live dashboard updates
- **Multi-computer LAN Support**: 0.0.0.0 binding, IP normalization, device labels

### Admin Dashboard

- **Overview**: Real-time statistics and system status
- **Live Traffic**: Monitor all requests with filtering
- **Threat Events**: Searchable security event history
- **Blocked Sources**: Manage blocked IPs with manual control
- **Security Rules**: Enable/disable detection rules
- **Analytics**: Visual charts for threat trends and distribution
- **Test Lab**: Automated security testing with metrics
- **System Logs**: Server and security event logs
- **Network Demo**: Multi-computer demonstration setup
- **Settings**: Configure IDPS mode and device labels

### Security Test Lab

Predefined test cases for security validation:
- Normal Request
- Normal Login
- SQL Injection Pattern
- XSS Pattern
- Path Traversal Pattern
- Invalid Authentication
- Repeated Login Failure
- Request Rate Abuse
- Suspicious User-Agent
- Controlled Oversized Payload

**Metrics Calculated**:
- True Positive (TP), True Negative (TN)
- False Positive (FP), False Negative (FN)
- Accuracy, Precision, Recall, F1 Score

## Technology Stack

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Recharts**: Data visualization
- **Lucide React**: Icons
- **Socket.IO Client**: Real-time communication

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Socket.IO**: Real-time server
- **Prisma ORM**: Database ORM
- **SQLite**: Database (file-based)
- **bcrypt**: Password hashing
- **JWT**: Authentication tokens
- **Zod**: Input validation

### Testing
- **Vitest**: Unit testing framework
- **Supertest**: HTTP assertion library

## Architecture

```
CLIENT (React)
    ↓
EXPRESS SERVER
    ↓
REQUEST ID MIDDLEWARE
    ↓
IDPS REQUEST INSPECTOR
    ↓
DETECTION ENGINES
    ├─ SQL Injection Detector
    ├─ XSS Detector
    ├─ Path Traversal Detector
    ├─ Login Abuse Detector
    ├─ Request Rate Detector
    ├─ Suspicious User-Agent Detector
    ├─ Auth Abuse Detector
    └─ Payload Size Detector
    ↓
RISK SCORING ENGINE
    ↓
DECISION ENGINE (IDS/IPS Policy)
    ↓
PREVENTION LAYER
    ├─ Rate Limiting
    ├─ Temporary Blocking
    └─ Permanent Blocking
    ↓
DEMO APPLICATION/API
    ↓
SECURITY EVENT
    ├─ Database (Prisma + SQLite)
    ├─ Socket.IO (Real-time)
    └─ Admin Dashboard
```

## Project Structure

```
webshield/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   ├── layouts/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── idps/
│   │   │   ├── detectors/
│   │   │   ├── scoring/
│   │   │   ├── prevention/
│   │   │   └── services/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── package.json
│   └── vitest.config.js
├── docs/
│   ├── ARCHITECTURE.md
│   ├── TESTING.md
│   ├── LAN_DEMO.md
│   ├── VIVA.md
│   └── TROUBLESHOOTING.md
├── package.json
├── .gitignore
└── README.md
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git (optional)

### Windows Setup

1. **Clone or extract the project**:
   ```bash
   cd "C:\Users\avane\Desktop\Studies\Semester 5\IDPS\Project"
   ```

2. **Install dependencies**:
   ```bash
   npm run setup
   ```

   This installs dependencies for both client and server.

3. **Initialize database**:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Development mode**:
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Usage

### Development Mode

Start both frontend and backend:
```bash
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Dashboard: http://localhost:3000/admin/overview

### Production-like Local Mode

1. **Build frontend**:
   ```bash
   npm run build
   ```

2. **Start server**:
   ```bash
   npm start
   ```

Access:
- Single server: http://localhost:8080
- Admin Dashboard: http://localhost:8080/admin/overview

### LAN Access

For multi-computer demonstrations:

1. **Find your LAN IP** (Windows):
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.10)

2. **Start server in production mode**:
   ```bash
   npm start
   ```

3. **Access from other computers**:
   - Normal user: http://YOUR_LAN_IP:8080/demo
   - Admin dashboard: http://YOUR_LAN_IP:8080/admin/overview
   - Test Lab: http://YOUR_LAN_IP:8080/admin/test-lab

## Default Login Credentials

### Admin User
- **Email**: admin@webshield.local
- **Password**: admin123
- **Access**: Full admin dashboard and Test Lab

### Demo User
- **Email**: user@webshield.local
- **Password**: user123
- **Access**: Demo application only

## Security Test Lab

The Test Lab provides automated security testing with predefined test cases.

### Running Tests

1. Navigate to **Test Lab** in the admin dashboard
2. Click **Run All Tests** to execute the full test suite
3. View the security report with:
   - Total tests, passed, failed
   - Confusion matrix (TP, TN, FP, FN)
   - Metrics (Accuracy, Precision, Recall, F1 Score)

### IDS vs IPS Demonstration

1. **Switch to IDS mode** in Settings
2. Run a test (e.g., SQL Injection)
3. Expected: DETECTED, LOGGED, ALERTED (not blocked)
4. **Switch to IPS mode**
5. Run the same test
6. Expected: DETECTED, LOGGED, ALERTED, BLOCKED

## Automated Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Test Coverage

- Unit tests for detectors (SQLi, XSS, path traversal)
- Risk scoring engine tests
- Decision engine tests (IDS/IPS modes)
- Metrics calculation tests
- API integration tests

## Multi-Computer Setup

See [docs/LAN_DEMO.md](docs/LAN_DEMO.md) for detailed multi-computer demonstration instructions.

### Typical Configuration

- **Computer 1**: WebShield server + Admin dashboard
- **Computer 2**: Normal user (demo application)
- **Computer 3**: Security test client (Test Lab)

## Safety Statement

**IMPORTANT**: This is an educational cybersecurity project.

- All attack simulations target ONLY the project's own local demo server
- Do not attack public websites, third-party systems, or external IP addresses
- The Test Lab accepts only approved local targets
- No malware or actual exploits are generated
- Use only on trusted private networks

## Future Scope

Potential enhancements (not implemented):
- Machine learning anomaly detection
- Threat intelligence feeds
- GeoIP blocking
- Email alerts
- Distributed IDPS sensors
- Central SOC server
- PostgreSQL for production
- Redis for caching
- Reverse proxy integration
- Container deployment

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

## License

This is an educational project. Use responsibly and ethically.

## Acknowledgments

- Built for IDPS coursework
- Designed for cybersecurity education
- Demonstrates core security concepts

---

**Version**: 1.0.0
**Last Updated**: September 2026
