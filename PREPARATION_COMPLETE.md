# WebShield IDPS - Presentation Preparation Complete

## What Has Been Done

### 1. LAN Configuration
- Server configured to listen on `0.0.0.0` (all interfaces)
- Port changed to 3000 for unified frontend/backend serving
- CORS configured to allow all origins for LAN demonstration
- Socket.IO configured to allow all origins for LAN demonstration
- Frontend API service updated to use relative URLs (same-origin)

### 2. Production Build
- Frontend built successfully with Vite
- Static files ready in `client/dist/`
- Server configured to serve static files in production mode
- Single port (3000) serves both React app and API

### 3. Localhost Verification
- Server starts successfully on port 3000
- Health check endpoint responds correctly
- Public API endpoint responds correctly
- SQL injection blocked in IPS mode (HTTP 403)
- XSS blocked in IPS mode (HTTP 403)
- Request IDs generated correctly
- Block messages returned correctly

### 4. Documentation
- Complete README.md created with step-by-step instructions
- `.env.example` created for safe configuration
- `.gitignore` updated to exclude sensitive files
- PowerShell commands with URL encoding for attack tests
- Troubleshooting section included
- Reset procedures documented

### 5. Environment Files
- `.env` configured for demonstration
- `.env.example` provided for fresh installations
- Default credentials: admin@webshield.local / admin123

## Commands Verified Working

### Server Start
```powershell
cd server
npm start
```

### Health Check
```powershell
curl.exe http://localhost:3000/health
```

### Normal Request
```powershell
curl.exe http://localhost:3000/api/demo/public
```

### SQL Injection (URL-encoded)
```powershell
curl.exe "http://localhost:3000/api/demo/search?q=%27%20OR%20%271%27%3D%271"
```

### XSS (URL-encoded)
```powershell
curl.exe "http://localhost:3000/api/demo/search?q=%3Cscript%3Ealert('xss')%3C/script%3E"
```

## What Requires Physical Computer Testing

### 1. LAN Connectivity
- [ ] Find Computer 1's LAN IP using `ipconfig`
- [ ] Ping Computer 1 from Computer 2 and 3
- [ ] Test TCP connectivity with `Test-NetConnection`
- [ ] Access web interface from Computer 2/3 using LAN IP
- [ ] Configure Windows Firewall to allow port 3000

### 2. IDS Mode Demo
- [ ] Switch to IDS mode on Computer 1
- [ ] Send SQL injection from Computer 2 → HTTP 200, attack logged
- [ ] Verify dashboard shows attack with correct IP
- [ ] Send XSS from Computer 3 → HTTP 200, attack logged
- [ ] Verify dashboard shows both attacks

### 3. IPS Mode Demo
- [ ] Switch to IPS mode on Computer 1
- [ ] Send SQL injection from Computer 2 → HTTP 403, blocked
- [ ] Verify dashboard shows blocked IP
- [ ] Send normal request from Computer 3 → HTTP 200 (operational)
- [ ] Send XSS from Computer 3 → HTTP 403, blocked
- [ ] Unblock Computer 2 from dashboard
- [ ] Verify Computer 2 can send normal requests again

### 4. Multi-Computer Isolation
- [ ] Verify Computer 3 remains operational when Computer 2 is blocked
- [ ] Verify blocking Computer 2 doesn't affect Computer 3
- [ ] Verify unblocking restores access only for Computer 2

## Setup Instructions for Physical Computers

### Computer 1 (Host)
1. Open PowerShell
2. Navigate to project directory
3. Run `cd server && npm start`
4. Note the LAN IP from startup message or run `ipconfig`
5. Open browser to `http://localhost:3000`
6. Log in as admin@webshield.local / admin123

### Computer 2 (Attacker A)
1. Connect to same network as Computer 1
2. Open PowerShell
3. Run `ipconfig` to find your IP
4. Test connectivity: `ping <computer-1-ip>`
5. Open browser to `http://<computer-1-ip>:3000`
6. Send test requests using curl commands from README

### Computer 3 (Attacker B)
1. Same setup as Computer 2
2. Use different IP address
3. Test independently

## Troubleshooting for Physical Setup

### Computer Cannot Access Host
- Check all computers on same network
- Verify Windows Firewall allows port 3000
- Test with `ping` and `Test-NetConnection`
- Ensure server is running with `HOST=0.0.0.0`

### Attacks Not Appearing in Dashboard
- Refresh the page
- Check browser console for Socket.IO errors
- Verify mode is set correctly (IDS vs IPS)
- Check server logs for errors

### Wrong IP in Logs
- May show `::ffff:127.0.0.1` for localhost
- For LAN access, ensure requests use LAN IP, not localhost
- Check that curl commands use Computer 1's LAN IP

## Reset Between Demonstrations

1. Unblock all IPs from dashboard
2. Switch back to IDS mode if needed
3. Refresh dashboard to clear old events
4. Restart server if needed (Ctrl+C, then `npm start`)

## Completion Checklist

Before the presentation:

- [ ] README.md reviewed and all commands verified
- [ ] Server starts successfully on Computer 1
- [ ] Frontend accessible via browser on Computer 1
- [ ] Admin login works on Computer 1
- [ ] Mode switching works (IDS ↔ IPS)
- [ ] Computer 2 can access Computer 1 via LAN IP
- [ ] Computer 3 can access Computer 1 via LAN IP
- [ ] IDS mode: attacks logged but not blocked
- [ ] IPS mode: attacks blocked with HTTP 403
- [ ] Dashboard shows correct source IPs
- [ ] Unblocking restores access
- [ ] Computer 3 unaffected when Computer 2 blocked
- [ ] Demonstration can be repeated without code changes

## Files Modified for Presentation

1. `server/.env` - Port changed to 3000
2. `server/.env.example` - Template created
3. `server/src/server.js` - CORS/Socket.IO configured for LAN
4. `server/src/app.js` - CORS configured for LAN
5. `client/src/services/api.js` - Relative URLs for same-origin
6. `client/src/contexts/SocketContext.jsx` - Relative URL for Socket.IO
7. `client/dist/` - Production build created
8. `.gitignore` - Updated for database files
9. `README.md` - Complete demonstration guide created

## Files NOT Modified (As Requested)

- No production-level security improvements added
- No extensive test suite modifications
- No Playwright implementation
- No advanced database migrations
- No unrelated features added

## Next Steps

1. Test on localhost with the provided curl commands
2. Set up three physical computers on same LAN
3. Follow README.md instructions for each computer
4. Run IDS mode demonstration
5. Run IPS mode demonstration
6. Verify all completion criteria are met
7. Practice the demonstration flow before presentation

## Notes

- The application now runs in production mode on port 3000
- All requests (frontend and API) go through the same port
- This simplifies the setup and avoids CORS issues
- URL encoding is required for curl commands with special characters
- The README.md contains all necessary PowerShell commands
- Physical LAN testing is required before claiming completion
