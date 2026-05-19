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

// @route   POST /api/settings/send-weekly-report
// @desc    Manually generate and send weekly report PDF
router.post('/send-weekly-report', auth, settingsController.sendWeeklyReport);

// @route   POST /api/settings/send-monthly-report
// @desc    Manually generate and send monthly report PDF
router.post('/send-monthly-report', auth, settingsController.sendMonthlyReport);

module.exports = router;
