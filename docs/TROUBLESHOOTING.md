# WebShield Troubleshooting Guide

This document provides solutions to common issues encountered when setting up and running WebShield.

## Installation Issues

### npm install fails

**Problem**: `npm install` fails with errors

**Solutions**:
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
2. Delete node_modules and package-lock.json:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Use npm legacy peer deps:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Check Node.js version (requires 18+):
   ```bash
   node --version
   ```

### Prisma generation fails

**Problem**: `npx prisma generate` fails

**Solutions**:
1. Ensure Prisma is installed:
   ```bash
   npm install prisma @prisma/client
   ```
2. Clear Prisma cache:
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```
3. Check schema.prisma syntax
4. Verify Node.js version compatibility

### Database migration fails

**Problem**: `npx prisma migrate dev` fails

**Solutions**:
1. Delete existing database:
   ```bash
   rm server/prisma/dev.db
   ```
2. Run migration again:
   ```bash
   npx prisma migrate dev
   ```
3. Check Prisma schema for errors
4. Ensure write permissions on directory

## Server Issues

### Server won't start

**Problem**: `npm start` fails to start server

**Solutions**:
1. Check if port is already in use:
   ```bash
   netstat -ano | findstr :8080
   ```
2. Kill process using port or change port:
   ```cmd
   set PORT=3000
   npm start
   ```
3. Check database connection:
   ```bash
   npm run db:generate
   ```
4. Check server logs for specific error

### Port already in use

**Problem**: "Port 8080 is already in use"

**Solutions**:
1. Find and kill process:
   ```cmd
   netstat -ano | findstr :8080
   taskkill /PID <PID> /F
   ```
2. Use different port:
   ```cmd
   set PORT=3000
   npm start
   ```
3. Stop other services using the port

### Database connection fails

**Problem**: "Database connection failed"

**Solutions**:
1. Ensure database file exists:
   ```bash
   ls server/prisma/dev.db
   ```
2. Regenerate Prisma client:
   ```bash
   npm run db:generate
   ```
3. Check file permissions
4. Recreate database:
   ```bash
   rm server/prisma/dev.db
   npm run db:migrate
   npm run db:seed
   ```

### Socket.IO connection fails

**Problem**: Socket.IO client cannot connect

**Solutions**:
1. Check server is running
2. Verify Socket.IO server is initialized
3. Check CORS configuration
4. Verify Socket.IO client URL:
   - Development: http://localhost:5000
   - Production: window.location.origin
5. Check browser console for errors
6. Verify firewall allows WebSocket connections

## Frontend Issues

### Frontend won't build

**Problem**: `npm run build` fails

**Solutions**:
1. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   npm run build
   ```
2. Check for syntax errors in React components
3. Verify all imports are correct
4. Check Tailwind CSS configuration

### Frontend shows blank page

**Problem**: Browser shows blank page after build

**Solutions**:
1. Check browser console for errors
2. Verify build completed successfully
3. Check dist folder exists:
   ```bash
   ls client/dist
   ```
4. Verify Express is serving static files correctly
5. Check React Router configuration

### API calls fail in production

**Problem**: API calls fail after build

**Solutions**:
1. Verify API URL configuration
2. Check that Express is serving API routes
3. Verify CORS configuration
4. Check that API is accessible:
   ```bash
   curl http://localhost:8080/api/public
   ```
5. Ensure relative paths are used in production

### Styles not loading

**Problem**: Tailwind CSS styles not applied

**Solutions**:
1. Verify Tailwind is installed:
   ```bash
   npm install tailwindcss postcss autoprefixer
   ```
2. Check tailwind.config.js exists
3. Verify postcss.config.js exists
4. Ensure index.css imports Tailwind:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
5. Rebuild frontend:
   ```bash
   npm run build
   ```

## Authentication Issues

### Login fails

**Problem**: Cannot login with correct credentials

**Solutions**:
1. Verify user exists in database
2. Check password hashing
3. Reseed database:
   ```bash
   npm run db:seed
   ```
4. Check JWT secret configuration
5. Verify cookie settings

### Token expires immediately

**Problem**: User logged out immediately after login

**Solutions**:
1. Check JWT expiration time
2. Verify cookie settings (httpOnly, secure, sameSite)
3. Check system time synchronization
4. Verify JWT secret is consistent

### Protected routes inaccessible

**Problem**: Cannot access protected routes after login

**Solutions**:
1. Verify token is being sent
2. Check token validation logic
3. Verify authenticate middleware
4. Check cookie configuration
5. Clear browser cookies and try again

## IDPS Issues

### Detections not working

**Problem**: Attacks not being detected

**Solutions**:
1. Verify IDPS middleware is applied
2. Check detector is enabled
3. Verify detection patterns
4. Check risk scoring logic
5. Test with known attack patterns

### Blocking not working in IPS mode

**Problem**: Requests not blocked in IPS mode

**Solutions**:
1. Verify mode is set to IPS
2. Check decision engine logic
3. Verify prevention layer is working
4. Check risk score thresholds
5. Test with high-risk attack

### Rate limiting not working

**Problem**: Rate limit not enforced

**Solutions**:
1. Verify rate limit detector is enabled
2. Check rate limit thresholds
3. Verify request tracking logic
4. Test with rapid requests
5. Check prevention layer

### Risk scores incorrect

**Problem**: Risk scores not calculated correctly

**Solutions**:
1. Verify detector scores
2. Check risk scoring logic
3. Verify score capping at 100
4. Test with single and multiple detections
5. Check severity thresholds

## LAN Issues

### Cannot access from other computers

**Problem**: Other computers cannot access server

**Solutions**:
1. Verify server binds to 0.0.0.0
2. Check Windows Firewall settings
3. Verify all computers on same network
4. Test connectivity:
   ```cmd
   ping <SERVER_IP>
   ```
5. Check router for client isolation

### Wrong IP displayed in dashboard

**Problem**: Dashboard shows incorrect source IP

**Solutions**:
1. Check IP normalization logic
2. Verify X-Forwarded-For headers
3. Check for proxy interference
4. Verify getClientIp function
5. Test with direct connection

### Socket.IO disconnected on LAN

**Problem**: Socket.IO disconnects on LAN access

**Solutions**:
1. Verify Socket.IO server CORS configuration
2. Check firewall allows WebSocket
3. Verify Socket.IO client URL
4. Test Socket.IO connection separately
5. Check network stability

## Test Lab Issues

### Tests not running

**Problem**: Test Lab tests fail to execute

**Solutions**:
1. Verify server is running
2. Check API endpoints are accessible
3. Verify test controller logic
4. Check axios configuration
5. Test individual endpoints manually

### Incorrect test results

**Problem**: Tests show unexpected results

**Solutions**:
1. Verify IDPS mode setting
2. Check detector states
3. Verify test execution logic
4. Check database for events
5. Verify expected vs actual logic

### Metrics calculation wrong

**Problem**: TP/TN/FP/FN or metrics incorrect

**Solutions**:
1. Verify test execution completed
2. Check individual test results
3. Verify calculation logic
4. Check for division by zero
5. Verify confusion matrix logic

## Performance Issues

### Server slow response

**Problem**: Server responds slowly

**Solutions**:
1. Check database query performance
2. Add database indexes if needed
3. Check for memory leaks
4. Optimize Socket.IO events
5. Reduce logging in production

### High memory usage

**Problem**: Server using excessive memory

**Solutions**:
1. Check for memory leaks in detectors
2. Clear old data from in-memory maps
3. Reduce history retention
4. Check for unclosed connections
5. Monitor with process manager

### Database locked

**Problem**: "Database is locked" errors

**Solutions**:
1. SQLite is single-writer by design
2. Reduce concurrent writes
3. Use transactions properly
4. Close unused connections
5. Consider WAL mode for SQLite

## Windows-Specific Issues

### Permission denied errors

**Problem**: "Permission denied" on Windows

**Solutions**:
1. Run terminal as Administrator
2. Check file/folder permissions
3. Disable antivirus temporarily
4. Check Windows Defender
5. Verify user has write permissions

### Path too long errors

**Problem**: "Path too long" on Windows

**Solutions**:
1. Move project to shorter path
2. Use Windows long path support
3. Enable long path in registry
4. Reduce directory nesting depth

### Node.js not found

**Problem**: "node is not recognized" on Windows

**Solutions**:
1. Verify Node.js installation
2. Add Node.js to PATH
3. Restart terminal
4. Reinstall Node.js
5. Use full path to node.exe

## Development Issues

### Hot reload not working

**Problem**: Changes not reflected without restart

**Solutions**:
1. Verify nodemon is installed
2. Check nodemon configuration
3. Verify Vite HMR is working
4. Check for file watcher limits
5. Restart dev server

### ESLint errors

**Problem**: ESLint preventing build

**Solutions**:
1. Fix ESLint errors
2. Disable ESLint for build:
   ```bash
   npm run build -- --mode production
   ```
3. Update ESLint configuration
4. Ignore specific files
5. Use --no-emit flag

### TypeScript errors (if added)

**Problem**: TypeScript compilation errors

**Solutions**:
1. Fix type errors
2. Update tsconfig.json
3. Use @ts-ignore sparingly
4. Install missing type definitions
5. Disable strict mode temporarily

## Data Issues

### Database corrupted

**Problem**: Database file corrupted

**Solutions**:
1. Delete and recreate database:
   ```bash
   rm server/prisma/dev.db
   npm run db:migrate
   npm run db:seed
   ```
2. Restore from backup if available
3. Check for disk errors
4. Verify file system integrity

### Seed data missing

**Problem**: Expected seed data not present

**Solutions**:
1. Run seed command:
   ```bash
   npm run db:seed
   ```
2. Check seed.js for errors
3. Verify Prisma client is generated
4. Check database connection
5. Inspect database directly

### Old test data interfering

**Problem**: Old test data affecting results

**Solutions**:
1. Reset database:
   ```bash
   npm run db:reset
   ```
2. Clear specific tables manually
3. Use fresh database for each demo
4. Implement data cleanup scripts
5. Document reset procedure

## Getting Help

### Debug Mode

Enable debug logging:

```bash
# Server
DEBUG=* npm start

# Client
# Add console.log statements
# Use React DevTools
# Check browser console
```

### Log Files

Check log files for errors:

```bash
# Server logs
# Console output

# Browser logs
# Browser DevTools → Console
# Browser DevTools → Network
```

### Common Error Messages

**"EADDRINUSE"**: Port already in use
**"ECONNREFUSED"**: Connection refused (server not running)
**"Authentication failed"**: Invalid credentials
**"Database connection failed"**: Database not accessible
**"Socket.IO connection failed"**: WebSocket connection issue

### Reset to Clean State

To reset everything to clean state:

```bash
# Stop server
# Clear databases
rm server/prisma/dev.db

# Clear node_modules
rm -rf node_modules client/node_modules server/node_modules

# Clear build artifacts
rm -rf client/dist

# Reinstall
npm run setup

# Reinitialize database
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Prevention

### Best Practices

1. **Regular Backups**: Backup database before major changes
2. **Version Control**: Use git to track changes
3. **Documentation**: Document custom configurations
4. **Testing**: Test changes in development first
5. **Monitoring**: Monitor server logs and performance

### Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Security Patches**: Apply security updates promptly
3. **Database Maintenance**: Regular database cleanup
4. **Log Rotation**: Implement log rotation for production
5. **Performance Monitoring**: Monitor server performance

## Conclusion

Most issues can be resolved by:
1. Checking error messages carefully
2. Verifying configuration files
3. Testing components individually
4. Resetting to clean state if needed
5. Consulting documentation for specific features

If issues persist, check the documentation files or review the code for the specific component causing problems.
