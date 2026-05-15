const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get user settings (creates default if none exist)
router.get('/', auth, settingsController.getSettings);

// @route   POST /api/settings
// @desc    Update user settings
router.post('/', auth, settingsController.updateSettings);

module.exports = router;
