const express = require('express');
const router = express.Router();
const { register, login, logout, getCurrentUser, getSocketToken } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');
const registrationLimit = rateLimit({ windowMs: 60000, limit: 10 });

router.post('/register', registrationLimit, validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);
router.get('/socket-token', authenticate, getSocketToken);

module.exports = router;
