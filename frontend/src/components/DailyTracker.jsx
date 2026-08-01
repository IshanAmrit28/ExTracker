import { useState, useMemo } from 'react';
import axios from 'axios';
import { Trash2, Info, Gauge, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { getLocalDateString, formatDateDisplay } from '../utils/dateUtils';

// Returns YYYY-MM key for a transaction date string
const getMonthKey = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// Formats a YYYY-MM key to a human-readable label like "August 2026"
const formatMonthLabel = (key) => {
  if (!key) return '';
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Returns today's YYYY-MM
const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const DailyTracker = ({ transactions, settings, fetchTransactions }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [filterBank, setFilterBank] = useState('All');

  // Month selector — defaults to the current month
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: settings?.categories?.[0]?.name || '',
    type: 'Need',
    bank: settings?.banks?.[0]?.name || '',
    paymentMode: settings?.banks?.[0]?.services?.[0] || '',
    date: getLocalDateString()
  });

  // Compute unique sorted months (descending) from all transactions
  const availableMonths = useMemo(() => {
    const keys = new Set(transactions.map(t => getMonthKey(t.date)).filter(Boolean));
    const sorted = Array.from(keys).sort((a, b) => b.localeCompare(a));
    // Always ensure current month is an option even if no transactions yet
    const cur = getCurrentMonthKey();
    if (!keys.has(cur)) sorted.unshift(cur);
    return sorted;
  }, [transactions]);

  const handleBankChange = (bankName) => {
    const bankObj = settings?.banks?.find(b => b.name === bankName);
    if (bankObj) {
      const currentPM = formData.paymentMode;
      const supportsCurrentPM = bankObj.services.includes(currentPM);
      const newPM = supportsCurrentPM ? currentPM : (bankObj.services[0] || '');
      setFormData(prev => ({ ...prev, bank: bankName, paymentMode: newPM }));
    } else {
      setFormData(prev => ({ ...prev, bank: bankName }));
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'bank') {
      handleBankChange(e.target.value);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${API_BASE_URL}/api/transactions`, formData);
      fetchTransactions();
      const defaultCat = settings?.categories?.[0];
      const defaultBank = settings?.banks?.[0];
      setFormData({
        description: '',
        amount: '',
        category: defaultCat?.name || '',
        type: 'Need',
        bank: defaultBank?.name || '',
        paymentMode: defaultBank?.services?.[0] || '',
        date: formData.date
      });
      alert('Transaction added!');
    } catch (err) {
      console.error('Error adding transaction:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.delete(`${API_BASE_URL}/api/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  // Transactions filtered by selected month AND selected bank, sorted newest first
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchMonth = getMonthKey(t.date) === selectedMonth;
        const matchBank = filterBank === 'All' || (t.bank || '').toLowerCase() === filterBank.toLowerCase();
        return matchMonth && matchBank;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, selectedMonth, filterBank]);

  const totalOutflow = filteredTransactions
    .filter(t => ['Need', 'Want', 'expense'].includes(t.type))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalInflow = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // ── Smart Daily Budget ──────────────────────────────────────────────────────
  const monthlyLimit = settings?.monthlyLimit || 0;
  const smartBudget = useMemo(() => {
    if (!monthlyLimit) return null;

    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const todayStr = getLocalDateString(); // YYYY-MM-DD local
    const currentMonthKey = getCurrentMonthKey();

    // All expense transactions in the current calendar month (not filtered month, always live)
    const thisMonthExpenses = transactions.filter(t => {
      const isExpense = ['Need', 'Want', 'expense'].includes(t.type);
      const inCurMonth = getMonthKey(t.date) === currentMonthKey;
      return isExpense && inCurMonth;
    });

    const totalSpentThisMonth = thisMonthExpenses.reduce((s, t) => s + t.amount, 0);

    // Spending today only
    const spentToday = thisMonthExpenses
      .filter(t => {
        const d = new Date(t.date);
        const localDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return localDate === todayStr;
      })
      .reduce((s, t) => s + t.amount, 0);

    const originalDailyLimit = monthlyLimit / daysInMonth;
    const remainingBudget = monthlyLimit - totalSpentThisMonth;          // remaining AFTER today's spend
    const daysAfterToday = daysInMonth - dayOfMonth;                     // days remaining NOT including today
    const adjustedForTomorrow = daysAfterToday > 0
      ? remainingBudget / daysAfterToday
      : 0;

    const todayOverage = spentToday - originalDailyLimit;                // positive = over limit
    const monthPct = Math.min(100, (totalSpentThisMonth / monthlyLimit) * 100);

    let status = 'ok';         // green — within today's limit
    if (todayOverage > 0) status = 'warning';   // orange — exceeded today
    if (remainingBudget <= 0) status = 'danger'; // red   — monthly limit blown

    return {
      originalDailyLimit,
      spentToday,
      todayOverage,
      totalSpentThisMonth,
      remainingBudget,
      adjustedForTomorrow,
      daysAfterToday,
      monthPct,
      daysInMonth,
      dayOfMonth,
      status,
    };
  }, [transactions, monthlyLimit, settings]);
  // ─────────────────────────────────────────────────────────────────────────────

  const selectStyle = {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--text-main)',
    fontSize: '0.85rem',
    cursor: 'pointer'
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Daily Expense Tracker</h2>
        <p>Log your daily activities. Choose your category, type, and bank account details.</p>
      </header>

      {/* ── Smart Daily Budget Widget ── */}
      {smartBudget && (() => {
        const sb = smartBudget;
        const statusColor = sb.status === 'ok' ? '#22c55e' : sb.status === 'warning' ? '#f97316' : '#ef4444';
        const statusBg   = sb.status === 'ok' ? 'rgba(34,197,94,0.08)' : sb.status === 'warning' ? 'rgba(249,115,22,0.08)' : 'rgba(239,68,68,0.08)';
        
        const StatusIcon = sb.status === 'ok' ? CheckCircle2 : sb.status === 'warning' ? AlertTriangle : AlertOctagon;
        const statusText = sb.status === 'ok' ? 'On Track' : sb.status === 'warning' ? 'Daily Limit Exceeded' : 'Monthly Limit Reached';

        return (
          <div className="card" style={{ marginBottom: '1.5rem', border: `1px solid ${statusColor}40`, background: statusBg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Gauge size={18} color="var(--primary-color)" /> Smart Daily Budget
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Day {sb.dayOfMonth} of {sb.daysInMonth} &mdash; {sb.daysAfterToday} day{sb.daysAfterToday !== 1 ? 's' : ''} remaining after today
                </p>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', backgroundColor: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}55`, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <StatusIcon size={14} color={statusColor} /> {statusText}
              </span>
            </div>

            {/* Progress bar — monthly spend vs limit */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <span>Monthly spend</span>
                <span style={{ color: sb.monthPct >= 90 ? '#ef4444' : 'var(--text-muted)' }}>
                  ₹{Math.round(sb.totalSpentThisMonth).toLocaleString()} / ₹{monthlyLimit.toLocaleString()} ({Math.round(sb.monthPct)}%)
                </span>
              </div>
              <div style={{ height: '7px', borderRadius: '4px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${sb.monthPct}%`,
                  borderRadius: '4px',
                  background: sb.monthPct >= 100 ? '#ef4444' : sb.monthPct >= 80 ? '#f97316' : '#22c55e',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {/* Today's original limit */}
              <div style={{ padding: '0.7rem 0.9rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Base Daily Limit</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{Math.round(sb.originalDailyLimit).toLocaleString()}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>₹{monthlyLimit.toLocaleString()} ÷ {sb.daysInMonth}d</div>
              </div>

              {/* Spent today */}
              <div style={{ padding: '0.7rem 0.9rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${sb.todayOverage > 0 ? '#f9731640' : 'var(--border)'}` }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Spent Today</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: sb.spentToday > sb.originalDailyLimit ? '#ef4444' : '#22c55e' }}>
                  ₹{Math.round(sb.spentToday).toLocaleString()}
                </div>
                {sb.todayOverage > 0
                  ? <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>+₹{Math.round(sb.todayOverage).toLocaleString()} over limit</div>
                  : <div style={{ fontSize: '0.7rem', color: '#22c55e' }}>₹{Math.round(sb.originalDailyLimit - sb.spentToday).toLocaleString()} remaining</div>
                }
              </div>

              {/* Adjusted limit for remaining days */}
              <div style={{ padding: '0.7rem 0.9rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${sb.adjustedForTomorrow < sb.originalDailyLimit * 0.7 ? '#ef444440' : 'var(--border)'}` }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Adjusted / Remaining Day</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: sb.remainingBudget <= 0 ? '#ef4444' : sb.adjustedForTomorrow < sb.originalDailyLimit * 0.7 ? '#f97316' : '#22c55e' }}>
                  {sb.daysAfterToday > 0 ? `₹${Math.round(sb.adjustedForTomorrow).toLocaleString()}` : '—'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {sb.daysAfterToday > 0 ? `for next ${sb.daysAfterToday} day${sb.daysAfterToday !== 1 ? 's' : ''}` : 'Last day of month'}
                </div>
              </div>

              {/* Remaining monthly budget */}
              <div style={{ padding: '0.7rem 0.9rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${sb.remainingBudget < 0 ? '#ef444440' : 'var(--border)'}` }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Monthly Balance</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: sb.remainingBudget < 0 ? '#ef4444' : '#22c55e' }}>
                  {sb.remainingBudget >= 0 ? '₹' : '-₹'}{Math.abs(Math.round(sb.remainingBudget)).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>left this month</div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ paddingBottom: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div className="form-group flex-1">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="e.g. Swiggy dinner"
              />
            </div>
            <div className="form-group flex-1">
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Category
                <Info
                  size={16}
                  style={{ cursor: 'pointer', color: 'var(--primary-color)' }}
                  onClick={() => setShowInfo(!showInfo)}
                  title="Click for category guide"
                />
              </label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                {settings.categories.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Bank / Wallet</label>
              <select name="bank" value={formData.bank} onChange={handleChange} required>
                {settings.banks && settings.banks.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                {(() => {
                  const selectedBankName = formData.bank || settings?.banks?.[0]?.name || '';
                  const selectedBankObj = settings?.banks?.find(b => b.name === selectedBankName);
                  const supportedServices = selectedBankObj
                    ? selectedBankObj.services
                    : (settings?.paymentModes || ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Cash']);
                  return supportedServices.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ));
                })()}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                <option value="Need">Need</option>
                <option value="Want">Want</option>
                <option value="Saving">Saving</option>
              </select>
            </div>
          </div>

          {showInfo && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)', fontSize: '0.95rem' }}>
                Category & Budget Guide
              </h4>
              <ul style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                listStyle: 'none',
                padding: 0
              }}>
                <li><strong>Need:</strong> Critical expenses (e.g. Rent, Groceries, Bills & Utilities, Health, Transport).</li>
                <li><strong>Want:</strong> Lifestyle spending (e.g. Entertainment, Food & Dining, Shopping).</li>
                <li><strong>Saving:</strong> Future investments (e.g. Savings & Investments).</li>
              </ul>
            </div>
          )}

          <div style={{ marginTop: '1.25rem' }}>
            <button type="submit" className="btn-primary" style={{ maxWidth: '240px' }}>Add Transaction</button>
          </div>
        </form>
      </div>

      <div className="card">
        {/* Header row: title + month selector + account filter */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Transactions Log</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              — {formatMonthLabel(selectedMonth)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Month selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={selectStyle}
              >
                {availableMonths.map(mk => (
                  <option key={mk} value={mk}>
                    {formatMonthLabel(mk)}{mk === getCurrentMonthKey() ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Account filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Account:</label>
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                style={selectStyle}
              >
                <option value="All">All Accounts</option>
                {settings.banks && settings.banks.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary pills for selected month */}
        {filteredTransactions.length > 0 && (
          <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderLeft: '3px solid #ef4444',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Outflow: </span>
              <strong style={{ color: '#ef4444' }}>
                -₹{totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
            {totalInflow > 0 && (
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                borderLeft: '3px solid #22c55e',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Inflow: </span>
                <strong style={{ color: '#22c55e' }}>
                  +₹{totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
              </div>
            )}
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--primary-color)',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{filteredTransactions.length} transactions</span>
            </div>
          </div>
        )}

        {/* Transaction table */}
        {filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No transactions found for {formatMonthLabel(selectedMonth)}.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '560px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Bank</th>
                  <th>Payment Mode</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => (
                  <tr key={t._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDateDisplay(t.date)}</td>
                    <td>{t.description}</td>
                    <td>{t.category}</td>
                    <td className={`amount ${['Need', 'Want', 'expense'].includes(t.type) ? 'expense' : t.type === 'Saving' ? 'saving' : 'income'}`}>
                      ₹{t.amount.toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{t.bank || ''}</td>
                    <td style={{ color: '#3b82f6' }}>{t.paymentMode}</td>
                    <td><span className={`badge-type ${t.type.toLowerCase()}`}>{t.type}</span></td>
                    <td>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(t._id)}
                        style={{ padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTracker;
