const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const auth = require('../middleware/auth');

// @route   GET /api/budget/:month
// @desc    Get budget for a specific month for logged in user
router.get('/:month', auth, budgetController.getBudget);

// @route   POST /api/budget/:month
// @desc    Update budget for a specific month
router.post('/:month', auth, budgetController.updateBudget);

module.exports = router;
