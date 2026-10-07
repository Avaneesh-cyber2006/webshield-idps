# Repair report — 24 September 2026

## 1. Project understanding

WebShield is a single Node workspace containing a React/Vite/Tailwind client and an Express backend. Prisma/SQLite stores application and IDPS data; JWT cookies and bcrypt implement authentication; administrator middleware and current database roles enforce access control. Socket.IO delivers security and traffic updates. The inspector runs signature/behavior detectors, computes risk, and applies MONITOR/IDS/IPS policy. The Test Lab sends real requests and correlates their IDs with persisted evidence. No external credentials, AI service, database server, Docker deployment or cloud integration is required.

The intended demo search and contact endpoints remain illustrative: search returns sample results, and contact acknowledges receipt without sending email. The project remains an educational HTTP IDPS, not a production network firewall.

## 2. Important problems and fixes

| Priority | Problem / root cause | Files and repair |
|---|---|---|
| Critical | Development client listened on the backend port and proxied to the wrong backend port. | `client/vite.config.js`: frontend 5173; proxy reads backend PORT for HTTP and Socket.IO. |
| Critical | A missing SQLite file caused the native migration engine to fail; test setup also mixed relative paths and depended on a pre-existing demo database. | `server/scripts/init-db.js`, `server/tests/setup-test-db.js`: create the file non-destructively, apply migrations, use unique disposable test databases. |
| High | Blocked Sources queried a nonexistent Prisma relation count. | `server/src/controllers/admin.js`: corrected query and expired-block presentation. |
| High | Inactive/expired blocks were treated as existing manual blocks, preventing reactivation. | `server/src/idps/prevention/blocker.js`: preserve active ownership but reactivate stale records; propagate storage failures. |
| High | Saved mode loaded asynchronously after startup, and saved disabled rules were never loaded. | `server/src/app.js`, `server/src/server.js`, detector registry: await settings/rules before listening. |
| High | Express 4 did not receive rejected inspector promises. | IDPS middleware and app: forward asynchronous errors to the error handler. |
| High | Placeholder/fallback signing secrets, trusted JWT roles, wildcard credentialed CORS, and unrestricted forwarded-IP trust. | Auth middleware now requires a configured secret and reloads user roles; explicit CORS origins; trusted proxy IP/subnet configuration; run proofs cannot act as sessions. |
| High | Test-run headers could associate traffic without administrator authorization. | Inspector requires an admin session or expiring run-scoped JWT proof; frontend carries the proof when login probes omit cookies. |
| High | Dashboard polling and report payloads could trigger detectors and block local management. | Authenticated administrator management is separated from inspected demo/login traffic; access checks remain enforced. |
| High | Test Lab dropped failures and duplicate observations, used built-in login credentials, and treated below-threshold traffic as missed attacks. | Test Lab controller/client retain failed evidence, accept optional test-user credentials, reset per-probe state, and apply threshold-aware expectations. Unsupported browser User-Agent probes are explicitly unavailable. |
| High | Browser cache validation produced server-side 304 records while fetch exposed cached 200 responses, invalidating evidence correlation. | API responses and Test Lab fetches use no-store; API conditional cache validators are discarded. |
| Medium | Post-login detection reran all detectors and counted requests twice; first auth failures could be invisible. | Inspector runs only auth detectors after failure and records AUTH_FAILURE evidence. |
| Medium | Rejected-source traffic was recorded as risk 0 / ALLOW; paths lost API prefixes; Socket.IO traffic events lacked stable IDs. | Inspector stores the correct block decision and complete route path and emits persisted event IDs. |
| Medium | Regex redaction leaked portions of passwords containing spaces. | Recursive structured redaction before serialization/truncation. |
| Medium | Global XSS regex state alternated matches; payload byte size was underestimated. | Stateless entity patterns and UTF-8 byte measurements. |
| Medium | XSS score metadata/test expectation disagreed with the working detector. | Seed and regression expectation aligned with score 45. |
| Medium | Bad input reached Prisma/bcrypt and returned 500; unknown API paths served HTML; malformed JSON became 500. | Shared Zod validation, API JSON 404, correct 400/413 responses. |
| Medium | Missing route guards, unstable socket callbacks, missing reconnect room join, stale network status and nonfunctional quick actions. | Client layouts, SocketContext and admin pages corrected. |
| Medium | UI errors were console-only; dashboard counts/status were hardcoded; traffic filters ignored temporary/rate blocks. | Visible API errors, actual source-IP counters, mode-aware status and corrected filtering/analytics. |
| Medium | Seed ignored direct dotenv loading, reset passwords on repeat, and printed password hashes. | Explicit environment loading, required seed passwords, non-destructive upserts and safe logging. |
| Medium | Lint had no config; test watch invoked Vitest against standalone assertion scripts; one test could fail with exit code 0. | ESLint configuration and fixes; Node test runner/watch; reliable failure exit codes. |

## 3. Changes made

Primary changes are in `server/src/app.js`, `server/src/server.js`, auth/validation middleware, admin/demo/Test Lab controllers, IDPS inspector/blocker/detectors, socket setup, seed and environment configuration. Client changes cover Vite configuration, API error display, authentication guards, socket lifecycle, Test Lab, traffic/analytics and dashboard behavior. Added focused API, full-lab and real Socket.IO integration checks. README now gives reproducible setup and documents actual limitations.

Existing architecture, database models and migrations were retained. No new library dependencies were added. Existing application data and private `.env` values were not reset or replaced. This extracted folder has no Git repository, so no commit or PR was created.

## 4. Verification performed

- `npm ci --offline`: PASS, clean lockfile install from local cache (627 packages).
- `npm run db:generate`: PASS after allowing Prisma's official engine checksum request outside the sandbox.
- Fresh SQLite initialization, all three migrations and seed: PASS repeatedly in disposable databases.
- `npm test`: PASS after clean install/generation; four unit scripts and eleven integration scripts, plus the isolation verifier.
- Full HTTP Test Lab: PASS, 65/65 genuine observations in IDS and 65/65 in IPS.
- Application database hash preservation across integration suite: PASS.
- `npm run lint`: PASS, zero errors/warnings.
- `npm run build`: PASS; Vite reports a nonblocking bundle-size warning.
- Production backend and built frontend: PASS using isolated fixture configuration.
- Development Vite/API/Socket.IO proxy: PASS; browser login and Connected status verified.
- Browser administrator login, logout, normal-user login, admin-route rejection, real dashboard counts and Blocked Sources rendering: PASS.
- Real Socket.IO connection, invalid-token rejection, authenticated admin-room join and security-event delivery: PASS.
- Browser Test Lab: all executable probes verified; User-Agent probe is explicitly unavailable and excluded from confusion-matrix scoring. Browser report cannot honestly be labelled a complete all-probes PASS.

Logs are available in `verification-tests.log`, `clean-install.log`, `lab-full-results.log` and `socket-results.log`. Early baseline/repair logs contain failures that were diagnosed and subsequently corrected. Sandbox restrictions initially affected esbuild and Prisma checksum access; final successful build/generation used the approved external execution path.

## 5. Remaining configuration and limitations

- The existing `server/.env` still contains the example JWT signing value. Configure a private `JWT_SECRET` with at least 32 characters before ordinary `npm start` or `npm run dev`. It is intentionally rejected rather than used as a public credential.
- For a new database, provide `ADMIN_PASSWORD` and `USER_PASSWORD` before seeding. Existing account passwords are preserved.
- Physical multi-computer LAN connectivity/firewall behavior was not testable here.
- Browsers cannot reliably override User-Agent; that specific probe is covered by the real HTTP integration suite instead.
- Dependency installation emitted upstream deprecation warnings, and the production bundle remains large. These do not block the verified flows; broad framework upgrades were outside the targeted repair.
- Offline npm output is not evidence of a current online vulnerability audit. No production-security certification is claimed.

## 6. How to run

From the project root, configure `server/.env` as described above. On a fresh extraction, copy `server/.env.example` first; never overwrite an existing private file blindly.

```powershell
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
npm run build
npm start
```

Open http://localhost:3000. For development after database setup, use `npm run dev` and open http://localhost:5173. Run verification with `npm test` and `npm run lint`. There is no separate SQLite service to launch.

## 7. Environment variables

Required runtime: `JWT_SECRET`, `DATABASE_URL` (SQLite file URL). Required for first seed: `ADMIN_PASSWORD`, `USER_PASSWORD`. Seed emails default to `admin@webshield.local` and `user@webshield.local` and may be overridden with `ADMIN_EMAIL`/`USER_EMAIL`.

Optional: `PORT=3000`, `HOST=0.0.0.0`, `COOKIE_SECURE=false` for local HTTP, `TRUSTED_PROXY=false`, empty `CORS_ORIGINS`, and `NODE_ENV=development` (start script sets production). No frontend secret or external API key is needed. Tests ignore the old TEST_DATABASE_URL setting and create disposable databases.
