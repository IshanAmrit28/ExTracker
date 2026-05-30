import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Download, Mail, AlertCircle, FileText, CheckCircle, Eye, ArrowLeft } from 'lucide-react';

const ReportsAndDiagnostics = ({ transactions, settings, user }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [emailStatus, setEmailStatus] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    if (years.size === 0) years.add(new Date().getFullYear());
    const arr = Array.from(years);
    if (!arr.includes(new Date().getFullYear())) arr.push(new Date().getFullYear());
    return arr.sort((a, b) => b - a);
  }, [transactions]);

  // Group transactions and build reports list
  const { reportsList, transactionsByPeriod } = useMemo(() => {
    const weekly = {};
    const monthly = {};
    const txByPeriod = { weekly: {}, monthly: {} };

    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date.getFullYear() !== selectedYear) return;
      // Week formatting: YYYY-Www
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const weekKey = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      
      // Month formatting: YYYY-MM
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      // Initialize if not exists
      if (!weekly[weekKey]) {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        weekly[weekKey] = { income: 0, expense: 0, balance: 0, startOfWeek, endOfWeek };
      }
      if (!monthly[monthKey]) monthly[monthKey] = { income: 0, expense: 0, balance: 0 };
      if (!txByPeriod.weekly[weekKey]) txByPeriod.weekly[weekKey] = [];
      if (!txByPeriod.monthly[monthKey]) txByPeriod.monthly[monthKey] = [];

      const amount = Number(t.amount);
      if (t.type.toLowerCase() === 'income') {
        weekly[weekKey].income += amount;
        monthly[monthKey].income += amount;
        weekly[weekKey].balance += amount;
        monthly[monthKey].balance += amount;
      } else {
        weekly[weekKey].expense += amount;
        monthly[monthKey].expense += amount;
        weekly[weekKey].balance -= amount;
        monthly[monthKey].balance -= amount;
      }

      txByPeriod.weekly[weekKey].push(t);
      txByPeriod.monthly[monthKey].push(t);
    });

    const list = [
      ...Object.entries(monthly).map(([month, data]) => {
        const [y, m] = month.split('-');
        const d = new Date(y, parseInt(m) - 1);
        const mName = d.toLocaleString('default', { month: 'long' });
        return {
          id: `monthly-${month}`,
          type: 'Monthly',
          title: `Monthly Report - ${mName} ${y}`,
          periodKey: month,
          data
        };
      }),
      ...Object.entries(weekly).map(([week, data]) => {
        const startStr = data.startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        const endStr = data.endOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
        return {
          id: `weekly-${week}`,
          type: 'Weekly',
          title: `Weekly Report (${startStr} - ${endStr})`,
          periodKey: week,
          data
        };
      })
    ];

    // Sort descending by period key
    list.sort((a, b) => b.periodKey.localeCompare(a.periodKey));

    return { reportsList: list, transactionsByPeriod: txByPeriod };
  }, [transactions, selectedYear]);

  const getGroupedTxs = (txs) => {
    const groupedTxs = {};
    txs.forEach(t => {
      const bank = t.bank || '';
      if (!groupedTxs[bank]) groupedTxs[bank] = { txs: [], income: 0, expense: 0, balance: 0 };
      groupedTxs[bank].txs.push(t);
      if (t.type.toLowerCase() === 'income') {
        groupedTxs[bank].income += t.amount;
        groupedTxs[bank].balance += t.amount;
      } else {
        groupedTxs[bank].expense += t.amount;
        groupedTxs[bank].balance -= t.amount;
      }
    });
    return groupedTxs;
  };

  const generateCSV = (report) => {
    let csv = 'Date,Description,Category,Method,Bank,Type,Amount\n';
    const txs = report.type === 'Monthly' 
      ? transactionsByPeriod.monthly[report.periodKey] 
      : transactionsByPeriod.weekly[report.periodKey];
      
    txs.forEach(t => {
      csv += `${t.date.split('T')[0]},"${t.description}","${t.category}","${t.paymentMode || '-'}","${t.bank || '-'}",${t.type},${t.amount}\n`;
    });
    return csv;
  };

  const handleDownload = (report) => {
    const csv = generateCSV(report);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = (report) => {
    if (!window.jspdf) {
      alert("PDF library is still loading, please try again in a moment.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const cur = settings?.currency || '₹';
    
    doc.setFontSize(20);
    doc.text(report.title, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Income: ${cur}${report.data.income.toFixed(2)}`, 14, 32);
    doc.text(`Expense: ${cur}${report.data.expense.toFixed(2)}`, 14, 38);
    doc.text(`Balance: ${cur}${report.data.balance.toFixed(2)}`, 14, 44);

    const txs = report.type === 'Monthly' 
      ? transactionsByPeriod.monthly[report.periodKey] 
      : transactionsByPeriod.weekly[report.periodKey];

    const grouped = getGroupedTxs(txs);
    let startY = 50;
    
    doc.setFontSize(14);
    doc.text("Bank-wise Account Breakdown", 14, startY);
    startY += 6;
    
    const breakdownCols = ["BANK / WALLET", "CREDITED (+)", "DEBITED (-)", "END BAL"];
    const breakdownRows = Object.keys(grouped).map(bank => {
      const b = grouped[bank];
      return [
        bank, 
        `+${cur}${b.income.toFixed(2)}`, 
        `-${cur}${b.expense.toFixed(2)}`, 
        `${cur}${b.balance.toFixed(2)}`
      ];
    });
    
    doc.autoTable({
      startY: startY,
      head: [breakdownCols],
      body: breakdownRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 40, 40] }
    });
    
    startY = doc.lastAutoTable.finalY + 15;

    Object.keys(grouped).forEach(bank => {
      doc.setFontSize(12);
      doc.setTextColor(249, 115, 22);
      doc.text(`${bank.toUpperCase()} TRANSACTIONS`, 14, startY);
      doc.setTextColor(0, 0, 0);
      startY += 6;
      
      const bTxs = grouped[bank].txs;
      const bRows = bTxs.map(t => {
        const amountStr = `${t.type.toLowerCase() === 'income' ? '+' : '-'}${cur}${t.amount.toFixed(2)}`;
        return [t.date.split('T')[0], t.description, t.paymentMode || '-', t.category, amountStr];
      });

      doc.autoTable({
        startY: startY,
        head: [["DATE", "DESCRIPTION", "METHOD", "CATEGORY", "AMOUNT"]],
        body: bRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [60, 60, 60] },
      });
      startY = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`${report.title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleEmail = async (report) => {
    setLoadingEmail(true);
    setEmailStatus('');
    try {
      const txs = report.type === 'Monthly' 
        ? transactionsByPeriod.monthly[report.periodKey] 
        : transactionsByPeriod.weekly[report.periodKey];

      let html = `<h2>${report.title}</h2>`;
      html += `<h3>Summary</h3><p>Income: ${settings?.currency || '₹'}${report.data.income.toFixed(2)}<br/>`;
      html += `Expense: ${settings?.currency || '₹'}${report.data.expense.toFixed(2)}<br/>`;
      html += `Balance: ${settings?.currency || '₹'}${report.data.balance.toFixed(2)}</p>`;
      
      const cur = settings?.currency || '₹';
      html += `<h3>Bank-wise Account Breakdown</h3><table border="1" cellpadding="5" cellspacing="0" width="100%"><tr><th align="left">BANK / WALLET</th><th align="left">CREDITED (+)</th><th align="left">DEBITED (-)</th><th align="right">END BAL</th></tr>`;
      const grouped = getGroupedTxs(txs);
      Object.keys(grouped).forEach(bank => {
        const b = grouped[bank];
        html += `<tr><td>${bank}</td><td style="color:green">+${cur}${b.income.toFixed(2)}</td><td style="color:red">-${cur}${b.expense.toFixed(2)}</td><td align="right"><strong>${cur}${b.balance.toFixed(2)}</strong></td></tr>`;
      });
      html += '</table><br/>';

      Object.keys(grouped).forEach(bank => {
        html += `<h3 style="color: #f97316; text-transform: uppercase;">${bank} TRANSACTIONS</h3>`;
        html += `<table border="1" cellpadding="5" cellspacing="0" width="100%"><tr><th align="left">DATE</th><th align="left">DESCRIPTION</th><th align="left">METHOD</th><th align="left">CATEGORY</th><th align="right">AMOUNT</th></tr>`;
        grouped[bank].txs.forEach(t => {
          html += `<tr><td>${t.date.split('T')[0]}</td><td>${t.description}</td><td>${t.paymentMode || '-'}</td><td>${t.category}</td><td align="right" style="color:${t.type.toLowerCase() === 'income'?'green':'red'}">${t.type.toLowerCase() === 'income' ? '+' : '-'}${cur}${t.amount.toFixed(2)}</td></tr>`;
        });
        html += '</table><br/>';
      });

      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${API_BASE_URL}/api/reports/email`, {
        reportHtml: html,
        subject: `Finance Report: ${report.title}`
      });
      setEmailStatus('success');
    } catch (err) {
      console.error(err);
      setEmailStatus('error');
    } finally {
      setLoadingEmail(false);
    }
  };

  if (selectedReport) {
    const txs = selectedReport.type === 'Monthly' 
      ? transactionsByPeriod.monthly[selectedReport.periodKey] 
      : transactionsByPeriod.weekly[selectedReport.periodKey];
    const groupedTxsObj = getGroupedTxs(txs);

    return (
      <div className="dashboard-container">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => { setSelectedReport(null); setEmailStatus(''); }} style={{ padding: '0.5rem', width: 'auto', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedReport.title}</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => handleDownload(selectedReport)} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
              <Download size={18} /> Download CSV
            </button>
            <button className="btn-secondary" onClick={() => handleDownloadPDF(selectedReport)} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
              <Download size={18} /> Download PDF
            </button>
            
            <div style={{ position: 'relative' }}>
              <button 
                className={`btn-primary ${!user?.isPremium ? 'disabled' : ''}`} 
                onClick={() => handleEmail(selectedReport)}
                disabled={!user?.isPremium || loadingEmail}
                style={{ opacity: !user?.isPremium ? 0.6 : 1, width: 'auto', padding: '0.75rem 1.5rem' }}
              >
                <Mail size={18} /> {loadingEmail ? 'Sending...' : 'Email Report'}
              </button>
              {!user?.isPremium && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                  <AlertCircle size={14} /> Premium Feature
                </div>
              )}
            </div>
          </div>
        </div>

        {emailStatus === 'success' && (
          <div className="card" style={{ marginBottom: '2rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
              <CheckCircle size={20} />
              <strong>Report sent successfully to {user?.email}!</strong>
            </div>
          </div>
        )}

        {emailStatus === 'error' && (
          <div className="card" style={{ marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
              <AlertCircle size={20} />
              <strong>Failed to send email. Please try again later.</strong>
            </div>
          </div>
        )}

        <div className="stats-grid" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Income</h3>
            <p style={{ color: 'var(--success)', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {settings?.currency || '₹'}{selectedReport.data.income.toFixed(2)}
            </p>
          </div>
          <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Expense</h3>
            <p style={{ color: 'var(--danger)', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {settings?.currency || '₹'}{selectedReport.data.expense.toFixed(2)}
            </p>
          </div>
          <div className="stat-card" style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Net Balance</h3>
            <p style={{ color: selectedReport.data.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {selectedReport.data.balance >= 0 ? '+' : ''}{settings?.currency || '₹'}{selectedReport.data.balance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Bank-wise Account Breakdown</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>BANK / WALLET</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>CREDITED (+)</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>DEBITED (-)</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)', textAlign: 'right' }}>END BAL</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedTxsObj).map(bank => {
                  const b = groupedTxsObj[bank];
                  return (
                    <tr key={bank} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 0' }}>{bank}</td>
                      <td style={{ padding: '0.75rem 0', color: 'var(--success)' }}>+{settings?.currency || '₹'}{b.income.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0', color: 'var(--danger)' }}>-{settings?.currency || '₹'}{b.expense.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold' }}>{settings?.currency || '₹'}{b.balance.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {Object.keys(groupedTxsObj).map(bank => {
          const bTxs = groupedTxsObj[bank].txs;
          return (
            <div key={bank} className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', textTransform: 'uppercase' }}>{bank} TRANSACTIONS</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>DATE</th>
                      <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>DESCRIPTION</th>
                      <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>METHOD</th>
                      <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>CATEGORY</th>
                      <th style={{ padding: '0.75rem 0', color: 'var(--text-muted)', textAlign: 'right' }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bTxs.map(t => (
                      <tr key={t._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0' }}>{t.date.split('T')[0]}</td>
                        <td style={{ padding: '0.75rem 0' }}>{t.description}</td>
                        <td style={{ padding: '0.75rem 0' }}>{t.paymentMode || '-'}</td>
                        <td style={{ padding: '0.75rem 0' }}>{t.category}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right', color: t.type.toLowerCase() === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                          {t.type.toLowerCase() === 'income' ? '+' : '-'}{settings?.currency || '₹'}{t.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
        {txs.length === 0 && (
          <div className="card">
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found for this period.</p>
          </div>
        )}
      </div>
    );
  }

  const renderReportsTable = (reports, title) => (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginBottom: 0, padding: '1rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary-color)', flexShrink: 0 }}>
        <FileText size={18} />
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h2>
      </div>
      
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Report Name</th>
              <th style={{ padding: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Period</th>
              <th style={{ padding: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Balance</th>
              <th style={{ padding: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem 0', fontWeight: '500', fontSize: '0.9rem' }}>{report.title}</td>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{report.periodKey}</td>
                <td style={{ padding: '0.5rem 0', color: report.data.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>
                  {report.data.balance >= 0 ? '+' : ''}{settings?.currency || '₹'}{report.data.balance.toFixed(2)}
                </td>
                <td style={{ padding: '0.5rem 0' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setSelectedReport(report)}
                    style={{ padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', width: 'auto' }}
                  >
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                  <p>No reports available yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
      <div className="dashboard-header" style={{ flexShrink: 0, marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, marginBottom: '0.25rem' }}>Reports & Diagnostics</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>View and download your past financial reports.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', flexShrink: 0 }}>
        {availableYears.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={selectedYear === year ? 'btn-primary' : 'btn-secondary'}
            style={{ width: 'auto', padding: '0.4rem 1.5rem', ...(selectedYear !== year ? { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' } : {}) }}
          >
            {year}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, paddingBottom: '1rem' }}>
        {renderReportsTable(reportsList.filter(r => r.type === 'Monthly'), 'Monthly Reports')}
        {renderReportsTable(reportsList.filter(r => r.type === 'Weekly'), 'Weekly Reports')}
      </div>
    </div>
  );
};

export default ReportsAndDiagnostics;
