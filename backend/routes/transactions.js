const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');

// @route   GET /api/transactions
// @desc    Get all transactions for logged in user
router.get('/', auth, transactionController.getTransactions);

// @route   POST /api/transactions
// @desc    Create a transaction
router.post('/', auth, transactionController.createTransaction);

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
router.delete('/:id', auth, transactionController.deleteTransaction);

// @route   GET /api/transactions/summary/:yearMonth
// @desc    Get summarized data for a specific month
router.get('/summary/:yearMonth', auth, transactionController.getSummary);

module.exports = router;
