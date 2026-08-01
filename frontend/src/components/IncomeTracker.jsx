import { useState, useMemo } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { getLocalDateString, formatDateDisplay } from '../utils/dateUtils';

// Returns YYYY-MM key for a date string
const getMonthKey = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Formats a YYYY-MM key to a label like "August 2026"
const formatMonthLabel = (key) => {
  if (!key) return '';
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Returns today's YYYY-MM
const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const IncomeTracker = ({ transactions, settings, fetchTransactions }) => {
  const [filterBank, setFilterBank] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Income',
    type: 'Income',
    bank: settings?.banks?.[0]?.name || '',
    paymentMode: settings?.banks?.[0]?.services?.[0] || '',
    date: getLocalDateString()
  });

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
      const defaultBank = settings?.banks?.[0];
      setFormData({
        description: '',
        amount: '',
        category: 'Income',
        type: 'Income',
        bank: defaultBank?.name || '',
        paymentMode: defaultBank?.services?.[0] || '',
        date: formData.date
      });
      alert('Income added!');
    } catch (err) {
      console.error('Error adding income:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.delete(`${API_BASE_URL}/api/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting income:', err);
    }
  };

  // All income transactions
  const incomeTransactions = transactions.filter(t => t.type === 'Income');

  // Available months derived from income entries
  const availableMonths = useMemo(() => {
    const keys = new Set(incomeTransactions.map(t => getMonthKey(t.date)).filter(Boolean));
    const sorted = Array.from(keys).sort((a, b) => b.localeCompare(a));
    const cur = getCurrentMonthKey();
    if (!keys.has(cur)) sorted.unshift(cur);
    return sorted;
  }, [incomeTransactions]);

  // Filtered by selected month + bank, sorted newest first
  const filteredIncome = useMemo(() => {
    return incomeTransactions
      .filter(t => {
        const matchMonth = getMonthKey(t.date) === selectedMonth;
        const matchBank = filterBank === 'All' || (t.bank || '').toLowerCase() === filterBank.toLowerCase();
        return matchMonth && matchBank;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [incomeTransactions, selectedMonth, filterBank]);

  const totalInflow = filteredIncome.reduce((acc, curr) => acc + curr.amount, 0);

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
        <h2>Income Tracker</h2>
        <p>Log all your credited amounts (salary, freelance, gifts, etc).</p>
      </header>

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
              <label>Source / Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="e.g. Monthly Salary, Upwork Client"
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
              <label>Bank / Wallet</label>
              <select name="bank" value={formData.bank} onChange={handleChange} required>
                {settings.banks && settings.banks.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Payment Mode (Service)</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} required>
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
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button type="submit" className="btn-success" style={{ maxWidth: '240px' }}>
              Add Income
            </button>
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
            <h3 style={{ margin: 0 }}>Income Log</h3>
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

        {/* Summary pill */}
        {filteredIncome.length > 0 && (
          <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              borderLeft: '3px solid #22c55e',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Credited: </span>
              <strong style={{ color: '#22c55e' }}>
                +₹{totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--primary-color)',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{filteredIncome.length} entries</span>
            </div>
          </div>
        )}

        {/* Income table */}
        {filteredIncome.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No income logged for {formatMonthLabel(selectedMonth)}.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '560px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Bank</th>
                  <th>Payment Mode</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncome.map(t => (
                  <tr key={t._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDateDisplay(t.date)}</td>
                    <td>{t.description}</td>
                    <td className="amount income">₹{t.amount.toFixed(2)}</td>
                    <td style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{t.bank || ''}</td>
                    <td style={{ color: '#3b82f6' }}>{t.paymentMode}</td>
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

export default IncomeTracker;
