const express = require('express');
const router = express.Router();
const { register, login, logout, getCurrentUser, getSocketToken } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);
router.get('/socket-token', authenticate, getSocketToken);

module.exports = router;
