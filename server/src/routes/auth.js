const express = require('express');
const router = express.Router();
const { register, login, logout, getCurrentUser } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
