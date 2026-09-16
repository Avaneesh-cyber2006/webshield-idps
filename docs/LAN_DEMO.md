# WebShield LAN Demonstration Guide

## Overview

This guide explains how to demonstrate WebShield across multiple computers connected to the same private LAN (Local Area Network). This is essential for showing real-world IDPS functionality with different client sources.

## Prerequisites

- **Network**: All computers on the same private LAN/Wi-Fi/hotspot
- **Server**: One computer to run WebShield server
- **Clients**: One or more computers to act as users/test clients
- **Firewall**: Windows Firewall configured to allow the chosen port
- **IP Knowledge**: Ability to find LAN IP addresses

## Network Configuration

### Typical Setup

```
Computer 1 (Server)
├─ Role: WebShield Server + Admin Dashboard
├─ OS: Windows
├─ LAN IP: 192.168.1.10 (example)
└─ Port: 8080

Computer 2 (Normal User)
├─ Role: Demo Application User
├─ OS: Windows/Linux/Mac
├─ LAN IP: 192.168.1.15 (example)
└─ Access: http://192.168.1.10:8080/demo

Computer 3 (Security Test Client)
├─ Role: Security Test Lab User
├─ OS: Windows/Linux/Mac
├─ LAN IP: 192.168.1.16 (example)
└─ Access: http://192.168.1.10:8080/admin/test-lab
```

## Finding Your LAN IP

### Windows

1. Open Command Prompt
2. Run:
   ```cmd
   ipconfig
   ```
3. Look for your active network adapter
4. Find "IPv4 Address" (e.g., 192.168.1.10)
5. This is your LAN IP

### Linux

1. Open Terminal
2. Run:
   ```bash
   ifconfig
   ```
3. Look for your active network interface (e.g., eth0, wlan0)
4. Find "inet" address (e.g., 192.168.1.10)
5. This is your LAN IP

### macOS

1. Open Terminal
2. Run:
   ```bash
   ifconfig
   ```
3. Look for your active network interface (e.g., en0)
4. Find "inet" address (e.g., 192.168.1.10)
5. This is your LAN IP

## Verification Steps

### 1. Verify Same Network

**On Computer 1**:
```cmd
ipconfig
```
Note the IPv4 address and subnet mask (e.g., 255.255.255.0)

**On Computer 2**:
```cmd
ipconfig
```
Verify the subnet mask matches Computer 1

**Test connectivity**:
```cmd
ping 192.168.1.10
```
Replace with Computer 1's IP. Should receive replies.

### 2. Verify No Firewall Blocking

**Windows Firewall (Computer 1)**:
1. Open Windows Defender Firewall
2. Go to "Allow an app or feature through Windows Defender Firewall"
3. Ensure Node.js is allowed for Private networks
4. Or create an inbound rule for port 8080

**Alternative: Temporarily disable for demo**:
⚠️ **WARNING**: Only do this on trusted private networks
1. Open Windows Defender Firewall
2. Turn off for Private networks
3. Remember to re-enable after demo

### 3. Start WebShield Server

**On Computer 1**:
```bash
cd "C:\Users\avane\Desktop\Studies\Semester 5\IDPS\Project"
npm run build
npm start
```

Expected output:
```
Database connected successfully
WebShield server running on http://0.0.0.0:8080
Admin dashboard: http://localhost:8080
For LAN access: http://<YOUR_LAN_IP>:8080
```

### 4. Test Local Access

**On Computer 1**:
- Open browser
- Navigate to: http://localhost:8080
- Should see login page
- Login with admin credentials

### 5. Test LAN Access

**On Computer 2**:
- Open browser
- Navigate to: http://192.168.1.10:8080 (replace with actual LAN IP)
- Should see login page
- Login with demo user credentials

**On Computer 3**:
- Open browser
- Navigate to: http://192.168.1.10:8080 (replace with actual LAN IP)
- Should see login page
- Login with admin credentials

## Demonstration Scenario

### Step 1: Server Setup (Computer 1)

1. Start WebShield server in production mode
2. Login as admin
3. Navigate to Admin Dashboard
4. Go to Settings → Set IDPS mode to "IDS"
5. Go to Network Demo → Note server address
6. Open Live Traffic page in a new tab

### Step 2: Normal User (Computer 2)

1. Access http://192.168.1.10:8080/demo
2. Login as demo user (user@webshield.local / user123)
3. Navigate through demo pages:
   - Dashboard
   - Profile
   - Search (perform normal searches)
   - Contact (send a message)
4. Observe traffic appearing on Computer 1's Live Traffic

### Step 3: Verify Source IP

**On Computer 1**:
- Check Live Traffic page
- Observe source IP for Computer 2's requests
- Should show Computer 2's LAN IP (e.g., 192.168.1.15)
- Not showing as 127.0.0.1 or localhost

**Add Device Label**:
1. Go to Settings
2. Add device label: 192.168.1.15 → "Normal User Laptop"
3. Save

### Step 4: Security Testing (Computer 3)

1. Access http://192.168.1.10:8080/admin/test-lab
2. Login as admin
3. Run individual tests:
   - Normal Request
   - SQL Injection Pattern
   - XSS Pattern
4. Observe results on Computer 1:
   - Live Traffic shows Computer 3's IP (e.g., 192.168.1.16)
   - Threat Events show detections
   - Source IPs are correctly distinguished

### Step 5: IDS vs IPS Comparison

**IDS Mode**:
1. Ensure mode is set to IDS (Computer 1 Settings)
2. Computer 3 runs SQL Injection test
3. Observe: DETECTED, ALERTED, not BLOCKED
4. Computer 1 sees detection in Threat Events

**IPS Mode**:
1. Computer 1 switches to IPS mode
2. Computer 3 runs same SQL Injection test
3. Observe: DETECTED, ALERTED, BLOCKED
4. Computer 1 sees detection and block in Threat Events
5. Computer 3 sees 403 error

### Step 6: Rate Limiting Demo

1. Computer 3 runs "Request Rate Abuse" test
2. Observe rate limiting in action
3. Computer 1 sees rate limit events
4. Computer 3 experiences 429 errors

### Step 7: Blocking Demo

1. Computer 1 goes to Blocked Sources
2. Manually blocks Computer 3's IP
3. Computer 3 tries to access any page
4. Observe immediate 403 error
5. Computer 1 unblocks Computer 3
6. Computer 3 access restored

## Troubleshooting

### Page Not Loading Remotely

**Problem**: Computer 2/3 cannot access http://LAN_IP:8080

**Solutions**:
1. Verify all computers on same network (same subnet)
2. Check Windows Firewall on Computer 1
3. Verify server is running on 0.0.0.0 (not 127.0.0.1)
4. Ping from Computer 2 to Computer 1's IP
5. Try disabling Windows Firewall temporarily (private network only)
6. Check port 8080 is not already in use

### Wrong IP Displayed

**Problem**: Dashboard shows wrong source IP

**Solutions**:
1. Check IP normalization logic
2. Verify X-Forwarded-For headers
3. Check for proxy/VPN interference
4. Ensure no IP spoofing on network
5. Verify getClientIp function working correctly

### Windows Firewall Blocking Port

**Problem**: Firewall blocking connections

**Solutions**:
1. Add inbound rule for port 8080:
   - Windows Defender Firewall → Advanced Settings
   - Inbound Rules → New Rule
   - Port → TCP → 8080 → Allow → Private networks
2. Or temporarily disable for private networks
3. Ensure Node.js is allowed through firewall

### Socket.IO Disconnected

**Problem**: Real-time updates not working

**Solutions**:
1. Check Socket.IO server is running
2. Verify client can connect to /socket.io
3. Check browser console for errors
4. Verify CORS configuration
5. Check firewall allows WebSocket connections

### Client/Server Not on Same Subnet

**Problem**: Cannot ping between computers

**Solutions**:
1. Verify all connected to same router/access point
2. Check subnet masks match (e.g., 255.255.255.0)
3. Ensure no VLAN separation
4. Check router settings for client isolation
5. Try different network (Wi-Fi vs Ethernet)

### Browser Caching Issues

**Problem**: Old data showing, updates not appearing

**Solutions**:
1. Hard refresh (Ctrl+F5)
2. Clear browser cache
3. Try different browser
4. Check for service worker caching
5. Verify Socket.IO connection status

### Port Already Occupied

**Problem**: Port 8080 already in use

**Solutions**:
1. Find process using port:
   ```cmd
   netstat -ano | findstr :8080
   ```
2. Kill the process or use different port
3. Change PORT environment variable
4. Update firewall rule for new port

## Advanced Configuration

### Custom Port

To use a different port:

1. Set environment variable:
   ```cmd
   set PORT=3000
   npm start
   ```

2. Update firewall rule for new port
3. Update LAN access URL to use new port

### Multiple Network Interfaces

If server has multiple network interfaces:

1. Choose primary interface for demo
2. Use that interface's IP for client access
3. Configure firewall for that interface
4. Document which IP to use

### Static IP Assignment

For consistent demos:

1. Configure static IP on server
2. Document the IP address
3. Use same IP for all demos
4. Avoid IP changes between sessions

## Safety Considerations

### Network Security

1. **Private Network Only**: Use only trusted private LAN
2. **No Public Exposure**: Do not expose to internet
3. **Firewall**: Keep firewall enabled when possible
4. **Access Control**: Limit who can access server
5. **Monitor**: Watch for unexpected connections

### Data Protection

1. **No Sensitive Data**: Don't use real credentials
2. **Demo Data Only**: Use seeded demo data
3. **Clean Reset**: Reset database between demos
4. **No Logging**: Don't log sensitive information
5. **Educational Focus**: This is for learning only

## Quick Reference

### Common Commands

**Find LAN IP (Windows)**:
```cmd
ipconfig
```

**Test Connectivity**:
```cmd
ping 192.168.1.10
```

**Check Port Usage**:
```cmd
netstat -ano | findstr :8080
```

**Start Server**:
```bash
npm start
```

**Reset Database**:
```bash
npm run db:reset
```

### Default Credentials

**Admin**:
- Email: admin@webshield.local
- Password: admin123

**Demo User**:
- Email: user@webshield.local
- Password: user123

### Default Ports

- Development: 5000 (backend), 3000 (frontend)
- Production: 8080 (combined)

### Common URLs

- Local: http://localhost:8080
- LAN: http://YOUR_LAN_IP:8080
- Admin: http://localhost:8080/admin/overview
- Demo: http://localhost:8080/demo/dashboard
- Test Lab: http://localhost:8080/admin/test-lab

## Presentation Tips

### Before Demo

1. Test all connections beforehand
2. Verify all computers can access server
3. Reset database to clean state
4. Prepare device labels
5. Set initial IDPS mode

### During Demo

1. Explain network setup
2. Show source IP differentiation
3. Demonstrate IDS vs IPS
4. Show real-time updates
5. Explain detection mechanisms

### After Demo

1. Reset database
2. Clear blocks
3. Reset IDPS mode
4. Document any issues
5. Re-enable firewall if disabled

## Conclusion

Following this guide should enable a smooth multi-computer demonstration of WebShield's IDPS capabilities. The key is proper network setup, firewall configuration, and systematic testing before the actual presentation.
