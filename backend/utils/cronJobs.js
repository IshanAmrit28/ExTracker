const cron = require('node-cron');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateWeeklyReportPDF } = require('./reportGenerator');
const { sendReportEmail } = require('./emailService');

const getISTComponents = (date) => {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
  const components = {};
  parts.forEach(part => {
    components[part.type] = part.value;
  });
  return {
    year: Number(components.year),
    month: Number(components.month) - 1, // 0-indexed like JS Date
    day: Number(components.day),
    hour: Number(components.hour),
    minute: Number(components.minute),
    second: Number(components.second)
  };
};

const formatLocalDate = (date) => {
  const { year, month, day } = getISTComponents(date);
  const yyyy = year;
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


const generateAndSendReportForUser = async (user, isAutomatic = false, referenceDate = null) => {
  try {
    const allTransactions = await Transaction.find({ userId: user._id });
    
    const endOfReport = referenceDate ? new Date(referenceDate) : new Date();
    
    // Monday to Sunday, or Monday to Today based on IST
    const getMondayOfCurrentWeek = (refDate) => {
      const istComp = getISTComponents(refDate);
      const d = new Date(Date.UTC(istComp.year, istComp.month, istComp.day, 0, 0, 0, 0));
      const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      
      const mondayUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0));
      const yyyy = mondayUTC.getUTCFullYear();
      const mm = String(mondayUTC.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(mondayUTC.getUTCDate()).padStart(2, '0');
      
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00+05:30`);
    };

    const startOfReport = getMondayOfCurrentWeek(endOfReport);
    
    const startStr = formatLocalDate(startOfReport);
    const endStr = formatLocalDate(endOfReport);
    
    let preIncome = 0;
    let preExpense = 0;
    
    allTransactions.forEach(t => {
      if (t.date < startStr) {
        if (t.type === 'Income') {
          preIncome += t.amount;
        } else if (['Need', 'Want', 'expense'].includes(t.type)) {
          preExpense += t.amount;
        }
      }
    });
    
    const startBalance = preIncome - preExpense;
    
    let weeklyIncome = 0;
    let weeklyNeed = 0;
    let weeklyWant = 0;
    let weeklySaving = 0;
    let weeklyOtherExpense = 0;
    const weeklyList = [];
    
    allTransactions.forEach(t => {
      if (t.date >= startStr && t.date <= endStr) {
        weeklyList.push(t);
        if (t.type === 'Income') {
          weeklyIncome += t.amount;
        } else if (t.type === 'Need') {
          weeklyNeed += t.amount;
        } else if (t.type === 'Want') {
          weeklyWant += t.amount;
        } else if (t.type === 'Saving') {
          weeklySaving += t.amount;
        } else if (t.type === 'expense') {
          weeklyOtherExpense += t.amount;
        }
      }
    });
    
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne({ userId: user._id });
    const userBanks = settings?.banks && settings.banks.length > 0
      ? settings.banks
      : [
          { name: 'Cash / Wallet', services: ['Cash'] },
          { name: 'HDFC Bank', services: ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer'] }
        ];

    const bankSummaries = userBanks.map(bank => {
      let bankPreIncome = 0;
      let bankPreExpense = 0;
      let bankWeeklyIncome = 0;
      let bankWeeklySpent = 0;
      
      allTransactions.forEach(t => {
        const tBank = t.bank || 'Cash / Wallet';
        const isCurrentBank = tBank.toLowerCase() === bank.name.toLowerCase();
        
        if (isCurrentBank) {
          if (t.date < startStr) {
            if (t.type === 'Income') {
              bankPreIncome += t.amount;
            } else if (['Need', 'Want', 'expense'].includes(t.type)) {
              bankPreExpense += t.amount;
            }
          } else if (t.date >= startStr && t.date <= endStr) {
            if (t.type === 'Income') {
              bankWeeklyIncome += t.amount;
            } else if (['Need', 'Want', 'expense'].includes(t.type)) {
              bankWeeklySpent += t.amount;
            }
          }
        }
      });
      
      const bankStartBalance = bankPreIncome - bankPreExpense;
      const bankEndBalance = bankStartBalance + bankWeeklyIncome - bankWeeklySpent;
      
      return {
        name: bank.name,
        startBalance: bankStartBalance,
        weeklyIncome: bankWeeklyIncome,
        weeklySpent: bankWeeklySpent,
        endBalance: bankEndBalance
      };
    });

    const weeklySpent = weeklyNeed + weeklyWant + weeklyOtherExpense;
    const endBalance = startBalance + weeklyIncome - weeklySpent;
    
    const emailData = {
      startStr,
      endStr,
      startBalance,
      endBalance,
      weeklyIncome,
      weeklySpent,
      weeklyNeed,
      weeklyWant,
      weeklySaving,
      weeklyOtherExpense,
      weeklyList,
      bankSummaries
    };
    
    const pdfBuffer = await generateWeeklyReportPDF(emailData);
    await sendReportEmail(user, emailData, pdfBuffer);
    console.log(`Weekly report sent successfully to ${user.email}`);
  } catch (err) {
    console.error(`Error generating/sending report for user ${user.email}:`, err.message);
    throw err;
  }
};

const generateAndSendMonthlyReportForUser = async (user, isAutomatic = false, referenceDate = null) => {
  try {
    const allTransactions = await Transaction.find({ userId: user._id });
    
    let startOfReport;
    let endOfReport = referenceDate ? new Date(referenceDate) : new Date();
    
    if (isAutomatic) {
      const istComp = getISTComponents(endOfReport);
      const currentIST = new Date(Date.UTC(istComp.year, istComp.month, 1));
      currentIST.setUTCMonth(currentIST.getUTCMonth() - 1);
      
      const prevYear = currentIST.getUTCFullYear();
      const prevMonth = currentIST.getUTCMonth();
      
      startOfReport = new Date(`${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01T00:00:00+05:30`);
      
      const lastDay = new Date(Date.UTC(prevYear, prevMonth + 1, 0)).getUTCDate();
      endOfReport = new Date(`${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59+05:30`);
    } else {
      const istComp = getISTComponents(endOfReport);
      const year = istComp.year;
      const month = istComp.month;
      startOfReport = new Date(`${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00+05:30`);
    }
    
    const startStr = formatLocalDate(startOfReport);
    const endStr = formatLocalDate(endOfReport);
    
    let preIncome = 0;
    let preExpense = 0;
    
    allTransactions.forEach(t => {
      if (t.date < startStr) {
        if (t.type === 'Income') {
          preIncome += t.amount;
        } else if (['Need', 'Want', 'expense'].includes(t.type)) {
          preExpense += t.amount;
        }
      }
    });
    
    const startBalance = preIncome - preExpense;
    
    let weeklyIncome = 0;
    let weeklyNeed = 0;
    let weeklyWant = 0;
    let weeklySaving = 0;
    let weeklyOtherExpense = 0;
    const weeklyList = [];
    
    allTransactions.forEach(t => {
      if (t.date >= startStr && t.date <= endStr) {
        weeklyList.push(t);
        if (t.type === 'Income') {
          weeklyIncome += t.amount;
        } else if (t.type === 'Need') {
          weeklyNeed += t.amount;
        } else if (t.type === 'Want') {
          weeklyWant += t.amount;
        } else if (t.type === 'Saving') {
          weeklySaving += t.amount;
        } else if (t.type === 'expense') {
          weeklyOtherExpense += t.amount;
        }
      }
    });
    
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne({ userId: user._id });
    const userBanks = settings?.banks && settings.banks.length > 0
      ? settings.banks
      : [
          { name: 'Cash / Wallet', services: ['Cash'] },
          { name: 'HDFC Bank', services: ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer'] }
        ];

    const bankSummaries = userBanks.map(bank => {
      let bankPreIncome = 0;
      let bankPreExpense = 0;
      let bankWeeklyIncome = 0;
      let bankWeeklySpent = 0;
      
      allTransactions.forEach(t => {
        const tBank = t.bank || 'Cash / Wallet';
        const isCurrentBank = tBank.toLowerCase() === bank.name.toLowerCase();
        
        if (isCurrentBank) {
          if (t.date < startStr) {
            if (t.type === 'Income') {
              bankPreIncome += t.amount;
            } else if (['Need', 'Want', 'expense'].includes(t.type)) {
              bankPreExpense += t.amount;
            }
          } else if (t.date >= startStr && t.date <= endStr) {
            if (t.type === 'Income') {
              bankWeeklyIncome += t.amount;
            } else if (['Need', 'Want', 'expense'].includes(t.type)) {
              bankWeeklySpent += t.amount;
            }
          }
        }
      });
      
      const bankStartBalance = bankPreIncome - bankPreExpense;
      const bankEndBalance = bankStartBalance + bankWeeklyIncome - bankWeeklySpent;
      
      return {
        name: bank.name,
        startBalance: bankStartBalance,
        weeklyIncome: bankWeeklyIncome,
        weeklySpent: bankWeeklySpent,
        endBalance: bankEndBalance
      };
    });

    const weeklySpent = weeklyNeed + weeklyWant + weeklyOtherExpense;
    const endBalance = startBalance + weeklyIncome - weeklySpent;
    
    const emailData = {
      startStr,
      endStr,
      startBalance,
      endBalance,
      weeklyIncome,
      weeklySpent,
      weeklyNeed,
      weeklyWant,
      weeklySaving,
      weeklyOtherExpense,
      weeklyList,
      bankSummaries
    };
    
    const pdfBuffer = await generateWeeklyReportPDF(emailData, 'Monthly');
    await sendReportEmail(user, emailData, pdfBuffer, 'Monthly');
    console.log(`Monthly report sent successfully to ${user.email}`);
  } catch (err) {
    console.error(`Error generating/sending monthly report for user ${user.email}:`, err.message);
    throw err;
  }
};

const initCronJobs = () => {
  // Schedule to run every Sunday night at 23:59 (11:59 PM) IST
  cron.schedule('59 23 * * 0', async () => {
    console.log('Running scheduled weekly financial report cron job...');
    try {
      // Calculate a safe reference date that falls securely on Sunday, 
      // preventing a slight execution delay from rolling over to Monday 
      // and causing a 1-day (Monday-to-Monday) report bug.
      const safeDateForSunday = new Date(Date.now() - 2 * 60 * 60 * 1000); // -2 hours
      const users = await User.find({});
      for (const user of users) {
        await generateAndSendReportForUser(user, true, safeDateForSunday);
      }
    } catch (err) {
      console.error('Error running weekly report cron job:', err);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Schedule to run monthly on the 1st of every month at 00:00 (12:00 AM) IST
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running scheduled monthly financial report cron job...');
    try {
      // A safe reference date in case of early/late clock drift around midnight.
      // Since we want this to represent the 1st of the month, adding 2 hours is safe.
      const safeDateFor1st = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2 hours
      const users = await User.find({});
      for (const user of users) {
        await generateAndSendMonthlyReportForUser(user, true, safeDateFor1st);
      }
    } catch (err) {
      console.error('Error running monthly report cron job:', err);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });
};

module.exports = {
  initCronJobs,
  generateAndSendReportForUser,
  generateAndSendMonthlyReportForUser
};
