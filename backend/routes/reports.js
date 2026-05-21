const express = require('express');
const router = express.Router();
const { Resend } = require('resend');
const auth = require('../middleware/auth');
const User = require('../models/User');

const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/email', auth, async (req, res) => {
  try {
    const { reportHtml, subject } = req.body;
    
    // Fetch user from DB to check premium status
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isPremium) return res.status(403).json({ message: 'Email reports are a premium feature' });

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Finance Tracker <onboarding@resend.dev>',
      to: [user.email],
      subject: subject || 'Your Finance Tracker Report',
      html: reportHtml || '<p>Here is your report.</p>'
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ message: 'Failed to send email', error });
    }

    res.status(200).json({ message: 'Email sent successfully', data });
  } catch (err) {
    console.error('Email Route Error:', err);
    res.status(500).json({ message: 'Server error while sending email' });
  }
});

module.exports = router;
