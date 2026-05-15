import { useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const IncomeTracker = ({ transactions, settings, fetchTransactions }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Income',
    type: 'Income',
    paymentMode: settings?.paymentModes?.[0] || 'Bank Transfer',
    date: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${API_BASE_URL}/api/transactions`, formData);
      fetchTransactions();
      setFormData({
        description: '',
        amount: '',
        category: 'Income',
        type: 'Income',
        paymentMode: settings?.paymentModes?.[0] || 'Bank Transfer',
        date: new Date().toISOString().split('T')[0]
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
              <label>Credited To (Account)</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                {settings.paymentModes.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--success)' }}>Add Income</button>
        </form>
      </div>

      <div className="card">
        <h3>Income Log</h3>
        <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Credited To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incomeTransactions.map(t => (
                <tr key={t._id}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.description}</td>
                  <td className="amount income">
                    ₹{t.amount.toFixed(2)}
                  </td>
                  <td style={{ color: '#3b82f6' }}>{t.paymentMode}</td>
                  <td>
                    <button type="button" className="delete-btn" onClick={() => handleDelete(t._id)} style={{ padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {incomeTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>No income logged yet.</td>
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
