import { useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const DailyTracker = ({ transactions, settings, fetchTransactions }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: settings?.categories?.[0]?.name || '',
    type: settings?.categories?.[0]?.type || 'Need',
    paymentMode: settings?.categories?.[0]?.paymentMode || '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleCategoryChange = (catName) => {
    const catObj = settings.categories.find(c => c.name === catName);
    if (catObj) {
      setFormData(prev => ({
        ...prev,
        category: catName,
        type: catObj.type,
        paymentMode: catObj.paymentMode
      }));
    } else {
      setFormData(prev => ({ ...prev, category: catName }));
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'category') {
      handleCategoryChange(e.target.value);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/transactions', formData);
      fetchTransactions();
      const defaultCat = settings?.categories?.[0];
      setFormData({
        description: '',
        amount: '',
        category: defaultCat?.name || '',
        type: defaultCat?.type || 'Need',
        paymentMode: defaultCat?.paymentMode || '',
        date: new Date().toISOString().split('T')[0]
      });
      alert('Transaction added!');
    } catch (err) {
      console.error('Error adding transaction:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Daily Expense Tracker</h2>
        <p>Log your daily activities. Types are automatically mapped.</p>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Description</label>
              <input type="text" name="description" value={formData.description} onChange={handleChange} required placeholder="e.g. Swiggy dinner" />
            </div>
            <div className="form-group flex-1">
              <label>Amount</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0.01" step="0.01" />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                {settings.categories.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
                <option value="Income">Income / Salary</option>
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                {settings.paymentModes.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Type (Auto-mapped)</label>
              <select name="type" value={formData.type} onChange={handleChange} disabled>
                <option value="Need">Need</option>
                <option value="Want">Want</option>
                <option value="Saving">Saving</option>
                <option value="Income">Income</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">Add Transaction</button>
        </form>
      </div>

      <div className="card">
        <h3>Transactions Log</h3>
        <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.description}</td>
                  <td>{t.category}</td>
                  <td className={`amount ${['Need', 'Want', 'expense'].includes(t.type) ? 'expense' : t.type === 'Saving' ? 'saving' : 'income'}`}>
                    ₹{t.amount.toFixed(2)}
                  </td>
                  <td style={{ color: '#3b82f6' }}>{t.paymentMode}</td>
                  <td><span className={`badge-type ${t.type.toLowerCase()}`}>{t.type}</span></td>
                  <td>
                    <button type="button" className="delete-btn" onClick={() => handleDelete(t._id)} style={{ padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyTracker;
