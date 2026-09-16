const express = require('express');
const router = express.Router();
const { getDashboard, getProfile, search, contact, protectedData, publicData } = require('../controllers/demo');
const { authenticate } = require('../middleware/auth');

router.get('/dashboard', authenticate, getDashboard);
router.get('/profile', authenticate, getProfile);
router.get('/search', authenticate, search);
router.post('/contact', authenticate, contact);
router.get('/protected', authenticate, protectedData);
router.get('/public', publicData);

module.exports = router;
