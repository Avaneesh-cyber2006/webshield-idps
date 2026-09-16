# WebShield Testing Documentation

## Overview

WebShield includes comprehensive testing capabilities including automated unit/integration tests and a manual Security Test Lab for demonstrating IDPS functionality.

## Automated Testing

### Test Framework

- **Vitest**: Unit testing framework
- **Supertest**: HTTP assertion library for API testing
- **Coverage**: v8 coverage provider

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Unit Tests

Location: `server/tests/unit/`

#### Detector Tests (`detectors.test.js`)

Tests for signature-based detection:

**SQL Injection Detector**:
- Detects `' OR '1'='1` pattern
- Detects `UNION SELECT` pattern
- Detects `DROP TABLE` pattern
- Does not flag normal input

**XSS Detector**:
- Detects `<script>` tags
- Detects `javascript:` protocol
- Detects `onerror=` handlers
- Does not flag normal input

**Path Traversal Detector**:
- Detects `../` patterns
- Detects `..\` patterns
- Detects encoded traversal
- Does not flag normal input

#### Risk Scoring Tests (`riskScoring.test.js`)

Tests for risk calculation:
- Returns 0 for no detections
- Calculates score for single detection
- Combines scores from multiple detections
- Caps score at 100
- Determines correct severity levels
- Collects unique categories

#### Decision Engine Tests (`decisionEngine.test.js`)

Tests for IDS/IPS policy:
- Starts in IDS mode
- Allows mode changes
- Rejects invalid modes
- Always BLOCKs blocked sources
- LOGs in MONITOR mode
- ALERTs in IDS mode for high risk
- BLOCKs in IPS mode for critical risk
- TEMP_BLOCKs in IPS mode for high risk
- RATE_LIMITs in IPS mode for medium risk

#### Metrics Tests (`metrics.test.js`)

Tests for confusion matrix metrics:
- Calculates accuracy correctly
- Calculates precision correctly
- Calculates recall correctly
- Calculates F1 score correctly
- Handles division by zero
- Converts to percentage
- Identifies TP, TN, FP, FN correctly

### Integration Tests

Location: `server/tests/integration/`

#### API Tests (`api.test.js`)

Tests for API endpoints:
- Health check endpoint
- Public endpoint access
- Protected endpoint rejection
- Invalid login rejection
- SQL injection pattern handling
- XSS pattern handling
- Path traversal pattern handling

## Security Test Lab

The Security Test Lab is a manual testing interface for demonstrating IDPS capabilities with predefined test cases.

### Test Cases

#### 1. Normal Request
- **Purpose**: Baseline for normal traffic
- **Expected**: ALLOW
- **Method**: GET /api/public with normal user-agent

#### 2. Normal Login
- **Purpose**: Normal authentication flow
- **Expected**: ALLOW
- **Method**: POST /api/auth/login with valid credentials

#### 3. SQL Injection Pattern
- **Purpose**: Test SQLi detection
- **Expected**: DETECTED (ALERT in IDS, BLOCK in IPS)
- **Payload**: `' OR '1'='1`
- **Risk Score**: 40

#### 4. XSS Pattern
- **Purpose**: Test XSS detection
- **Expected**: DETECTED (ALERT in IDS, BLOCK in IPS)
- **Payload**: `<script>alert(1)</script>`
- **Risk Score**: 35

#### 5. Path Traversal Pattern
- **Purpose**: Test path traversal detection
- **Expected**: DETECTED (ALERT in IDS, BLOCK in IPS)
- **Payload**: `../../../etc/passwd`
- **Risk Score**: 30

#### 6. Invalid Authentication
- **Purpose**: Test auth failure detection
- **Expected**: DETECTED (ALERT)
- **Method**: POST /api/auth/login with invalid credentials
- **Risk Score**: 10

#### 7. Repeated Login Failure
- **Purpose**: Test login abuse detection
- **Expected**: DETECTED (ALERT)
- **Method**: 6 failed login attempts
- **Risk Score**: 10

#### 8. Request Rate Abuse
- **Purpose**: Test rate abuse detection
- **Expected**: DETECTED (ALERT)
- **Method**: 51 rapid requests
- **Risk Score**: 20

#### 9. Suspicious User-Agent
- **Purpose**: Test suspicious UA detection
- **Expected**: DETECTED (ALERT)
- **Method**: Request with empty user-agent
- **Risk Score**: 10

#### 10. Controlled Oversized Payload
- **Purpose**: Test payload size detection
- **Expected**: DETECTED (ALERT)
- **Method**: POST with 2MB payload
- **Risk Score**: 15

### Running Test Lab

1. Navigate to **Test Lab** in admin dashboard
2. View available tests with expected classifications
3. Click **Run All Tests** to execute full suite
4. View security report with metrics

### Test Report

After running tests, the report shows:

**Summary**:
- Total Tests
- Passed
- Failed
- Overall Status

**Confusion Matrix**:
- True Positive (TP): Attack correctly detected
- True Negative (TN): Normal correctly allowed
- False Positive (FP): Normal incorrectly flagged
- False Negative (FN): Attack incorrectly allowed

**Metrics**:
- **Accuracy**: (TP + TN) / (TP + TN + FP + FN)
- **Precision**: TP / (TP + FP)
- **Recall**: TP / (TP + FN)
- **F1 Score**: 2 * (Precision * Recall) / (Precision + Recall)

**Individual Results**:
- Test name
- Expected vs actual classification
- Expected vs actual action
- Risk score
- Pass/Fail status

## IDS vs IPS Demonstration

### Step-by-Step Demonstration

1. **Start in IDS Mode**:
   - Go to Settings
   - Select "IDS Mode"
   - Click Apply

2. **Run SQL Injection Test**:
   - Go to Test Lab
   - Run "SQL Injection Pattern" test
   - Observe: DETECTED, LOGGED, ALERTED
   - Request is NOT blocked

3. **Switch to IPS Mode**:
   - Go to Settings
   - Select "IPS Mode"
   - Click Apply

4. **Run Same Test**:
   - Run "SQL Injection Pattern" test again
   - Observe: DETECTED, LOGGED, ALERTED, BLOCKED
   - Request IS blocked

5. **Compare Results**:
   - IDS: Detection without prevention
   - IPS: Detection with prevention

## Manual Testing Checklist

### One-Computer Demo

- [ ] Server starts successfully
- [ ] Database connection established
- [ ] Admin login works
- [ ] Demo user login works
- [ ] Normal request allowed
- [ ] SQL injection detected
- [ ] XSS detected
- [ ] Path traversal detected
- [ ] Login abuse detected
- [ ] Rate abuse detected
- [ ] Risk scores calculated correctly
- [ ] Socket.IO connected
- [ ] Live traffic updates work
- [ ] Test Lab runs successfully
- [ ] Metrics calculated correctly

### Two-Computer Demo

- [ ] Computer 1: Server running on 0.0.0.0
- [ ] Computer 1: Admin dashboard accessible
- [ ] Computer 2: Can access server via LAN IP
- [ ] Computer 2: Demo login works
- [ ] Computer 2: Traffic appears in live feed
- [ ] Computer 2: Source IP correctly identified
- [ ] Computer 1: Sees Computer 2's traffic
- [ ] Socket.IO updates work across computers

### Three-Computer Demo

- [ ] Computer 1: Server + Admin dashboard
- [ ] Computer 2: Normal user (demo app)
- [ ] Computer 3: Security test client (Test Lab)
- [ ] Computer 2 generates normal traffic
- [ ] Computer 3 runs security tests
- [ ] Computer 1 sees all traffic
- [ ] Source IPs correctly distinguished
- [ ] Device labels work correctly
- [ ] Test Lab shows Computer 3's source IP

## Test Safety Guidelines

### Important Rules

1. **Target Only Local Server**
   - All tests must target http://localhost:PORT or http://LAN_IP:PORT
   - Never test against public websites
   - Never test against third-party systems

2. **Use Harmless Payloads**
   - SQL injection: Pattern strings only, no actual injection
   - XSS: Pattern strings only, no script execution
   - Path traversal: Pattern strings only, no file access

3. **Private Network Only**
   - Use only trusted private LAN
   - Do not expose to public internet
   - Use firewall to restrict access

4. **Educational Purpose**
   - This is for learning only
   - Not for production security
   - Not for malicious purposes

## Troubleshooting Tests

### Test Failures

**False Positives**:
- Normal traffic flagged as attack
- Check detector thresholds
- Verify pattern matching rules
- Review detection logic

**False Negatives**:
- Attack not detected
- Verify detector is enabled
- Check pattern definitions
- Review risk scoring

**Metrics Issues**:
- Division by zero errors
- Check total test count
- Verify TP/TN/FP/FN calculation
- Review metrics formulas

### Test Lab Issues

**Tests Not Running**:
- Check server is running
- Verify API endpoints accessible
- Check Socket.IO connection
- Review browser console for errors

**Incorrect Results**:
- Verify IDPS mode setting
- Check detector states
- Review prevention layer
- Check database for events

**Metrics Calculation**:
- Verify test execution completed
- Check database for test run
- Review calculation logic
- Ensure all tests completed

## Continuous Improvement

### Adding New Tests

1. Define test case in `server/src/controllers/testLab.js`
2. Add expected classification and action
3. Implement test execution logic
4. Update Test Lab UI
5. Verify metrics calculation

### Improving Detection

1. Add new detector or improve existing
2. Update pattern definitions
3. Adjust risk scores
4. Test with new cases
5. Update documentation

### Enhancing Metrics

1. Add new metric calculations
2. Improve existing formulas
3. Add visualization
4. Update Test Lab UI
5. Document new metrics

## Test Data Management

### Database Cleanup

```bash
# Reset database (deletes all data)
npm run db:reset

# Reseed database (restores default data)
npm run db:seed
```

### Test Run History

- Test runs stored in database
- Individual results preserved
- Historical metrics available
- Can be viewed in Test Lab

### Manual Data Entry

For testing specific scenarios:
1. Use Test Lab for controlled tests
2. Use demo application for normal traffic
3. Use admin dashboard for manual actions
4. Review events in Threat Events page
