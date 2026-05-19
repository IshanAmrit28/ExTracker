import { useState } from 'react';
import axios from 'axios';
import { Trash2, Plus, Check } from 'lucide-react';

const ALL_SERVICES = ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Cash'];

const Setup = ({ settings, fetchSettings }) => {
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingMonthlyReport, setLoadingMonthlyReport] = useState(false);
  const [formData, setFormData] = useState({
    salary: settings.salary || 50000,
    weeklyLimit: settings.weeklyLimit || 10000,
    needsPercentage: settings.needsPercentage || 50,
    wantsPercentage: settings.wantsPercentage || 30,
    savingsPercentage: settings.savingsPercentage || 20,
    banks: settings.banks || [
      { name: 'Cash / Wallet', services: ['Cash'] }
    ]
  });

  const [newBankName, setNewBankName] = useState('');
  const [selectedServices, setSelectedServices] = useState(['UPI', 'Debit Card']);

  const toggleBankService = (bankIndex, serviceName) => {
    const updatedBanks = formData.banks.map((bank, idx) => {
      if (idx === bankIndex) {
        const hasService = bank.services.includes(serviceName);
        const updatedServices = hasService
          ? bank.services.filter(s => s !== serviceName)
          : [...bank.services, serviceName];
        return { ...bank, services: updatedServices };
      }
      return bank;
    });
    setFormData(prev => ({ ...prev, banks: updatedBanks }));
  };

  const deleteBank = (bankIndex) => {
    const updatedBanks = formData.banks.filter((_, idx) => idx !== bankIndex);
    setFormData(prev => ({ ...prev, banks: updatedBanks }));
  };

  const toggleNewBankService = (service) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleAddBank = (e) => {
    e.preventDefault();
    if (!newBankName.trim()) return;
    
    if (formData.banks.some(b => b.name.toLowerCase() === newBankName.trim().toLowerCase())) {
      alert('A bank with this name already exists!');
      return;
    }

    const newBank = {
      name: newBankName.trim(),
      services: selectedServices
    };

    setFormData(prev => ({
      ...prev,
      banks: [...prev.banks, newBank]
    }));
    setNewBankName('');
    setSelectedServices(['UPI', 'Debit Card']);
  };

  const handleRequestWeeklyReport = async () => {
    setLoadingReport(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_BASE_URL}/api/settings/send-weekly-report`);
      alert(res.data.message || 'Weekly report sent to your email successfully!');
    } catch (err) {
      console.error('Error sending weekly report:', err);
      alert(err.response?.data?.message || 'Failed to send weekly report. Make sure RESEND_API_KEY is configured on the backend.');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleRequestMonthlyReport = async () => {
    setLoadingMonthlyReport(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_BASE_URL}/api/settings/send-monthly-report`);
      alert(res.data.message || 'Monthly report sent to your email successfully!');
    } catch (err) {
      console.error('Error sending monthly report:', err);
      alert(err.response?.data?.message || 'Failed to send monthly report. Make sure RESEND_API_KEY is configured on the backend.');
    } finally {
      setLoadingMonthlyReport(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: Number(e.target.value) });
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${API_BASE_URL}/api/settings`, formData);
      fetchSettings();
      alert('Settings updated successfully!');
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  const currentYear = new Date().getFullYear();
  const projections = [];
  let projSalary = formData.salary || 50000;
  
  const needP = formData.needsPercentage / 100;
  const wantP = formData.wantsPercentage / 100;
  const saveP = formData.savingsPercentage / 100;
  
  for (let i = 0; i < 5; i++) {
    projections.push({
      year: currentYear + i,
      salary: Math.round(projSalary),
      needs: Math.floor(projSalary * needP),
      wants: Math.floor(projSalary * wantP),
      savings: Math.ceil(projSalary * saveP)
    });
    projSalary *= 1.1; // 10% increase YoY
  }

  const totalPercentage = formData.needsPercentage + formData.wantsPercentage + formData.savingsPercentage;

  return (
    <div className="fade-in setup-container">
      <header className="page-header">
        <h2>Setup & Parameters</h2>
        <p>Configure your foundational budget rules, limits, and categorizations</p>
      </header>

      <div className="card setup-card">
        <form onSubmit={handleUpdateSettings} className="setup-form">
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Current Base Salary (₹)</label>
              <input 
                type="number" 
                name="salary"
                value={formData.salary} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group flex-1">
              <label>Weekly Limit (₹)</label>
              <input 
                type="number" 
                name="weeklyLimit"
                value={formData.weeklyLimit} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <h3 style={{ marginTop: '1rem', marginBottom: '1rem' }}>Budget Distribution (%)</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Needs (%)</label>
              <input 
                type="number" 
                name="needsPercentage"
                value={formData.needsPercentage} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group flex-1">
              <label>Wants (%)</label>
              <input 
                type="number" 
                name="wantsPercentage"
                value={formData.wantsPercentage} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group flex-1">
              <label>Savings (%)</label>
              <input 
                type="number" 
                name="savingsPercentage"
                value={formData.savingsPercentage} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          {totalPercentage !== 100 && (
            <p className="helper-text" style={{ color: 'var(--danger)' }}>
              Warning: Your percentages add up to {totalPercentage}%, not 100%.
            </p>
          )}

          <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Save Settings</button>
        </form>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>5 Year Salary & Target Projections (10% YoY)</h3>
        <div className="table-responsive">
          <table className="data-table projection-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Salary</th>
                <th>Needs ({formData.needsPercentage}%)</th>
                <th>Wants ({formData.wantsPercentage}%)</th>
                <th>Savings ({formData.savingsPercentage}%)</th>
              </tr>
            </thead>
            <tbody>
              {projections.map(p => (
                <tr key={p.year}>
                  <td style={{fontWeight: 'bold'}}>{p.year}</td>
                  <td style={{color: '#8b5cf6'}}>₹{p.salary.toLocaleString()}</td>
                  <td>₹{p.needs.toLocaleString()}</td>
                  <td>₹{p.wants.toLocaleString()}</td>
                  <td>₹{p.savings.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card setup-card">
        <h3>Category List & Mapping</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Type</th>
                <th>Default Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {settings.categories.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td><span className={`badge-type ${c.type.toLowerCase()}`}>{c.type}</span></td>
                  <td>{c.paymentMode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card setup-card" style={{ marginTop: '2rem' }}>
        <h3>Bank Accounts & Payment Services Customization</h3>
        <p className="helper-text" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Configure your personal bank accounts and define exactly which transaction services (UPI, Cards, Cash) each bank supports. These mappings automatically filter options dynamically when logging your expenses.
        </p>

        {/* Existing Banks List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {formData.banks.map((bank, bankIdx) => (
            <div 
              key={bankIdx} 
              style={{ 
                padding: '1.5rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--border)', 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{bank.name}</h4>
                  {formData.banks.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => deleteBank(bankIdx)} 
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--danger)', 
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Delete Bank Account"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.8rem 0' }}>
                  Toggle supported services below:
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ALL_SERVICES.map(service => {
                    const isActive = bank.services.includes(service);
                    return (
                      <span
                        key={service}
                        onClick={() => toggleBankService(bankIdx, service)}
                        style={{
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          transition: 'all 0.2s',
                          border: isActive ? '1px solid var(--primary-color)' : '1px solid var(--border)',
                          backgroundColor: isActive ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                          color: isActive ? 'var(--primary-color)' : 'var(--text-muted)'
                        }}
                      >
                        {service}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Bank Form */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-main)' }}>Add a New Bank Account</h4>
          <form onSubmit={handleAddBank} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ maxWidth: '400px' }}>
              <label>Bank Name</label>
              <input
                type="text"
                placeholder="e.g. ICICI Bank, SBI Bank"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label style={{ marginBottom: '0.5rem', display: 'block' }}>Initial Supported Services:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {ALL_SERVICES.map(service => {
                  const isChecked = selectedServices.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleNewBankService(service)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        border: isChecked ? '1px solid var(--primary-color)' : '1px solid var(--border)',
                        backgroundColor: isChecked ? 'var(--primary-color)' : 'transparent',
                        color: isChecked ? '#000000' : 'var(--text-main)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {isChecked && <Check size={14} />}
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> Add Bank Account
            </button>
          </form>
        </div>
      </div>

      <div className="card setup-card" style={{ marginTop: '2rem' }}>
        <h3>Financial Diagnostics & Reports</h3>
        <p className="helper-text" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Generate comprehensive audit reports of your credited and debited transactions, starting/ending balances, and category-wise spending distributions. Beautifully formatted PDFs will be compiled and sent directly to your registered email address.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleRequestWeeklyReport} 
            disabled={loadingReport || loadingMonthlyReport}
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-color)' }}
          >
            {loadingReport ? 'Generating Weekly Report...' : 'Email Me My Weekly Report Now'}
          </button>

          <button 
            type="button" 
            className="btn-secondary" 
            onClick={handleRequestMonthlyReport} 
            disabled={loadingReport || loadingMonthlyReport}
            style={{ width: 'auto' }}
          >
            {loadingMonthlyReport ? 'Generating Monthly Report...' : 'Email Me My Monthly Report Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;
