import { useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { getLocalDateString, formatDateDisplay } from '../utils/dateUtils';

const IncomeTracker = ({ transactions, settings, fetchTransactions }) => {
  const [filterBank, setFilterBank] = useState('All');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Income',
    type: 'Income',
    bank: settings?.banks?.[0]?.name || 'Cash / Wallet',
    paymentMode: settings?.banks?.[0]?.services?.[0] || 'Cash',
    date: getLocalDateString()
  });

  const handleBankChange = (bankName) => {
    const bankObj = settings?.banks?.find(b => b.name === bankName);
    if (bankObj) {
      const currentPM = formData.paymentMode;
      const supportsCurrentPM = bankObj.services.includes(currentPM);
      const newPM = supportsCurrentPM ? currentPM : (bankObj.services[0] || '');
      setFormData(prev => ({
        ...prev,
        bank: bankName,
        paymentMode: newPM
      }));
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
        bank: defaultBank?.name || 'Cash / Wallet',
        paymentMode: defaultBank?.services?.[0] || 'Cash',
        date: getLocalDateString()
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

  // Filter transactions to only show Income
  const incomeTransactions = transactions.filter(t => t.type === 'Income');

  const filteredIncome = incomeTransactions.filter(t => {
    if (filterBank === 'All') return true;
    const tBank = t.bank || 'Cash / Wallet';
    return tBank.toLowerCase() === filterBank.toLowerCase();
  });

  const totalInflow = filteredIncome.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Income Tracker</h2>
        <p>Log all your credited amounts (salary, freelance, gifts, etc).</p>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Source / Description</label>
              <input type="text" name="description" value={formData.description} onChange={handleChange} required placeholder="e.g. Monthly Salary, Upwork Client" />
            </div>
            <div className="form-group flex-1">
              <label>Amount</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Bank / Wallet</label>
              <select name="bank" value={formData.bank} onChange={handleChange} required>
                {settings.banks && settings.banks.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
                {(!settings.banks || settings.banks.length === 0) && (
                  <option value="Cash / Wallet">Cash / Wallet</option>
                )}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Payment Mode (Service)</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} required>
                {(() => {
                  const selectedBankName = formData.bank || settings?.banks?.[0]?.name || 'Cash / Wallet';
                  const selectedBankObj = settings?.banks?.find(b => b.name === selectedBankName);
                  const supportedServices = selectedBankObj ? selectedBankObj.services : ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Cash'];
                  return supportedServices.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ));
                })()}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--success)' }}>Add Income</button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Income Log</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter by Account:</label>
            <select 
              value={filterBank} 
              onChange={(e) => setFilterBank(e.target.value)}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border)', 
                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Accounts</option>
              {settings.banks && settings.banks.map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
              {(!settings.banks || settings.banks.length === 0) && (
                <option value="Cash / Wallet">Cash / Wallet</option>
              )}
            </select>
          </div>
        </div>

        {filterBank !== 'All' && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Filtered Account: <strong style={{ color: 'var(--text-main)' }}>{filterBank}</strong></span>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
              Total Credited Inflow: ₹{totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
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
                  <td className="amount income">
                    ₹{t.amount.toFixed(2)}
                  </td>
                  <td style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{t.bank || 'Cash / Wallet'}</td>
                  <td style={{ color: '#3b82f6' }}>{t.paymentMode}</td>
                  <td>
                    <button type="button" className="delete-btn" onClick={() => handleDelete(t._id)} style={{ padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredIncome.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No income logged for this account.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncomeTracker;
