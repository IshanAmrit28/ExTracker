const { Resend } = require('resend');

exports.sendReportEmail = async (user, emailData, pdfBuffer, reportType = 'Weekly') => {
  const { startStr, endStr } = emailData;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not defined in the backend environment variables. Please check the backend .env file.');
  }

  const resend = new Resend(apiKey);
  
  // Resend free tier only allows sending from onboarding@resend.dev
  const fromEmail = 'onboarding@resend.dev';
  
  try {
    await resend.emails.send({
      from: `FinanceTracker <${fromEmail}>`,
      to: user.email,
      subject: `${reportType} Financial Insights: ${startStr} to ${endStr}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 25px;">
            <h2 style="color: #f97316; margin: 0; font-size: 24px; font-weight: 800;">FinanceTracker</h2>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Your ${reportType} Financial Report</p>
          </div>
          
          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 0;">Hi,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Here is your report for the ${reportType.toLowerCase() === 'weekly' ? 'week' : 'month'}.</p>
          
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 20px 0 25px 0;">All details of your starting and ending balances, income, expenditure categories, and bank-wise transaction breakdowns have been compiled securely inside the attached PDF to protect your privacy.</p>
 
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">
              <strong>Note:</strong> Since we are running on Resend's developer testing tier, reports will be emailed to your authenticated user account address. Ensure your email is registered in your developer dashboard.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            Best regards,<br>
            <strong>FinanceTracker System</strong>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${reportType}-Financial-Report-${endStr}.pdf`,
          content: pdfBuffer,
        }
      ]
    });
  } catch (err) {
    console.error('Resend API Call Error:', err.message);
    throw err;
  }
};
