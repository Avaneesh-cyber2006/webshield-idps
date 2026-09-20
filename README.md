# WebShield IDPS - Real-Time Web Intrusion Detection and Prevention System

A college demonstration project showcasing Intrusion Detection System (IDS) and Intrusion Prevention System (IPS) capabilities using a three-computer LAN setup.

## Table of Contents

- [What is WebShield IDPS?](#what-is-webshield-idps)
- [Three-Computer Architecture](#three-computer-architecture)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Clone the Project from GitHub](#clone-the-project-from-github)
- [Host Computer Installation](#host-computer-installation)
- [Environment Configuration](#environment-configuration)
- [LAN Network Configuration](#lan-network-configuration)
- [Start WebShield on the Host](#start-webshield-on-the-host)
- [Attacker Laptop A Setup](#attacker-laptop-a-setup)
- [Attacker Laptop B Setup](#attacker-laptop-b-setup)
- [Complete IDS Demonstration](#complete-ids-demonstration)
- [Complete IPS Demonstration](#complete-ips-demonstration)
- [Automatic Dashboard Updates](#automatic-dashboard-updates)
- [Troubleshooting](#troubleshooting)
- [Resetting Between Demonstrations](#resetting-between-demonstrations)
- [Presentation Checklist](#presentation-checklist)

## What is WebShield IDPS?

WebShield IDPS is a web application that monitors HTTP requests in real-time, detects potential attacks, and can either:
- **IDS Mode**: Log and alert on detected attacks without blocking requests
- **IPS Mode**: Automatically block malicious requests based on configurable risk thresholds

### How It Works

1. **Attack Detection**: HTTP requests are analyzed for attack patterns (SQL injection, XSS, path traversal, etc.)
2. **Risk Scoring**: Each detected pattern contributes to a cumulative risk score
3. **Decision Engine**: Based on the risk score and current mode (IDS/IPS), the system decides how to respond
4. **Prevention Layer**: In IPS mode, high-risk requests are blocked before reaching the application
5. **Event Logging**: All security events are logged with source IP, timestamp, detector category, and action taken
6. **Administrator Dashboard**: Real-time view of security events, blocked sources, and system metrics

### Key Features
- Real-time traffic monitoring and analysis
- Signature-based attack detection (SQL injection, XSS, path traversal, etc.)
- Configurable risk scoring and prevention policies
- Live dashboard with attack logs and blocked source management
- Support for multiple detection modes (Monitor, IDS, IPS)
- Automatic dashboard updates via Socket.IO
- Manual IP blocking and unblocking

## Three-Computer Architecture

```
Computer 1 (Host + Admin Dashboard)
    ↓ LAN (Wi-Fi/Hotspot)
    ├─ Computer 2 (Attacker A - SQL Injection Testing)
    └─ Computer 3 (Attacker B - XSS Testing)
```

- **Computer 1 (Host)**: Runs the WebShield server, SQLite database, React frontend, and administrator dashboard
- **Computer 2 (Attacker A)**: Sends SQL injection test requests to Computer 1
- **Computer 3 (Attacker B)**: Sends XSS test requests to Computer 1

**Important**: Attacker computers must access WebShield using the host computer's LAN IP address (e.g., `http://192.168.1.100:3000`), not `localhost`.

## Technologies Used

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Socket.IO**: Real-time event-based communication
- **Prisma ORM**: Type-safe database ORM
- **SQLite**: File-based SQL database
- **bcrypt**: Password hashing library
- **JWT (jsonwebtoken)**: Token-based authentication
- **Helmet**: Security HTTP headers
- **CORS**: Cross-origin resource sharing

### Frontend
- **React 18**: Component-based UI framework
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: Promise-based HTTP client
- **Lucide React**: Icon library
- **Socket.IO Client**: Real-time bidirectional communication

## Prerequisites

### Host Computer (Computer 1)
- Windows 10 or Windows 11
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Git](https://git-scm.com/)
- WebShield repository
- PowerShell (installed by default on Windows)

### Attacker Computers (Computer 2 & 3)
- Windows operating system
- Modern web browser (Chrome, Firefox, or Edge)
- PowerShell (installed by default on Windows)
- Access to the same LAN/Wi-Fi network as Computer 1

**No additional software installation required on attacker computers.**

## Clone the Project from GitHub

Open PowerShell and run:

```powershell
cd C:\Users\YourUsername\Desktop
git clone https://github.com/Avaneesh-cyber2006/webshield-idps
cd webshield-idps
```

## Host Computer Installation

### Step 1: Install Backend Dependencies

```powershell
cd server
npm install
```

### Step 2: Install Frontend Dependencies

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
PORT=3000
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

### Step 7: Start WebShield

```powershell
cd ..\server
npm start
```

The application will start on port 3000:

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

### Step 9: Log In as Administrator

- Email: `admin@webshield.local`
- Password: `admin123`

### Step 10: Stop the Server

When finished, press `Ctrl+C` in the PowerShell window.

## Environment Configuration

| Variable | Purpose | Default Value |
|-----------|---------|---------------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `HOST` | Network binding | `0.0.0.0` (all interfaces) |
| `JWT_SECRET` | JWT signing secret | `webshield-demo-secret-key-2026-lab-only` |
| `COOKIE_SECURE` | HTTPS-only cookies | `false` |
| `ADMIN_EMAIL` | Administrator email | `admin@webshield.local` |
| `ADMIN_PASSWORD` | Administrator password | `admin123` |
| `USER_EMAIL` | Demo user email | `user@webshield.local` |
| `USER_PASSWORD` | Demo user password | `user123` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `TEST_DATABASE_URL` | Test database path | `file:./test.db` |
| `TRUSTED_PROXY` | Proxy trust setting | `false` |

**Important:**
- `HOST=0.0.0.0` is required for LAN access from other computers
- `PORT=3000` is the presentation port
- `.env` must remain private and never be committed to Git
- Use `.env.example` as a template for fresh installations

## LAN Network Configuration

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

### Step 3: Find Attacker Computers' IP Addresses

On Computer 2 and Computer 3, run:

```powershell
ipconfig
```

Record their IPv4 addresses (e.g., `192.168.1.101` and `192.168.1.102`).

### Step 4: Confirm Same Network

Verify all computers are on the same subnet (same first three octets, e.g., `192.168.1.x`).

### Step 5: Configure Windows Firewall

On Computer 1:

1. Open Windows Defender Firewall with Advanced Security
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. Select "TCP" → Specify local ports: `3000` → Next
5. Select "Allow the connection" → Next
6. Select "Private" only (uncheck Domain and Public) → Next
7. Name the rule: `WebShield Server` → Finish

**Important**: Restrict the firewall rule to the Private network profile only. Do not disable Windows Firewall.

### Step 6: Verify Connectivity

From Computer 2, test connectivity to Computer 1:

```powershell
ping 192.168.1.100
```

Replace `192.168.1.100` with Computer 1's actual IP.

Test TCP connectivity:

```powershell
Test-NetConnection -ComputerName 192.168.1.100 -Port 3000
```

Both tests should pass. Repeat from Computer 3.

**Example IP Addresses:**
- Host: 192.168.1.100
- Attacker A: 192.168.1.101
- Attacker B: 192.168.1.102

Replace these with your actual LAN IP addresses.

## Start WebShield on the Host

On Computer 1, open PowerShell in the server directory:

```powershell
cd C:\Users\YourUsername\Desktop\webshield-idps\server
npm start
```

You should see:

```
Database connected successfully
WebShield server running on http://0.0.0.0:3000
Admin dashboard: http://localhost:3000
For LAN access: http://<YOUR_LAN_IP>:3000
To find your LAN IP, run: ipconfig (Windows) or ifconfig (Linux/Mac)
IDPS mode loaded: IPS
```

### Verify Application is Running

Test the health endpoint:

```powershell
curl.exe http://localhost:3000/health
```

Expected response:
```json
{"success":true,"status":"healthy","timestamp":"..."}
```

### Access from Attacker Computers

On Computer 2 and Computer 3, open a browser and navigate to:
```
http://192.168.1.100:3000
```

Replace `192.168.1.100` with Computer 1's actual LAN IP.

## Attacker Laptop A Setup (Computer 2)

### Step 1: Verify Network Connection

```powershell
ping 192.168.1.100
```

### Step 2: Find Your IP Address

```powershell
ipconfig
```

Record your IPv4 address (e.g., `192.168.1.101`).

### Step 3: Verify Host Connectivity

```powershell
Test-NetConnection -ComputerName 192.168.1.100 -Port 3000
```

### Step 4: Open WebShield

Open browser and navigate to:
```
http://192.168.1.100:3000
```

### Step 5: Send Normal Request

```powershell
curl.exe http://192.168.1.100:3000/api/demo/public
```

Expected: HTTP 200 with successful response.

### Step 6: Send SQL Injection Test Request

```powershell
curl.exe -G http://192.168.1.100:3000/api/demo/search --data-urlencode "query=' OR '1'='1" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -i
```

The `-i` flag displays HTTP response headers and status.

Expected behavior:
- **IDS Mode**: HTTP 200 (request succeeds, attack logged)
- **IPS Mode**: HTTP 403 (request blocked with message: "Request blocked by WebShield IDPS")

**Note:** The `-A` flag sets a normal User-Agent to avoid additional suspicious user agent detection.

## Attacker Laptop B Setup (Computer 3)

### Step 1: Verify Network Connection

```powershell
ping 192.168.1.100
```

### Step 2: Find Your IP Address

```powershell
ipconfig
```

Record your IPv4 address (e.g., `192.168.1.102`).

### Step 3: Verify Host Connectivity

```powershell
Test-NetConnection -ComputerName 192.168.1.100 -Port 3000
```

### Step 4: Open WebShield

Open browser and navigate to:
```
http://192.168.1.100:3000
```

### Step 5: Send Normal Request

```powershell
curl.exe http://192.168.1.100:3000/api/demo/public
```

Expected: HTTP 200 with successful response.

### Step 6: Send XSS Test Request

```powershell
curl.exe -G http://192.168.1.100:3000/api/demo/search --data-urlencode "query=<script>alert('xss')</script>" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -i
```

Expected behavior:
- **IDS Mode**: HTTP 200 (request succeeds, attack logged)
- **IPS Mode**: HTTP 403 (request blocked with message: "Request blocked by WebShield IDPS")

## Complete IDS Demonstration

### Step 1: Administrator Logs Into WebShield

On Computer 1:
- Open browser to `http://localhost:3000`
- Enter email: `admin@webshield.local`
- Enter password: `admin123`
- Click Login

### Step 2: Administrator Switches to IDS Mode

- Navigate to Admin Dashboard
- Click "Settings" or navigate to the mode selector
- Select "IDS" mode
- Confirm mode shows "IDS" in the dashboard

### Step 3: Verify No Existing IP Blocks

- Navigate to "Blocked Sources" in admin dashboard
- Ensure Computer 2 and Computer 3 IPs are not blocked
- If blocked, click "Unblock" for each

### Step 4: Computer 2 Sends SQL Injection Request

On Computer 2:
```powershell
curl.exe -G http://192.168.1.100:3000/api/demo/search --data-urlencode "query=' OR '1'='1" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -i
```

### Step 5: Verify HTTP 200

Expected response status: `HTTP/1.1 200 OK`

### Step 6: Verify SQL_INJECTION Security Event

On Computer 1:
- Navigate to "Threat Events" in admin dashboard
- Verify a new security event appears with:
  - Source IP: Computer 2's LAN IP (e.g., 192.168.1.101)
  - Attack type: SQL_INJECTION
  - Timestamp: Current time
  - Request ID: Format `REQ-<timestamp>-<random>`
  - Action: ALERT or LOG
  - Risk score: 40

### Step 7: Computer 3 Sends XSS Request

On Computer 3:
```powershell
curl.exe -G http://192.168.1.100:3000/api/demo/search --data-urlencode "query=<script>alert('xss')</script>" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -i
```

### Step 8: Verify HTTP 200

Expected response status: `HTTP/1.1 200 OK`

### Step 9: Verify XSS Security Event

On Computer 1:
- Navigate to "Threat Events" in admin dashboard
- Verify a new security event appears with:
  - Source IP: Computer 3's LAN IP (e.g., 192.168.1.102)
  - Attack type: XSS
  - Timestamp: Current time
  - Request ID: Format `REQ-<timestamp>-<random>`
  - Action: ALERT or LOG
  - Risk score: 45

### Step 10: Show Attack Details

On Computer 1:
- Click on each security event to view details
- Show the actual LAN IP addresses, attack types, timestamps, request IDs, and actions
- Explain that IDS detects and logs suspicious activity without blocking the request at the IDPS layer

## Complete IPS Demonstration

### Step 1: Administrator Switches to IPS Mode

On Computer 1:
- Navigate to "Settings" or mode selector
- Select "IPS" mode
- Confirm mode shows "IPS" in the dashboard

### Step 2: Computer 2 Sends SQL Injection

On Computer 2:
```powershell
curl.exe -G http://192.168.1.100:3000/api/demo/search --data-urlencode "query=' OR '1'='1" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -i
```

### Step 3: Verify HTTP 403 and SQL_INJECTION Detection

Expected response status: `HTTP/1.1 403 Forbidden`

On Computer 1:
- Navigate to "Threat Events"
- Verify security event shows:
  - Attack type: SQL_INJECTION
  - Action: TEMP_BLOCK
  - Source IP: Computer 2's LAN IP
  - Risk score: 40

### Step 4: Show Blocked IP on Dashboard

On Computer 1:
- Navigate to "Blocked Sources"
- Verify Computer 2's IP appears in the blocked list
- Show the block action and timestamp

### Step 5: Computer 2 Attempts Normal Request

On Computer 2:
```powershell
curl.exe http://192.168.1.100:3000/api/demo/public -i
```

Expected: HTTP 403 (still blocked)

### Step 6: Computer 3 Sends Normal Request

On Computer 3:
```powershell
curl.exe http://192.168.1.100:3000/api/demo/public -i
```

Expected: HTTP 200 (Computer 3 remains operational)

### Step 7: Administrator Unblocks Computer 2

On Computer 1:
- Navigate to "Blocked Sources"
- Find Computer 2's IP
- Click "Unblock"

### Step 8: Verify Computer 2 Access Restored

On Computer 2:
```powershell
curl.exe http://192.168.1.100:3000/api/demo/public -i
```

Expected: HTTP 200 (access restored)

### Step 9: Computer 3 Sends XSS Attack

On Computer 3:
```powershell
curl.exe -G http://192.168.1.100:3000/api/demo/search --data-urlencode "query=<script>alert('xss')</script>" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -i
```

### Step 10: Verify HTTP 403 and XSS Event

Expected response status: `HTTP/1.1 403 Forbidden`

On Computer 1:
- Navigate to "Threat Events"
- Verify security event shows:
  - Attack type: XSS
  - Action: TEMP_BLOCK
  - Source IP: Computer 3's LAN IP
  - Risk score: 45

### Step 11: Administrator Unblocks Computer 3

On Computer 1:
- Navigate to "Blocked Sources"
- Find Computer 3's IP
- Click "Unblock"

### Step 12: Verify Both Attackers Can Access Again

On Computer 2 and Computer 3:
```powershell
curl.exe http://192.168.1.100:3000/api/demo/public -i
```

Expected: HTTP 200 for both

**Explanation**: IPS mode differs from IDS by actually blocking malicious requests at the IDPS layer, not just logging them. High-risk requests receive HTTP 403 responses, and the source IP is temporarily blocked.

## Automatic Dashboard Updates

The Threat Events page displays new attack events automatically through two mechanisms:

1. **Socket.IO Real-Time Updates**: When a security event is created, the backend emits a `security:new` event. The frontend listens for this event and refreshes the event list immediately.

2. **Polling Fallback**: Every 2 seconds, the frontend polls the server for new security events. This ensures events appear even if Socket.IO connection issues occur.

### What to Check If Events Do Not Appear Automatically

1. Check browser console for Socket.IO connection errors
2. Verify the server is running and Socket.IO is initialized
3. Refresh the page manually
4. Check network connectivity
5. Verify the admin is logged in and authenticated

## Troubleshooting

### Node.js or npm Not Installed

**Problem**: `node` or `npm` commands not recognized

**Solutions**:
- Download and install Node.js from https://nodejs.org/
- Restart PowerShell after installation
- Verify installation: `node --version` and `npm --version`

### Dependencies Missing

**Problem**: `npm install` fails or module not found errors

**Solutions**:
- Ensure Node.js is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check internet connection

### Prisma/Database Connection Failure

**Problem**: Application fails to connect to database

**Solutions**:
- Ensure database migrations ran: `npx prisma migrate deploy`
- Verify `prisma/dev.db` exists in the `server/prisma` directory
- Check `DATABASE_URL` in `.env` file
- Verify SQLite is available (included with Prisma)

### Server Failing to Start

**Problem**: `npm start` fails with errors

**Solutions**:
- Ensure you're in the `server` directory
- Check that dependencies are installed: `npm install`
- Verify `.env` file exists and is correctly formatted
- Check that port 3000 is not in use: `netstat -ano | findstr :3000`
- If port 3000 is in use, either:
  - Change PORT in `.env` to a different port (e.g., 3001)
  - Or kill the process using PowerShell: `Stop-Process -Id <pid> -Force`

### Port 3000 Already Occupied

**Problem**: `EADDRINUSE: address already in use 0.0.0.0:3000`

**Solutions**:
```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill the process (replace <pid> with actual PID)
Stop-Process -Id <pid> -Force

# Or change port in .env to 3001
```

### Administrator Login Failure

**Problem**: Cannot log in with admin credentials

**Solutions**:
- Verify credentials in `.env` file match what you're entering
- Ensure database was seeded: `node prisma/seed.js`
- Check that password hashing is working correctly
- Reset admin password by deleting database and re-seeding

### Attacker Laptop Cannot Access Host

**Problem**: Curl commands from Computer 2/3 fail

**Solutions**:
- Verify all computers are on the same network
- Check Computer 1's IP address: `ipconfig`
- Test connectivity: `ping <host-ip>` and `Test-NetConnection -ComputerName <host-ip> -Port 3000`
- Ensure Windows Firewall allows port 3000 on Computer 1
- Check that server is running with `HOST=0.0.0.0` in `.env`
- Verify frontend is accessible: open `http://<host-ip>:3000` in browser

### Windows Firewall Blocking Connections

**Problem**: Connection refused or timeout

**Solutions**:
- Add inbound rule for port 3000 in Windows Firewall
- Ensure rule allows Private network profile only
- Do not disable Windows Firewall
- Check if antivirus software is blocking the connection

### Incorrect IP Address in Security Logs

**Problem**: Dashboard shows `::ffff:127.0.0.1` instead of LAN IP

**Solutions**:
- This is IPv6 loopback mapping and is normal for localhost testing
- For LAN access, ensure requests come from actual LAN IP (not localhost)
- Check that curl commands use Computer 1's LAN IP, not `localhost`

### SQL Injection or XSS Not Detected

**Problem**: Requests succeed but no security events appear

**Solutions**:
- Verify IDPS mode is enabled (not Monitor mode)
- Check that detectors are active in `server/src/idps/detectors/`
- Verify request patterns match detector regex patterns
- Check browser console and server logs for errors
- Ensure you're using the correct `query` parameter
- Verify URL encoding is correct

### IDS Unexpectedly Blocking Requests

**Problem**: Requests blocked in IDS mode

**Solutions**:
- Check for old block records in `BlockedSource` table
- Manually unblock IPs from admin dashboard
- Verify mode is actually IDS (not IPS)
- Do not delete the database to solve this

### IPS Detecting But Not Blocking

**Problem**: Attacks detected but not prevented (HTTP 200 instead of 403)

**Solutions**:
- Verify mode is actually IPS (not IDS)
- Check risk score thresholds in `server/src/config/idps.js`
- Ensure prevention layer is working in `server/src/idps/prevention/`
- Check that `riskScore` is high enough to trigger blocking
- XSS score is 45, SQL injection score is 40 (both should trigger TEMP_BLOCK)

### Dashboard Not Receiving Live Events

**Problem**: New attacks don't appear immediately

**Solutions**:
- Refresh the page to load new data
- Check browser console for Socket.IO connection errors
- Verify Socket.IO server is running
- Check that admin is logged in and authenticated
- Wait 2 seconds for polling fallback
- Restart the server if Socket.IO connection fails

### Unblock Not Restoring Access

**Problem**: IP remains blocked after unblocking

**Solutions**:
- Verify the unblock operation completed successfully
- Check that the IP is no longer in the Blocked Sources list
- Clear browser cache
- Try a new request after a few seconds
- Restart the server if necessary

### Laptop Disconnecting from Wi-Fi During Presentation

**Problem**: Connection lost during demonstration

**Solutions**:
- Reconnect to the same Wi-Fi network
- Verify IP address hasn't changed
- Re-run connectivity tests
- Consider using a mobile hotspot for more stable connection
- Have a backup plan (e.g., Ethernet cable)

## Resetting Between Demonstrations

### Manually Unblock Demonstration IPs

1. Navigate to "Blocked Sources" in admin dashboard
2. Find the IP address to unblock
3. Click "Unblock" button
4. Verify IP is removed from blocked list

### Switch Back to IDS Mode

1. Navigate to "Settings" or mode selector
2. Select "IDS" mode
3. Confirm mode change in dashboard

### Verify Both Attacker Computers Can Send Normal Requests

On Computer 2 and Computer 3:
```powershell
curl.exe http://192.168.1.100:3000/api/demo/public -i
```

Expected: HTTP 200 for both

### Preserve Demonstration Logs

Security events remain in the database for audit trail. You can view them in the "Threat Events" dashboard. Do not delete the database to clear logs.

### Restart the Server If Necessary

1. Stop the server: `Ctrl+C` in PowerShell
2. Restart: `npm start`
3. Refresh browser to reconnect

**Important**: The demonstration must be repeatable without source-code changes or manual database edits. Use the admin dashboard for all management operations.

## Presentation Checklist

### Localhost Verification (Before Physical Setup)

- [ ] Node.js and npm installed
- [ ] Dependencies installed in both server and client
- [ ] `.env` configured with correct values
- [ ] Prisma Client generated
- [ ] Database initialized and seeded
- [ ] Frontend built successfully
- [ ] Server starts on port 3000
- [ ] Health endpoint responds correctly
- [ ] Administrator can log in (admin@webshield.local / admin123)
- [ ] IDS SQL injection returns HTTP 200 with SQL_INJECTION event
- [ ] IDS XSS returns HTTP 200 with XSS event
- [ ] IPS SQL injection returns HTTP 403 with SQL_INJECTION + TEMP_BLOCK
- [ ] IPS XSS returns HTTP 403 with XSS + TEMP_BLOCK
- [ ] Dashboard displays genuine events automatically
- [ ] Manual unblock restores normal access
- [ ] Frontend loads successfully on port 3000

### Physical LAN Verification (You Will Perform This)

- [ ] All three laptops connected to same network
- [ ] Host IP recorded (e.g., 192.168.1.100)
- [ ] Attacker A IP recorded (e.g., 192.168.1.101)
- [ ] Attacker B IP recorded (e.g., 192.168.1.102)
- [ ] Port 3000 accessible from attacker laptops
- [ ] Windows Firewall configured for Private network only
- [ ] Administrator logged in on host
- [ ] IDS SQL injection successful (HTTP 200 + SQL_INJECTION event)
- [ ] IDS XSS successful (HTTP 200 + XSS event)
- [ ] IPS SQL injection successful (HTTP 403 + SQL_INJECTION + TEMP_BLOCK)
- [ ] IPS XSS successful (HTTP 403 + XSS + TEMP_BLOCK)
- [ ] Logs visible automatically on dashboard
- [ ] Blocked-source functionality working
- [ ] Manual unblock working
- [ ] Other attacker laptop remains operational when one is blocked
- [ ] Demonstration can be repeated without code or database changes

## Important Notes

- **No production-level security features have been added** (as requested)
- **No Playwright or extensive test suite changes** (as requested)
- **No unrelated features added** (as requested)
- Physical LAN testing is required before claiming completion
- The README.md contains everything needed for another student to reproduce the demonstration
- Use port 3000 consistently throughout
- Always use the correct `query` parameter in attack commands
- Use normal User-Agent headers to avoid additional detection
- Do not delete the database or manually edit database records
- Use the admin dashboard for all management operations

## License

This project is for educational demonstration purposes only.
