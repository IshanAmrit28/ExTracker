const Transaction = require('../models/Transaction');
const { roundCurrency, validateSplitExpense } = require('../utils/splitExpense');

const migrateTransactions = async (transactions) => {
  for (let t of transactions) {
    let newCat = null;
    let newType = null;
    
    if (t.category === 'Life Infrastructure') { newCat = 'Groceries'; newType = 'Need'; }
    else if (t.category === 'Future Me') { newCat = 'Savings & Investments'; newType = 'Saving'; }
    else if (t.category === 'Performance & Growth') { newCat = 'Essentials'; newType = 'Need'; }
    else if (t.category === 'Relationships & Generosity') { newCat = 'Essentials'; newType = 'Want'; }
    else if (t.category === 'Lifestyle Enjoyment') { newCat = 'Entertainment'; newType = 'Want'; }

    if (newCat) {
      t.category = newCat;
      if (newType) t.type = newType;
      await t.save();
    }
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });
    await migrateTransactions(transactions);
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTransaction = async (req, res) => {
  let amountVal = roundCurrency(req.body.amount);
  const isSplit = Boolean(req.body.isSplit);
  let myShareVal = amountVal;
  let recoverable = 0;
  let splitMembers = [];

  if (!Number.isFinite(amountVal) || amountVal <= 0) {
    return res.status(400).json({ message: 'Transaction amount must be greater than 0.' });
  }

  if (isSplit) {
    const result = validateSplitExpense({
      amount: amountVal,
      myShare: req.body.myShare,
      members: req.body.splitMembers,
    });
    if (result.error) return res.status(400).json({ message: result.error });

    amountVal = result.totalAmount;
    myShareVal = result.personalShare;
    recoverable = result.recoverableAmount;
    splitMembers = result.members.map((member) => ({
      ...member,
      reimbursedAmount: 0,
      isFullyReimbursed: false,
    }));
  }

  const transaction = new Transaction({
    userId: req.user.id,
    date: req.body.date,
    description: req.body.description,
    category: req.body.category,
    type: req.body.type,
    paymentMode: req.body.paymentMode || 'UPI',
    bank: req.body.bank || 'Cash / Wallet',
    amount: amountVal,
    notes: req.body.notes,
    isSplit: isSplit,
    splitMethod: req.body.splitMethod || 'equal',
    splitWith: req.body.splitWith || '',
    splitMembers: splitMembers,
    myShare: myShareVal,
    recoverableAmount: recoverable,
    reimbursedAmount: 0,
    reimbursementStatus: isSplit && recoverable > 0 ? 'Pending' : 'Completed'
  });

  try {
    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.recordReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, notes, bank, paymentMode, personName } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    if (!transaction.isSplit) {
      return res.status(400).json({ message: 'Transaction is not a split expense' });
    }

    const reimburseVal = roundCurrency(amount);
    if (!Number.isFinite(reimburseVal) || reimburseVal <= 0) {
      return res.status(400).json({ message: 'Reimbursement amount must be greater than 0' });
    }

    const currentReimbursed = transaction.reimbursedAmount || 0;
    const recoverable = transaction.recoverableAmount || 0;
    const outstanding = Math.max(0, recoverable - currentReimbursed);

    if (reimburseVal > outstanding + 0.01) {
      return res.status(400).json({ 
        message: `Reimbursement amount (₹${reimburseVal}) cannot exceed outstanding recoverable amount (₹${outstanding.toFixed(2)})` 
      });
    }

    let matchedMember = null;
    if (Array.isArray(transaction.splitMembers) && transaction.splitMembers.length > 0) {
      const normalizedPersonName = String(personName || '').trim();
      if (!normalizedPersonName) {
        return res.status(400).json({ message: 'Select the person who made this reimbursement.' });
      }

      matchedMember = transaction.splitMembers.find(
        (member) => member.name.toLowerCase() === normalizedPersonName.toLowerCase(),
      );
      if (!matchedMember) {
        return res.status(400).json({ message: 'Selected person is not part of this split expense.' });
      }

      const memberOutstanding = Math.max(
        0,
        roundCurrency(matchedMember.amount - (matchedMember.reimbursedAmount || 0)),
      );
      if (reimburseVal > memberOutstanding + 0.01) {
        return res.status(400).json({
          message: `${matchedMember.name} can reimburse at most ₹${memberOutstanding.toFixed(2)}.`,
        });
      }
    }

    const reimburseDate = date || new Date().toISOString().split('T')[0];

    if (matchedMember) {
      matchedMember.reimbursedAmount = roundCurrency(
        (matchedMember.reimbursedAmount || 0) + reimburseVal,
      );
      if (matchedMember.reimbursedAmount >= matchedMember.amount - 0.01) {
        matchedMember.isFullyReimbursed = true;
      }
    }

    // Push entry into parent split transaction's history
    transaction.reimbursements.push({
      personName: personName || '',
      amount: reimburseVal,
      date: reimburseDate,
      notes: notes || ''
    });

    const newTotalReimbursed = roundCurrency(currentReimbursed + reimburseVal);
    transaction.reimbursedAmount = newTotalReimbursed;

    if (newTotalReimbursed >= recoverable - 0.01) {
      transaction.reimbursementStatus = 'Completed';
    } else if (newTotalReimbursed > 0) {
      transaction.reimbursementStatus = 'Partial';
    } else {
      transaction.reimbursementStatus = 'Pending';
    }

    await transaction.save();

    // Create shadow Reimbursement transaction
    const personSuffix = personName ? ` (from ${personName})` : '';
    const reimburseDescription = `Reimbursement: ${transaction.description}${personSuffix}`;
    const shadowTx = new Transaction({
      userId: req.user.id,
      date: reimburseDate,
      description: reimburseDescription,
      category: 'Reimbursement',
      type: 'Reimbursement',
      paymentMode: paymentMode || transaction.paymentMode || 'UPI',
      bank: bank || transaction.bank || 'Cash / Wallet',
      amount: reimburseVal,
      notes: notes || `Reimbursed for split expense: ${transaction.description}`,
      isSplit: false
    });
    await shadowTx.save();

    res.json({ transaction, reimbursementEntry: shadowTx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.recordReimbursements = async (req, res) => {
  try {
    const { id } = req.params;
    const entries = Array.isArray(req.body.reimbursements) ? req.body.reimbursements : [];
    const transaction = await Transaction.findById(id);

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    if (!transaction.isSplit || !transaction.splitMembers?.length) {
      return res.status(400).json({ message: 'This split has no per-person members to settle.' });
    }
    if (!entries.length) {
      return res.status(400).json({ message: 'Add at least one reimbursement.' });
    }

    const recoverable = roundCurrency(transaction.recoverableAmount || 0);
    const alreadyReimbursed = roundCurrency(transaction.reimbursedAmount || 0);
    const outstanding = Math.max(0, recoverable - alreadyReimbursed);
    const projected = new Map(
      transaction.splitMembers.map((member) => [member.name.toLowerCase(), member.reimbursedAmount || 0]),
    );
    const normalizedEntries = [];
    let total = 0;

    for (const entry of entries) {
      const personName = String(entry.personName || '').trim();
      const member = transaction.splitMembers.find(
        (item) => item.name.toLowerCase() === personName.toLowerCase(),
      );
      const amount = roundCurrency(entry.amount);
      if (!member) return res.status(400).json({ message: 'Every reimbursement must name a split member.' });
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Reimbursement amounts must be greater than 0.' });
      }

      const key = member.name.toLowerCase();
      const memberReimbursed = roundCurrency((projected.get(key) || 0) + amount);
      const memberOutstanding = roundCurrency(member.amount - (projected.get(key) || 0));
      if (amount > memberOutstanding + 0.01) {
        return res.status(400).json({ message: `${member.name} can reimburse at most ₹${memberOutstanding.toFixed(2)}.` });
      }
      projected.set(key, memberReimbursed);
      total = roundCurrency(total + amount);
      normalizedEntries.push({
        personName: member.name,
        amount,
        date: entry.date || new Date().toISOString().split('T')[0],
        notes: entry.notes || '',
        bank: entry.bank,
        paymentMode: entry.paymentMode,
      });
    }

    if (total > outstanding + 0.01) {
      return res.status(400).json({ message: `Reimbursements cannot exceed ₹${outstanding.toFixed(2)} outstanding.` });
    }

    for (const entry of normalizedEntries) {
      const member = transaction.splitMembers.find(
        (item) => item.name.toLowerCase() === entry.personName.toLowerCase(),
      );
      member.reimbursedAmount = roundCurrency((member.reimbursedAmount || 0) + entry.amount);
      member.isFullyReimbursed = member.reimbursedAmount >= member.amount - 0.01;
      transaction.reimbursements.push({
        personName: entry.personName,
        amount: entry.amount,
        date: entry.date,
        notes: entry.notes,
      });
    }

    const newTotalReimbursed = roundCurrency(alreadyReimbursed + total);
    transaction.reimbursedAmount = newTotalReimbursed;
    transaction.reimbursementStatus = newTotalReimbursed >= recoverable - 0.01 ? 'Completed' : 'Partial';
    await transaction.save();

    const reimbursementEntries = await Promise.all(normalizedEntries.map((entry) =>
      new Transaction({
        userId: req.user.id,
        date: entry.date,
        description: `Reimbursement: ${transaction.description} (from ${entry.personName})`,
        category: 'Reimbursement',
        type: 'Reimbursement',
        paymentMode: entry.paymentMode || transaction.paymentMode || 'UPI',
        bank: entry.bank || transaction.bank || 'Cash / Wallet',
        amount: entry.amount,
        notes: entry.notes || `Reimbursed for split expense: ${transaction.description}`,
        isSplit: false,
      }).save(),
    ));

    res.json({ transaction, reimbursementEntries });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    await migrateTransactions(allTransactions);
    
    const transactions = allTransactions.filter(t => {
      return t.date && t.date.startsWith(yearMonth);
    });

    const income = transactions.filter(t => t.type === 'income' || t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense' || t.type === 'Need' || t.type === 'Want').reduce((acc, curr) => acc + (curr.isSplit && curr.myShare != null ? curr.myShare : curr.amount), 0);

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
