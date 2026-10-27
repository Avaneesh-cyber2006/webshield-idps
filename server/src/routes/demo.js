const express = require('express');
const router = express.Router();
const { getDashboard, getProfile, search, contact, protectedData, publicData } = require('../controllers/demo');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.get('/dashboard', authenticate, getDashboard);
router.get('/profile', authenticate, getProfile);
router.get('/search', validate(schemas.search, 'query'), search);
router.post('/contact', validate(schemas.contact), contact);
router.get('/protected', authenticate, protectedData);
router.get('/public', publicData);

module.exports = router;
