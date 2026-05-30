import { useState } from 'react';
import axios from 'axios';
import { Trash2, Info } from 'lucide-react';
import { getLocalDateString, formatDateDisplay } from '../utils/dateUtils';

const DailyTracker = ({ transactions, settings, fetchTransactions }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [filterBank, setFilterBank] = useState('All');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: settings?.categories?.[0]?.name || '',
    type: settings?.categories?.[0]?.type || 'Need',
    bank: settings?.banks?.[0]?.name || '',
    paymentMode: settings?.banks?.[0]?.services?.[0] || '',
    date: getLocalDateString()
  });

  const handleCategoryChange = (catName) => {
    const catObj = settings.categories.find(c => c.name === catName);
    if (catObj) {
      setFormData(prev => ({
        ...prev,
        category: catName,
        type: catObj.type
      }));
    } else {
      setFormData(prev => ({ ...prev, category: catName }));
    }
  };

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
    if (e.target.name === 'category') {
      handleCategoryChange(e.target.value);
    } else if (e.target.name === 'bank') {
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
        type: defaultCat?.type || 'Need',
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Category
                <Info size={16} style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setShowInfo(!showInfo)} title="Click for category guide" />
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
                  const supportedServices = selectedBankObj ? selectedBankObj.services : ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Cash'];
                  return supportedServices.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ));
                })()}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Type (Auto-mapped)</label>
              <select name="type" value={formData.type} onChange={handleChange} disabled>
                <option value="Need">Need</option>
                <option value="Want">Want</option>
                <option value="Saving">Saving</option>
              </select>
            </div>
          </div>

          {showInfo && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)', fontSize: '0.95rem' }}>Category & Payment Guide</h4>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                <li><strong>Life Infrastructure (Need):</strong> Rent, Groceries, Utilities, Basic Transport. <em style={{ color: 'var(--text-color)' }}>Best via: UPI, Credit Card</em></li>
                <li><strong>Future Me (Saving):</strong> Investments, Emergency Fund, Savings. <em style={{ color: 'var(--text-color)' }}>Best via: Bank Transfer</em></li>
                <li><strong>Performance & Growth (Need/Want):</strong> Gym, Courses, Books, Mentorship. <em style={{ color: 'var(--text-color)' }}>Best via: UPI, Debit Card</em></li>
                <li><strong>Relationships & Generosity (Want):</strong> Gifts, Charity, Family support. <em style={{ color: 'var(--text-color)' }}>Best via: Cash, UPI</em></li>
                <li><strong>Lifestyle Enjoyment (Want):</strong> Dining out, Movies, Vacations, Hobbies. <em style={{ color: 'var(--text-color)' }}>Best via: Credit Card</em></li>
              </ul>
            </div>
          )}
          
          <button type="submit" className="btn-primary">Add Transaction</button>
        </form>
      </div>

      <div className="card">
        {(() => {
          const filteredTransactions = transactions.filter(t => {
            if (filterBank === 'All') return true;
            const tBank = t.bank || '';
            return tBank.toLowerCase() === filterBank.toLowerCase();
          });

          const totalOutflow = filteredTransactions
            .filter(t => ['Need', 'Want', 'expense'].includes(t.type))
            .reduce((acc, curr) => acc + curr.amount, 0);

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0 }}>Transactions Log</h3>
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
                  </select>
                </div>
              </div>

              {filterBank !== 'All' && (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.15)', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Filtered Account: <strong style={{ color: 'var(--text-main)' }}>{filterBank}</strong></span>
                  <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                    Total Outflow: ₹{totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
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
                          <button type="button" className="delete-btn" onClick={() => handleDelete(t._id)} style={{ padding: '4px' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions found for this account.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default DailyTracker;
