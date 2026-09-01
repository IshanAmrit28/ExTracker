const Settings = require('../models/Settings');
const User = require('../models/User');
const { generateAndSendReportForUser, generateAndSendMonthlyReportForUser } = require('../utils/cronJobs');

const defaultCategories = [
  { name: 'Bills & Utilities' },
  { name: 'Entertainment' },
  { name: 'Essentials' },
  { name: 'Food & Dining' },
  { name: 'Groceries' },
  { name: 'Health' },
  { name: 'Rent' },
  { name: 'Shopping' },
  { name: 'Transport' },
  { name: 'Savings & Investments' }
];

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = new Settings({ userId: req.user.id });
      await settings.save();
    } else {
      // Check if user has old categories like 'Life Infrastructure' or 'Future Me'
      const hasOld = settings.categories.some(c => 
        c.name === 'Life Infrastructure' || 
        c.name === 'Future Me' || 
        c.name === 'Performance & Growth' || 
        c.name === 'Relationships & Generosity' || 
        c.name === 'Lifestyle Enjoyment'
      );
      if (hasOld) {
        settings.categories = defaultCategories;
        await settings.save();
      }
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = new Settings({ ...req.body, userId: req.user.id });
    } else {
      Object.assign(settings, req.body);
    }
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.sendWeeklyReport = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!process.env.RESEND_API_KEY) {
      return res.status(400).json({ 
        message: 'Resend API key is not configured in the backend environment. Please configure RESEND_API_KEY in backend/.env' 
      });
    }

    await generateAndSendReportForUser(user);
    res.json({ message: 'Weekly report sent to your email successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMonthlyReport = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!process.env.RESEND_API_KEY) {
      return res.status(400).json({ 
        message: 'Resend API key is not configured in the backend environment. Please configure RESEND_API_KEY in backend/.env' 
      });
    }

    await generateAndSendMonthlyReportForUser(user);
    res.json({ message: 'Monthly report sent to your email successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.startMonth = async (req, res) => {
  try {
    const { month, initialBalance, bankBalances } = req.body;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) {
      return res.status(400).json({ message: 'Provide a valid month in YYYY-MM format.' });
    }

    const submittedBankBalances = Array.isArray(bankBalances) ? bankBalances : [];
    const normalizedBankBalances = submittedBankBalances.map((entry) => ({
      bank: String(entry.bank || '').trim(),
      balance: Number(entry.balance)
    }));
    if (normalizedBankBalances.some((entry) => !entry.bank || !Number.isFinite(entry.balance))) {
      return res.status(400).json({ message: 'Provide a valid opening balance for every bank.' });
    }
    const balance = normalizedBankBalances.reduce((total, entry) => total + entry.balance, 0);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!process.env.RESEND_API_KEY) {
      return res.status(400).json({ message: 'RESEND_API_KEY is not configured in the backend environment.' });
    }

    // Passing the first day of the selected month with automatic mode makes
    // the report generator target the complete previous calendar month.
    const reportReferenceDate = new Date(`${month}-01T12:00:00+05:30`);
    await generateAndSendMonthlyReportForUser(user, true, reportReferenceDate);

    let settings = await Settings.findOne({ userId: req.user.id });
    if (!settings) settings = new Settings({ userId: req.user.id });
    const openingBalances = settings.monthlyOpeningBalances || [];
    const existing = openingBalances.find((entry) => entry.month === month);
    if (existing) {
      existing.balance = balance;
      existing.bankBalances = normalizedBankBalances;
    } else {
      openingBalances.push({ month, balance, bankBalances: normalizedBankBalances });
    }
    settings.monthlyOpeningBalances = openingBalances;
    await settings.save();

    res.json({ message: `Previous month's report sent and ${month} started successfully.`, month, initialBalance: balance, bankBalances: normalizedBankBalances });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
