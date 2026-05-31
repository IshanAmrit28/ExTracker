const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const { generateAndSendReportForUser, generateAndSendMonthlyReportForUser } = require('../utils/cronJobs');

// Robust helper to extract IST Components
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

const checkAndConvertToIST = (timeInput) => {
  let date;
  if (!timeInput) {
    date = new Date();
  } else if (timeInput instanceof Date) {
    date = timeInput;
  } else {
    date = new Date(timeInput);
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date/time provided: ${timeInput}`);
  }

  // A JavaScript Date object internally tracks time as milliseconds since the Unix Epoch (UTC).
  // Timezones only apply when parsing strings or formatting outputs (like Intl.DateTimeFormat).
  // We do not need to manually add/subtract offset milliseconds, because getISTComponents 
  // uses Intl.DateTimeFormat with 'Asia/Kolkata', which correctly calculates the IST time 
  // from the universal Date object.
  return date;
};

const run = async () => {
  // Parse command line arguments
  // Example arguments: --time "2026-05-19T21:46:35+05:30" --type weekly
  const args = process.argv.slice(2);
  let customTimeArg = '';
  let reportTypeArg = 'auto'; // Default to 'auto' (checks IST day/date to run weekly/monthly)

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--time' && args[i + 1]) {
      customTimeArg = args[i + 1];
    }
    if (args[i] === '--type' && args[i + 1]) {
      reportTypeArg = args[i + 1].toLowerCase();
    }
  }

  // Fallback to environment variables if arguments not present
  const timeInput = customTimeArg || process.env.GIVEN_TIME || '';
  const reportType = reportTypeArg || process.env.REPORT_TYPE || 'auto';

  console.log(`=== Automated Report Email System Starting ===`);
  console.log(`Report Type requested: "${reportType}"`);

  // Check and convert timezone to IST
  let referenceDate;
  try {
    referenceDate = checkAndConvertToIST(timeInput);
  } catch (err) {
    console.error(`Error parsing given time:`, err.message);
    process.exit(1);
  }

  // Get IST components for scheduler decisions
  const istComponents = getISTComponents(referenceDate);
  console.log(`Current IST Reference Time: ${referenceDate.toISOString()}`);
  console.log(`IST Details -> Year: ${istComponents.year}, Month: ${istComponents.month + 1}, Day: ${istComponents.day}, Hour: ${istComponents.hour}, Minute: ${istComponents.minute}`);

  // Create a proper IST-based Date object for UTC date-based week evaluations
  const istDateObjectForDay = new Date(Date.UTC(istComponents.year, istComponents.month, istComponents.day, 0, 0, 0, 0));
  const dayOfWeek = istDateObjectForDay.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = istComponents.day;

  let shouldRunWeekly = false;
  let shouldRunMonthly = false;

  if (reportType === 'weekly') {
    shouldRunWeekly = true;
  } else if (reportType === 'monthly') {
    shouldRunMonthly = true;
  } else if (reportType === 'both') {
    shouldRunWeekly = true;
    shouldRunMonthly = true;
  } else if (reportType === 'auto') {
    console.log(`[Auto Scheduler] Checking if current time matches scheduled IST execution...`);
    // Weekly reports are scheduled for Sunday 23:59 IST or Monday 00:00 IST.
    // If the workflow runs daily at Monday 00:00 IST (which is Sunday 18:30 UTC), dayOfWeek will be 1 (Monday).
    if (dayOfWeek === 1) {
      console.log(`[Auto Scheduler] Today is Monday in IST (Day of week = 1). Triggering Weekly Reports.`);
      shouldRunWeekly = true;
    } else {
      console.log(`[Auto Scheduler] Day of week in IST is ${dayOfWeek}. Weekly reports not scheduled for today.`);
    }

    // Monthly reports run on the 1st of every month at 00:00 IST.
    if (dayOfMonth === 1) {
      console.log(`[Auto Scheduler] Today is the 1st day of the month in IST. Triggering Monthly Reports.`);
      shouldRunMonthly = true;
    } else {
      console.log(`[Auto Scheduler] Day of month in IST is ${dayOfMonth}. Monthly reports not scheduled for today.`);
    }
  }

  if (!shouldRunWeekly && !shouldRunMonthly) {
    console.log(`[Auto Scheduler] No reports scheduled to run at this reference time. Exiting.`);
    process.exit(0);
  }

  // Connect to Database
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error(`Error: MONGO_URI is not set in environment variables!`);
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  try {
    await mongoose.connect(mongoUri);
    console.log(`Successfully connected to MongoDB.`);
  } catch (err) {
    console.error(`MongoDB connection error:`, err.message);
    process.exit(1);
  }

  try {
    console.log(`Fetching active users...`);
    const users = await User.find({});
    console.log(`Found ${users.length} user(s). Starting report processing...`);

    for (const user of users) {
      console.log(`--------------------------------------------------`);
      console.log(`Processing reports for user: ${user.email} (ID: ${user._id})`);

      if (shouldRunWeekly) {
        console.log(`Generating & sending Weekly Report...`);
        try {
          // If auto-triggered early Monday morning IST, shift the reference date back 12 hours 
          // so it strictly falls on the intended Sunday, preventing a Monday-to-Monday report.
          const weeklyTargetDate = new Date(referenceDate.getTime() - 12 * 60 * 60 * 1000);
          await generateAndSendReportForUser(user, true, weeklyTargetDate);
        } catch (err) {
          console.error(`Failed to send weekly report for ${user.email}:`, err.message);
        }
      }

      if (shouldRunMonthly) {
        console.log(`Generating & sending Monthly Report...`);
        try {
          await generateAndSendMonthlyReportForUser(user, true, referenceDate);
        } catch (err) {
          console.error(`Failed to send monthly report for ${user.email}:`, err.message);
        }
      }
    }

    console.log(`==================================================`);
    console.log(`All scheduled report processing has completed successfully.`);
  } catch (err) {
    console.error(`Error during processing:`, err.message);
  } finally {
    console.log(`Closing MongoDB connection...`);
    await mongoose.disconnect();
    console.log(`MongoDB connection closed.`);
    console.log(`=== Automated Report Email System Finished ===`);
  }
};

run();
