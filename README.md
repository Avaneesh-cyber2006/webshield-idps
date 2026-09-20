# WebShield IDPS - Real-Time Web Intrusion Detection and Prevention System

A college demonstration project showcasing Intrusion Detection System (IDS) and Intrusion Prevention System (IPS) capabilities using a three-computer LAN setup.

## What is WebShield IDPS?

WebShield IDPS is a web application that monitors HTTP requests in real-time, detects potential attacks, and can either:
- **IDS Mode**: Log and alert on detected attacks without blocking requests
- **IPS Mode**: Automatically block malicious requests based on configurable risk thresholds

### Key Features
- Real-time traffic monitoring and analysis
- Signature-based attack detection (SQL injection, XSS, path traversal, etc.)
- Configurable risk scoring and prevention policies
- Live dashboard with attack logs and blocked source management
- Support for multiple detection modes (Monitor, IDS, IPS)

## Architecture for Three-Computer Demonstration

```
Computer 1 (Host + Admin Dashboard)
    ↓ LAN (Wi-Fi/Hotspot)
    ├─ Computer 2 (Attacker A)
    └─ Computer 3 (Attacker B)
```

- **Computer 1**: Runs the WebShield server, hosts the admin dashboard, and receives all traffic
- **Computer 2 & 3**: Attacker computers that send test traffic to Computer 1

## Technologies Used

- **Backend**: Node.js, Express, Prisma ORM, SQLite
- **Frontend**: React, Vite, Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing

## Demonstration Scenarios

### IDS Mode Demo
1. Administrator selects IDS mode
2. Computer 2 sends SQL injection request → Request succeeds (HTTP 200)
3. Security event created: attack detected and logged
4. Dashboard shows: source IP, attack type, timestamp, request ID, action (ALERT or LOG)
5. Computer 3 sends XSS request → Same behavior

### IPS Mode Demo
1. Administrator switches to IPS mode
2. Computer 2 sends SQL injection request → Request blocked (HTTP 403)
3. Security event created: attack detected and prevented
4. Dashboard shows: blocked source IP, prevention action (BLOCK or TEMP_BLOCK)
5. Computer 3 remains operational
6. Administrator unblocks Computer 2 → Normal access restored
7. Computer 3 XSS request → Blocked as configured

**Important:** In production mode, the application runs on a single port (3000 by default) that serves both the React frontend and the backend API. This simplifies the setup and avoids CORS issues.

---

## Prerequisites

### Host Computer (Computer 1)
- Windows operating system
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Git](https://git-scm.com/)
- WebShield repository (cloned from GitHub)
- PowerShell (installed by default on Windows)

### Attacker Computers (Computer 2 & 3)
- Windows operating system
- Modern web browser (Chrome, Firefox, or Edge)
- PowerShell (installed by default on Windows)
- Access to the same LAN/Wi-Fi network as Computer 1

---

## Host Computer Setup

### Step 1: Clone the Repository

Open PowerShell and run:

```powershell
cd C:\Users\YourUsername\Desktop
git clone <repository-url>
cd IDPS
```

Replace `<repository-url>` with the actual GitHub repository URL.

### Step 2: Install Dependencies

#### Backend Dependencies

```powershell
cd server
npm install
```

#### Frontend Dependencies

```powershell
cd ..\client
npm install
```

### Step 3: Configure Environment Variables

```powershell
cd ..\server
```

Create a `.env` file by copying the example:

```powershell
copy .env.example .env
```

Edit `.env` with your preferred values (default values work for demonstration):

```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
JWT_SECRET=webshield-demo-secret-key-2026-lab-only
COOKIE_SECURE=false
ADMIN_EMAIL=admin@webshield.local
ADMIN_PASSWORD=admin123
USER_EMAIL=user@webshield.local
USER_PASSWORD=user123
DATABASE_URL="file:./dev.db"
TEST_DATABASE_URL="file:./test.db"
TRUSTED_PROXY=false
```

**Important Notes:**
- `HOST=0.0.0.0` allows the server to accept connections from other computers on the LAN
- Keep `JWT_SECRET` secure in production
- Default credentials: admin@webshield.local / admin123

### Step 4: Generate Prisma Client

```powershell
npx prisma generate
```

### Step 5: Initialize Database

```powershell
npx prisma migrate deploy
node prisma/seed.js
```

This creates the SQLite database and seeds it with:
- Administrator account (admin@webshield.local / admin123)
- Demo user account (user@webshield.local / user123)
- Default security rules and system settings

### Step 6: Build Frontend

```powershell
cd ..\client
npm run build
```

### Step 7: Start the Application

```powershell
cd ..\server
npm start
```

The application will start on:
- **Development mode**: Backend on port 5000, Frontend on port 3000 (via Vite dev server)
- **Production mode**: Single port (3000 by default) serving both backend and frontend

You should see:
```
✓ Server running on http://0.0.0.0:3000
✓ Database connected
✓ Socket.IO server initialized
```

### Step 8: Open Administrator Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

In production mode, the same URL serves both the frontend and backend API.

### Step 9: Log In as Administrator

- Email: `admin@webshield.local`
- Password: `admin123`

### Step 10: Stop the Server

When finished, press `Ctrl+C` in the PowerShell window.

---

## Configure LAN Connectivity

### Step 1: Connect All Computers to the Same Network

**Option A: Wi-Fi Network**
- Connect all three computers to the same Wi-Fi network
- Ensure they can communicate (test with `ping`)

**Option B: Mobile Hotspot**
- Enable mobile hotspot on Computer 1
- Connect Computer 2 and Computer 3 to the hotspot
- This creates a private LAN for the demonstration

### Step 2: Find Computer 1's LAN IP Address

On Computer 1, open PowerShell and run:

```powershell
ipconfig
```

Look for the IPv4 Address under your network adapter (Wi-Fi or Ethernet):
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

Record this IP address (e.g., `192.168.1.100`).

### Step 3: Verify WebShield Configuration

The `.env` file should have:
```env
HOST=0.0.0.0
PORT=5000
```

This configuration allows connections from any computer on the LAN.

### Step 4: Allow Port Through Windows Firewall

On Computer 1:

1. Open Windows Defender Firewall with Advanced Security
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. Select "TCP" → Specify local ports: `3000` → Next
5. Select "Allow the connection" → Next
6. Select all profiles (Domain, Private, Public) → Next
7. Name the rule: `WebShield Server` → Finish

### Step 5: Test Connectivity from Attacker Computers

On Computer 2, open PowerShell and test:

```powershell
ping 192.168.1.100
```

Replace `192.168.1.100` with Computer 1's actual IP.

Test TCP connectivity:
```powershell
Test-NetConnection -ComputerName 192.168.1.100 -Port 3000
```

If both tests pass, the computers can communicate.

### Step 6: Access WebShield from Attacker Computers

On Computer 2, open a browser and navigate to:
```
http://192.168.1.100:3000
```

Replace `192.168.1.100` with Computer 1's actual IP.

You should see the WebShield login page.

**Note:** In production mode, the same port (3000) serves both the frontend React application and the backend API. All requests (both frontend pages and API calls) go through this single port.

---

## Attacker Computer Setup

### Computer 2 (Attacker A) Setup

#### Step 1: Verify Network Connection

```powershell
ping 192.168.1.100
```

#### Step 2: Find Your IP Address

```powershell
ipconfig
```

Record your IPv4 address (e.g., `192.168.1.101`).

#### Step 3: Open WebShield

Open browser and navigate to:
```
http://192.168.1.100:3000
```

#### Step 4: Send Normal Request

```powershell
curl.exe http://192.168.1.100:3000/api/demo/public
```

Expected: HTTP 200 with successful response.

#### Step 5: Send SQL Injection Test Request

```powershell
curl.exe "http://192.168.1.100:3000/api/demo/search?q=%27%20OR%20%271%27%3D%271"
```

This is URL-encoded for `' OR '1'='1`

Expected behavior:
- **IDS Mode**: HTTP 200 (request succeeds, attack logged)
- **IPS Mode**: HTTP 403 (request blocked with message: "Request blocked by WebShield IDPS")

#### Step 6: Send XSS Test Request

```powershell
curl.exe "http://192.168.1.100:3000/api/demo/search?q=%3Cscript%3Ealert('xss')%3C/script%3E"
```

This is URL-encoded for `<script>alert('xss')</script>`

Expected behavior:
- **IDS Mode**: HTTP 200 (request succeeds, attack logged)
- **IPS Mode**: HTTP 403 (request blocked with message: "Request blocked by WebShield IDPS")

**Note:** All API requests use the same port (3000) as the frontend in production mode.

### Computer 3 (Attacker B) Setup

Follow the same steps as Computer 2, using your own IP address.

---

## Complete Presentation Walkthrough

### IDS Mode Demonstration

**On Computer 1 (Host):**

1. Log in as administrator (admin@webshield.local / admin123)
2. Navigate to Admin Dashboard
3. Click "Settings" or navigate to the mode selector
4. Select "IDS" mode
5. Confirm mode shows "IDS" in the dashboard

**On Computer 2 (Attacker A):**

5. Send SQL injection:
   ```powershell
   curl.exe "http://192.168.1.100:3000/api/demo/search?q=%27%20OR%20%271%27%3D%271"
   ```

**On Computer 1 (Host):**

6. Verify on dashboard:
   - Request appears in live traffic log
   - Source IP: Computer 2's IP
   - Attack type: SQL_INJECTION
   - Action: ALERT (or LOG)
   - Request was not blocked (HTTP 200 shown in logs)

**On Computer 3 (Attacker B):**

7. Send XSS attack:
   ```powershell
   curl.exe "http://192.168.1.100:3000/api/demo/search?q=%3Cscript%3Ealert('xss')%3C/script%3E"
   ```

**On Computer 1 (Host):**

8. Verify on dashboard:
   - Second attack appears in logs
   - Source IP: Computer 3's IP
   - Attack type: XSS
   - Action: ALERT (or LOG)
   - Request was not blocked

**Expected IDS Mode Result:**
- Both requests succeed (HTTP 200)
- Both attacks are detected and logged
- Dashboard shows genuine security events with correct IPs and timestamps
- No requests are blocked at the IDPS layer

### IPS Mode Demonstration

**On Computer 1 (Host):**

1. Click "Settings" or navigate to the mode selector
2. Select "IPS" mode
3. Confirm mode shows "IPS" in the dashboard

**On Computer 2 (Attacker A):**

3. Send SQL injection:
   ```powershell
   curl.exe "http://192.168.1.100:3000/api/demo/search?q=%27%20OR%20%271%27%3D%271"
   ```

**On Computer 2 (Attacker A):**

4. Verify response:
   - HTTP 403 Forbidden
   - Response body: "Request blocked by WebShield IDPS"

**On Computer 1 (Host):**

5. Verify on dashboard:
   - Attack appears in blocked sources
   - Source IP: Computer 2's IP
   - Attack type: SQL_INJECTION
   - Action: BLOCK or TEMP_BLOCK
   - Request was successfully prevented

**On Computer 3 (Attacker B):**

6. Send normal request:
   ```powershell
   curl.exe http://192.168.1.100:3000/api/demo/public
   ```

7. Verify response: HTTP 200 (Computer 3 remains operational)

8. Send XSS attack:
   ```powershell
   curl.exe "http://192.168.1.100:3000/api/demo/search?q=%3Cscript%3Ealert('xss')%3C/script%3E"
   ```

9. Verify response: HTTP 403 (XSS blocked)

**On Computer 1 (Host):**

10. Verify dashboard shows Computer 3's blocked IP

**On Computer 1 (Host):**

11. Navigate to "Blocked Sources" in admin dashboard
12. Find Computer 2's IP
13. Click "Unblock"

**On Computer 2 (Attacker A):**

14. Send normal request:
    ```powershell
    curl.exe http://192.168.1.100:3000/api/demo/public
    ```

15. Verify response: HTTP 200 (access restored)

**Expected IPS Mode Result:**
- Attack requests are blocked (HTTP 403)
- Legitimate requests from unblocked computers succeed (HTTP 200)
- Dashboard shows blocked sources with unblock controls
- Administrator can unblock IPs to restore access
- System remains operational for all non-blocked computers

---

## Troubleshooting

### Server Not Starting

**Problem:** `npm start` fails with errors

**Solutions:**
- Ensure you're in the `server` directory
- Check that dependencies are installed: `npm install`
- Verify `.env` file exists and is correctly formatted
- Check that port 5000 is not in use: `netstat -ano | findstr :5000`
- Kill any process using port 5000: `taskkill /PID <pid> /F`

### Database Connection Failure

**Problem:** Application fails to connect to database

**Solutions:**
- Ensure database migrations ran: `npx prisma migrate deploy`
- Verify `prisma/dev.db` exists in the `server/prisma` directory
- Check `DATABASE_URL` in `.env` file
- Delete and recreate database: `del prisma\dev.db` then run migrations and seed again

### Missing Dependencies

**Problem:** `npm install` fails or module not found errors

**Solutions:**
- Ensure Node.js is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check internet connection

### Administrator Login Failure

**Problem:** Cannot log in with admin credentials

**Solutions:**
- Verify credentials in `.env` file match what you're entering
- Ensure database was seeded: `node prisma/seed.js`
- Check that password hashing is working correctly
- Reset admin password by deleting database and re-seeding

### Attacker Laptop Cannot Access Host

**Problem:** Curl commands from Computer 2/3 fail

**Solutions:**
- Verify all computers are on the same network
- Check Computer 1's IP address: `ipconfig`
- Test connectivity: `ping <host-ip>` and `Test-NetConnection -ComputerName <host-ip> -Port 5000`
- Ensure Windows Firewall allows port 5000 on Computer 1
- Check that server is running with `HOST=0.0.0.0` in `.env`
- Verify frontend is accessible: open `http://<host-ip>:3000` in browser

### Incorrect IP Address in Logs

**Problem:** Dashboard shows `::ffff:127.0.0.1` instead of LAN IP

**Solutions:**
- This is IPv6 loopback mapping and is normal for localhost testing
- For LAN access, ensure requests come from actual LAN IP (not localhost)
- Check that curl commands use Computer 1's LAN IP, not `localhost`

### Windows Firewall Blocking Connection

**Problem:** Connection refused or timeout

**Solutions:**
- Add inbound rule for port 5000 in Windows Firewall
- Ensure rule allows Private network profile
- Temporarily disable firewall for testing (not recommended for production)
- Check if antivirus software is blocking the connection

### Attacks Not Generating Alerts

**Problem:** Requests succeed but no security events appear

**Solutions:**
- Verify IDPS mode is enabled (not Monitor mode)
- Check that detectors are active in `server/src/idps/detectors/`
- Increase risk scores in `server/src/config/idps.js` if attacks are too subtle
- Ensure request patterns match detector regex patterns
- Check browser console and server logs for errors

### IDS Unexpectedly Blocking Requests

**Problem:** Requests blocked in IDS mode

**Solutions:**
- Check for old block records in `BlockedSource` table
- Manually unblock IPs from admin dashboard
- Verify mode is actually IDS (not IPS)
- Clear all blocks: `DELETE FROM BlockedSource` (use with caution)
- Restart the server after clearing blocks

### IPS Detecting But Not Blocking

**Problem:** Attacks detected but not prevented (HTTP 200 instead of 403)

**Solutions:**
- Verify mode is actually IPS (not IDS)
- Check risk score thresholds in `server/src/config/idps.js`
- Ensure prevention layer is working in `server/src/idps/prevention/`
- Check that `riskScore` is high enough to trigger blocking
- Verify block creation logic in `server/src/idps/prevention/blocker.js`

### Dashboard Not Showing Real-Time Updates

**Problem:** New attacks don't appear immediately

**Solutions:**
- Refresh the page to load new data
- Check browser console for Socket.IO connection errors
- Verify Socket.IO server is running
- Check that admin has joined the admin room
- Restart the server if Socket.IO connection fails

---

## Resetting Between Demonstrations

### Unblock Attacker IP Addresses

1. Navigate to "Blocked Sources" in admin dashboard
2. Find the IP address to unblock
3. Click "Unblock" button
4. Verify IP is removed from blocked list

### Switch Back to IDS Mode

1. Navigate to "Settings" or "Mode" in admin dashboard
2. Select "IDS" mode
3. Confirm mode change in dashboard

### Clear Temporary Demo State

If the demonstration needs a clean slate:

1. **Option A: Clear Blocks Only**
   - Navigate to "Blocked Sources"
   - Click "Clear All Blocks" (if available)
   - Or manually unblock each IP

2. **Option B: Clear Security Events**
   - Security events remain in database for audit trail
   - You can view them in "Live Traffic" dashboard
   - To clear old events for cleaner demo, delete from `SecurityEvent` table

3. **Option C: Restart Application**
   - Stop server with `Ctrl+C`
   - Restart with `npm start`
   - This clears in-memory state but preserves database

**Do not:**
- Delete the database file (this removes all data)
- Manually modify database records unless necessary
- Change source code during demonstration

### Restarting After Changes

If you modified configuration:

1. Stop the server: `Ctrl+C`
2. Restart: `npm start`
3. Refresh browser to reconnect

---

## GitHub Repository Hygiene

### .gitignore Configuration

The repository includes a `.gitignore` file to prevent uploading sensitive files:

```
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local

# Database files
*.db
*.db-shm
*.db-wal
prisma/*.db
prisma/*.db-journal

# Database backups
*.backup

# Build outputs
dist/
build/
.next/
out/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary files
*.tmp
.cache/
```

### Environment Variables Template

The `.env.example` file contains variable names and placeholder values:
- Copy this file to `.env` and fill in actual values
- Never commit `.env` to the repository
- `.env.example` is safe to commit

### Fresh Installation Instructions

For a fresh clone of the repository:

1. Clone repository
2. Install dependencies (`npm install` in both `server` and `client`)
3. Copy `.env.example` to `.env` and configure
4. Generate Prisma client: `npx prisma generate`
5. Run migrations: `npx prisma migrate deploy`
6. Seed database: `node prisma/seed.js`
7. Build frontend: `cd client && npm run build`
8. Start server: `cd server && npm start`

The seed script creates:
- Administrator account (admin@webshield.local / admin123)
- Demo user account (user@webshield.local / user123)
- Default security rules and system settings

---

## README Verification

Before completing this task, verify:

- [ ] Every command in README.md works with the final repository
- [ ] Documented ports (5000 for backend, 3000 for frontend) match the application
- [ ] Documented routes match the actual API endpoints
- `   [ ] GitHub clone setup works from a fresh directory
- [ ] README contains complete instructions for both host and attacker computers
- [ ] Physical LAN steps are clearly marked for user verification

---

## Completion Criteria

The presentation version is complete when:

- **IDS Mode**: Computer 2 or 3 attacks → request not blocked (HTTP 200) → genuine alert appears on admin dashboard with correct IP, attack type, timestamp, request ID, and action
- **IPS Mode**: Computer 2 or 3 attacks → request blocked (HTTP 403) → genuine prevention log appears on admin dashboard with blocked source IP
- **Unblock**: A blocked client can be unblocked by the administrator through the dashboard
- **Isolation**: The other client remains operational when one is blocked
- **Repeatability**: The entire demonstration can be repeated without manually modifying database records or changing application source code

---

## License

This project is for educational demonstration purposes only.
