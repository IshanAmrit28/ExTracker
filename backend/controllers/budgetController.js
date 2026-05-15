const Budget = require('../models/Budget');

exports.getBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne({ userId: req.user.id, month: req.params.month });
    if (!budget) {
      budget = new Budget({ userId: req.user.id, month: req.params.month, limit: 0 });
      await budget.save();
    }
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne({ userId: req.user.id, month: req.params.month });
    if (!budget) {
      budget = new Budget({ userId: req.user.id, month: req.params.month, limit: req.body.limit });
    } else {
      budget.limit = req.body.limit;
    }
    const updatedBudget = await budget.save();
    res.json(updatedBudget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
