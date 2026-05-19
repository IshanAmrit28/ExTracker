const Settings = require('../models/Settings');
const User = require('../models/User');
const { generateAndSendReportForUser, generateAndSendMonthlyReportForUser } = require('../utils/cronJobs');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = new Settings({ userId: req.user.id });
      await settings.save();
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
