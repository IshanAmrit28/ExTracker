const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTransaction = async (req, res) => {
  const transaction = new Transaction({
    userId: req.user.id,
    date: req.body.date,
    description: req.body.description,
    category: req.body.category,
    type: req.body.type,
    paymentMode: req.body.paymentMode || 'UPI',
    amount: req.body.amount,
    notes: req.body.notes
  });

  try {
    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    // Ensure user owns transaction
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSummary = async (req, res) => {
  const { yearMonth } = req.params; // format: YYYY-MM
  try {
    const allTransactions = await Transaction.find({ userId: req.user.id });
    
    const transactions = allTransactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      const start = new Date(`${yearMonth}-01`);
      const end = new Date(`${yearMonth}-31`);
      return d >= start && d < end;
    });

    const income = transactions.filter(t => t.type === 'income' || t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense' || t.type === 'Need' || t.type === 'Want').reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      income,
      expense,
      balance: income - expense,
      transactions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
