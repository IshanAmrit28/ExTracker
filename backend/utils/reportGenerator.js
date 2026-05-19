const PDFDocument = require('pdfkit');

exports.generateWeeklyReportPDF = (data, reportType = 'Weekly') => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const { startStr, endStr, startBalance, endBalance, weeklyIncome, weeklySpent, weeklyNeed, weeklyWant, weeklySaving, weeklyOtherExpense, weeklyList, bankSummaries } = data;

      // Header Banner
      doc.rect(0, 0, doc.page.width, 110).fillColor('#0f172a').fill();
      
      // Header Brand
      doc.fillColor('#f97316').fontSize(26).text('FinanceTracker', 50, 30, { stroke: false });
      doc.fillColor('#94a3b8').fontSize(11).text(`${reportType} Performance & Detailed Audit Report`, 50, 62);
      
      // Date Range Indicator
      doc.rect(380, 35, 170, 40).fillColor('rgba(249, 115, 22, 0.15)').fill();
      doc.fillColor('#f97316').fontSize(9).text('REPORTING PERIOD', 390, 43, { width: 150 });
      doc.fillColor('#ffffff').fontSize(10).text(`${startStr} to ${endStr}`, 390, 56, { width: 150 });

      // Reset fill color for core content
      doc.fillColor('#1e293b');

      // Section 1: Financial Snapshot
      doc.fontSize(16).text(`${reportType} Financial Summary`, 50, 140);
      
      // Summary cards grid layout
      // Card 1: Starting Balance
      doc.rect(50, 165, 240, 60).fillColor('#f8fafc').fill();
      doc.rect(50, 165, 240, 60).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fillColor('#64748b').fontSize(9).text(`STARTING ${reportType.toUpperCase()} BALANCE`, 62, 175);
      doc.fillColor('#0f172a').fontSize(14).text(`INR ${startBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 62, 192);

      // Card 2: Ending Balance
      doc.rect(310, 165, 240, 60).fillColor('#f8fafc').fill();
      doc.rect(310, 165, 240, 60).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fillColor('#64748b').fontSize(9).text(`ENDING ${reportType.toUpperCase()} BALANCE`, 322, 175);
      doc.fillColor('#f97316').fontSize(14).text(`INR ${endBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 322, 192);

      // Card 3: Weekly Income (Credited)
      doc.rect(50, 240, 240, 60).fillColor('#f8fafc').fill();
      doc.rect(50, 240, 240, 60).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fillColor('#64748b').fontSize(9).text(`${reportType.toUpperCase()} INCOME (CREDITED)`, 62, 250);
      doc.fillColor('#22c55e').fontSize(14).text(`+INR ${weeklyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 62, 267);

      // Card 4: Weekly Spent (Debited)
      doc.rect(310, 240, 240, 60).fillColor('#f8fafc').fill();
      doc.rect(310, 240, 240, 60).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fillColor('#64748b').fontSize(9).text(`${reportType.toUpperCase()} SPENT (DEBITED)`, 322, 250);
      doc.fillColor('#ef4444').fontSize(14).text(`-INR ${weeklySpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 322, 267);

      // Section 2: Budget Breakdown
      doc.fillColor('#1e293b').fontSize(16).text('Category-wise Spending Breakdown', 50, 325);
      doc.fontSize(9).fillColor('#64748b').text('Monitors how your spending is distributed across categories vs. total spent', 50, 345);
      
      const categories = [
        { label: 'Needs (Core Utilities & Infrastructure)', amount: weeklyNeed, color: '#f59e0b' },
        { label: 'Wants (Lifestyle Enjoyment & Generosity)', amount: weeklyWant, color: '#ef4444' },
        { label: 'Savings (Future Investments & Goals)', amount: weeklySaving, color: '#10b981' },
        { label: 'Others (Uncategorized Outflow)', amount: weeklyOtherExpense, color: '#3b82f6' }
      ];

      let catY = 370;
      categories.forEach(cat => {
        doc.fillColor('#334155').fontSize(10).text(cat.label, 50, catY);
        doc.fillColor('#0f172a').fontSize(10).text(`INR ${cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 400, catY, { align: 'right', width: 150 });
        
        // Draw progress bar track
        doc.rect(50, catY + 16, 500, 6).fillColor('#f1f5f9').fill();
        
        // Calculate and draw filled bar
        const totalOutflow = weeklySpent + weeklySaving;
        const ratio = totalOutflow > 0 ? (cat.amount / totalOutflow) : 0;
        const fillWidth = Math.min(500, ratio * 500);
        if (fillWidth > 0) {
          doc.rect(50, catY + 16, fillWidth, 6).fillColor(cat.color).fill();
        }
        
        catY += 38;
      });

      // Section 3: Bank-wise Performance Summary
      doc.fillColor('#1e293b').fontSize(14).text('Bank-wise Account Breakdown', 50, catY + 10);
      
      let bankY = catY + 30;
      // Draw small header
      doc.fillColor('#475569').fontSize(8).text('BANK / WALLET', 50, bankY);
      doc.text('START BAL', 220, bankY, { align: 'right', width: 70 });
      doc.text('CREDITED (+)', 300, bankY, { align: 'right', width: 70 });
      doc.text('DEBITED (-)', 380, bankY, { align: 'right', width: 70 });
      doc.text('END BAL', 460, bankY, { align: 'right', width: 90 });
      
      doc.moveTo(50, bankY + 11).lineTo(550, bankY + 11).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
      bankY += 18;

      if (bankSummaries && bankSummaries.length > 0) {
        bankSummaries.forEach(bs => {
          doc.fillColor('#334155').fontSize(9).text(bs.name, 50, bankY);
          
          doc.fillColor('#475569').text(`INR ${bs.startBalance.toLocaleString(undefined, { minimumFractionDigits: 1 })}`, 220, bankY, { align: 'right', width: 70 });
          
          doc.fillColor('#22c55e').text(`+INR ${bs.weeklyIncome.toLocaleString(undefined, { minimumFractionDigits: 1 })}`, 300, bankY, { align: 'right', width: 70 });
          
          doc.fillColor('#ef4444').text(`-INR ${bs.weeklySpent.toLocaleString(undefined, { minimumFractionDigits: 1 })}`, 380, bankY, { align: 'right', width: 70 });
          
          const isPositive = bs.endBalance >= 0;
          doc.fillColor(isPositive ? '#0f172a' : '#ef4444').text(`INR ${bs.endBalance.toLocaleString(undefined, { minimumFractionDigits: 1 })}`, 460, bankY, { align: 'right', width: 90 });
          
          doc.moveTo(50, bankY + 11).lineTo(550, bankY + 11).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
          bankY += 16;
        });
      } else {
        doc.fillColor('#94a3b8').fontSize(9).text('No active bank account logs.', 50, bankY + 5, { align: 'center', width: 500 });
      }

      // Page 2: Detailed Transaction Log
      doc.addPage();
      
      // Page 2 Header Banner
      doc.rect(0, 0, doc.page.width, 60).fillColor('#0f172a').fill();
      doc.fillColor('#ffffff').fontSize(14).text('Detailed Transaction Logs', 50, 22);

      // Group weeklyList by bank
      const groupedTx = {};
      weeklyList.forEach(t => {
        const bankName = t.bank || 'Cash / Wallet';
        if (!groupedTx[bankName]) {
          groupedTx[bankName] = [];
        }
        groupedTx[bankName].push(t);
      });

      let tableY = 90;
      
      const drawGroupHeaderAndTableHeader = (bankName) => {
        // Section Header
        doc.fillColor('#f97316').fontSize(11).text(`${bankName.toUpperCase()} TRANSACTIONS`, 50, tableY, { underline: true });
        tableY += 18;
        
        // Table Header Columns
        doc.fillColor('#475569').fontSize(8).text('DATE', 50, tableY);
        doc.text('DESCRIPTION', 110, tableY);
        doc.text('METHOD', 240, tableY);
        doc.text('CATEGORY', 350, tableY);
        doc.text('AMOUNT', 470, tableY, { align: 'right', width: 80 });

        doc.moveTo(50, tableY + 11).lineTo(550, tableY + 11).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
        tableY += 20;
      };

      const bankNames = Object.keys(groupedTx);
      if (bankNames.length === 0) {
        doc.fillColor('#94a3b8').fontSize(11).text('No transactions recorded during this period.', 50, tableY + 20, { align: 'center', width: 500 });
      } else {
        bankNames.forEach((bankName, gIdx) => {
          // If we are starting a new group and tableY is already deep, push to a new page
          if (tableY > 600) {
            doc.addPage();
            // Page Header Banner
            doc.rect(0, 0, doc.page.width, 60).fillColor('#0f172a').fill();
            doc.fillColor('#ffffff').fontSize(14).text('Detailed Transaction Logs (Continued)', 50, 22);
            tableY = 90;
          } else if (gIdx > 0) {
            // Add a small spacer between bank groups
            tableY += 15;
          }

          drawGroupHeaderAndTableHeader(bankName);

          groupedTx[bankName].forEach((t) => {
            // Handle page overflow inside group loop
            if (tableY > 700) {
              doc.addPage();
              // Page Header Banner
              doc.rect(0, 0, doc.page.width, 60).fillColor('#0f172a').fill();
              doc.fillColor('#ffffff').fontSize(14).text('Detailed Transaction Logs (Continued)', 50, 22);
              tableY = 90;
              drawGroupHeaderAndTableHeader(bankName);
            }

            const datePart = t.date.split('T')[0];
            doc.fillColor('#334155').fontSize(9).text(datePart, 50, tableY);
            
            const desc = t.description.length > 20 ? t.description.substring(0, 17) + '...' : t.description;
            doc.text(desc, 110, tableY);
            
            const methodVal = t.paymentMode || 'Cash';
            const methodValTrunc = methodVal.length > 18 ? methodVal.substring(0, 15) + '...' : methodVal;
            doc.fillColor('#475569').text(methodValTrunc, 240, tableY);
            
            doc.fillColor('#334155').text(t.category, 350, tableY);
            
            const prefix = (t.type === 'Income' || t.type === 'income') ? '+' : '-';
            const typeColor = (t.type === 'Income' || t.type === 'income') ? '#22c55e' : t.type === 'Saving' ? '#10b981' : '#ef4444';
            doc.fillColor(typeColor).text(`${prefix}INR ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 470, tableY, { align: 'right', width: 80 });

            // Row Separator Line
            doc.moveTo(50, tableY + 11).lineTo(550, tableY + 11).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
            tableY += 18;
          });
        });
      }

      // Footer notice
      doc.fillColor('#94a3b8').fontSize(8).text('Generated automatically by FinanceTracker. Stay financially smart.', 50, 740, { align: 'center', width: 500 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
