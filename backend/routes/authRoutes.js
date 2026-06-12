const express = require('express');
const { login, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.post('/logout', protect, logout);

module.exports = router;
