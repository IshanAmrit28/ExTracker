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
  let isString = typeof timeInput === 'string';
  let originalStr = isString ? timeInput : '';

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

  console.log(`[Timezone Check] Analyzing given time: "${date.toISOString()}"`);
  
  let isIST = false;
  
  // 1. Check if the string representation has an explicit IST indicator
  if (originalStr) {
    const normalized = originalStr.toLowerCase();
    if (
      normalized.includes('+05:30') || 
      normalized.includes('+0530') || 
      normalized.includes('ist') || 
      normalized.includes('asia/kolkata')
    ) {
      isIST = true;
    }
  }
  
  // 2. Check the system's timezone offset.
  // IST offset relative to UTC is -330 minutes (UTC+5:30).
  const offset = date.getTimezoneOffset();
  if (offset === -330) {
    isIST = true;
  }
  
  if (isIST) {
    console.log(`[Timezone Check] SUCCESS: The given time is ALREADY in Indian Standard Time (IST).`);
    return date;
  } else {
    console.log(`[Timezone Check] NOTICE: The given time is NOT in IST. Converting to IST...`);
    
    // Convert to IST:
    // To represent the exact local time in IST timezone when running on any system timezone,
    // we shift the date object by adding the appropriate timezone offset difference.
    const utcTimestamp = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istTimestamp = utcTimestamp + (330 * 60000); // Add 5 hours and 30 minutes in ms
    
    const convertedDate = new Date(istTimestamp);
    
    console.log(`[Timezone Check] CONVERTED: Original time: ${date.toISOString()} -> Converted IST representation: ${convertedDate.toISOString()}`);
    return convertedDate;
  }
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
          await generateAndSendReportForUser(user, true, referenceDate);
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
