import { useState, useEffect } from 'react';
import { settingsApi } from '../../services/api';
import { Trash2, Plus, Check, Crown } from 'lucide-react';

const ALL_SERVICES = ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Cash'];

const Setup = ({ settings, fetchSettings, user }) => {
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingMonthlyReport, setLoadingMonthlyReport] = useState(false);
  const [formData, setFormData] = useState({
    salary: settings.salary ?? 50000,
    weeklyLimit: settings.weeklyLimit ?? 10000,
    monthlyLimit: settings.monthlyLimit ?? 0,
    needsPercentage: settings.needsPercentage ?? 50,
    wantsPercentage: settings.wantsPercentage ?? 30,
    savingsPercentage: settings.savingsPercentage ?? 20,
    banks: settings.banks || [
      { name: 'Cash / Wallet', services: ['Cash'] }
    ],
    categories: settings.categories || [],
    paymentModes: settings.paymentModes || ['Credit Card', 'Debit Card', 'UPI', 'Cash', 'Bank Transfer']
  });

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        salary: settings.salary ?? prev.salary,
        weeklyLimit: settings.weeklyLimit ?? prev.weeklyLimit,
        monthlyLimit: settings.monthlyLimit ?? prev.monthlyLimit,
        needsPercentage: settings.needsPercentage ?? prev.needsPercentage,
        wantsPercentage: settings.wantsPercentage ?? prev.wantsPercentage,
        savingsPercentage: settings.savingsPercentage ?? prev.savingsPercentage,
        banks: settings.banks || prev.banks,
        categories: settings.categories || prev.categories,
        paymentModes: settings.paymentModes || prev.paymentModes
      }));
    }
  }, [settings]);

  const [newBankName, setNewBankName] = useState('');
  const [selectedServices, setSelectedServices] = useState(
    settings.paymentModes && settings.paymentModes.length >= 2 
      ? [settings.paymentModes[0], settings.paymentModes[1]] 
      : ['UPI', 'Debit Card']
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newPaymentMode, setNewPaymentMode] = useState('');

  const saveSettingsToBackend = async (newFormData) => {
    try {
      await settingsApi.update(newFormData);
      fetchSettings();
    } catch (err) {
      console.error('Error auto-saving settings:', err);
    }
  };

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
    const newFormData = { ...formData, banks: updatedBanks };
    setFormData(newFormData);
    saveSettingsToBackend(newFormData);
  };

  const deleteBank = (bankIndex) => {
    const updatedBanks = formData.banks.filter((_, idx) => idx !== bankIndex);
    const newFormData = { ...formData, banks: updatedBanks };
    setFormData(newFormData);
    saveSettingsToBackend(newFormData);
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

    const newFormData = { ...formData, banks: [...formData.banks, newBank] };
    setFormData(newFormData);
    saveSettingsToBackend(newFormData);
    setNewBankName('');
    setSelectedServices(['UPI', 'Debit Card']);
  };

  const handleRequestWeeklyReport = async () => {
    setLoadingReport(true);
    try {
      const res = await settingsApi.sendWeeklyReport();
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
      const res = await settingsApi.sendMonthlyReport();
      alert(res.data.message || 'Monthly report sent to your email successfully!');
    } catch (err) {
      console.error('Error sending monthly report:', err);
      alert(err.response?.data?.message || 'Failed to send monthly report. Make sure RESEND_API_KEY is configured on the backend.');
    } finally {
      setLoadingMonthlyReport(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (fieldName, defaultVal = 0) => {
    const val = formData[fieldName];
    const parsed = parseFloat(val);
    setFormData(prev => ({ ...prev, [fieldName]: isNaN(parsed) ? defaultVal : parsed }));
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      // Ensure all fields are parsed numbers before sending
      const cleanFormData = {
        ...formData,
        salary: Number(formData.salary) || 0,
        weeklyLimit: Number(formData.weeklyLimit) || 0,
        monthlyLimit: Number(formData.monthlyLimit) || 0,
        needsPercentage: Number(formData.needsPercentage) || 0,
        wantsPercentage: Number(formData.wantsPercentage) || 0,
        savingsPercentage: Number(formData.savingsPercentage) || 0,
      };
      await settingsApi.update(cleanFormData);
      fetchSettings();
      alert('Settings updated successfully!');
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  const currentYear = new Date().getFullYear();
  const projections = [];
  let projSalary = Number(formData.salary) || 50000;
  
  const needP = (Number(formData.needsPercentage) || 0) / 100;
  const wantP = (Number(formData.wantsPercentage) || 0) / 100;
  const saveP = (Number(formData.savingsPercentage) || 0) / 100;
  
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

  const totalPercentage = (Number(formData.needsPercentage) || 0) + (Number(formData.wantsPercentage) || 0) + (Number(formData.savingsPercentage) || 0);

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
                type="text"
                inputMode="decimal"
                name="salary"
                value={formData.salary} 
                onChange={handleChange}
                onBlur={() => handleBlur('salary', 50000)}
                required 
              />
            </div>
            <div className="form-group flex-1">
              <label>Weekly Limit (₹)</label>
              <input 
                type="text" 
                inputMode="decimal"
                name="weeklyLimit"
                value={formData.weeklyLimit} 
                onChange={handleChange}
                onBlur={() => handleBlur('weeklyLimit', 10000)}
                required 
              />
            </div>
            <div className="form-group flex-1">
              <label>Monthly Spending Limit (₹)</label>
              <input 
                type="text" 
                inputMode="decimal"
                name="monthlyLimit"
                value={formData.monthlyLimit} 
                onChange={handleChange}
                onBlur={() => handleBlur('monthlyLimit', 0)}
                placeholder="e.g. 25000"
              />
              {Number(formData.monthlyLimit) > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                  ≈ ₹{Math.round(Number(formData.monthlyLimit) / 30).toLocaleString()} / day base limit
                </span>
              )}
            </div>
          </div>

          <h3 className="setup-section-title">Budget Distribution (%)</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Needs (%)</label>
              <input 
                type="text" 
                inputMode="numeric"
                name="needsPercentage"
                value={formData.needsPercentage} 
                onChange={handleChange}
                onBlur={() => handleBlur('needsPercentage', 50)}
                required 
              />
            </div>
            <div className="form-group flex-1">
              <label>Wants (%)</label>
              <input 
                type="text" 
                inputMode="numeric"
                name="wantsPercentage"
                value={formData.wantsPercentage} 
                onChange={handleChange}
                onBlur={() => handleBlur('wantsPercentage', 30)}
                required 
              />
            </div>
            <div className="form-group flex-1">
              <label>Savings (%)</label>
              <input 
                type="text" 
                inputMode="numeric"
                name="savingsPercentage"
                value={formData.savingsPercentage} 
                onChange={handleChange}
                onBlur={() => handleBlur('savingsPercentage', 20)}
                required 
              />
            </div>
          </div>

          {/* Live Budget Distribution Visual Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>Live Distribution Breakdown</span>
              <span style={{ color: totalPercentage === 100 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                {totalPercentage}% Total {totalPercentage === 100 ? '(Balanced)' : '(Unbalanced)'}
              </span>
            </div>
            <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--border)' }}>
              <div style={{ width: `${Math.max(0, formData.needsPercentage)}%`, backgroundColor: '#f59e0b', transition: 'width 0.3s' }} title={`Needs: ${formData.needsPercentage}%`}></div>
              <div style={{ width: `${Math.max(0, formData.wantsPercentage)}%`, backgroundColor: '#ef4444', transition: 'width 0.3s' }} title={`Wants: ${formData.wantsPercentage}%`}></div>
              <div style={{ width: `${Math.max(0, formData.savingsPercentage)}%`, backgroundColor: '#22c55e', transition: 'width 0.3s' }} title={`Savings: ${formData.savingsPercentage}%`}></div>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span> Needs ({formData.needsPercentage}%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span> Wants ({formData.wantsPercentage}%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#22c55e' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span> Savings ({formData.savingsPercentage}%)
              </span>
            </div>
          </div>

          {totalPercentage !== 100 && (
            <p className="helper-text" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              Warning: Your percentages add up to {totalPercentage}%, not 100%.
            </p>
          )}

          <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Save Settings</button>
        </form>

        <h3 className="setup-section-title" style={{ marginTop: '2.5rem' }}>5 Year Salary & Target Projections (10% YoY)</h3>
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
              {projections.map(p => {
                const isCurrent = p.year === currentYear;
                return (
                  <tr key={p.year} style={isCurrent ? { backgroundColor: 'rgba(249, 115, 22, 0.08)', borderLeft: '3px solid var(--primary-color)' } : {}}>
                    <td style={{ fontWeight: 'bold' }}>
                      {p.year} {isCurrent && <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--primary-color)', color: '#000000', marginLeft: '0.3rem', fontWeight: 'bold' }}>Current</span>}
                    </td>
                    <td style={{ color: '#8b5cf6', fontWeight: 'bold' }}>₹{p.salary.toLocaleString()}</td>
                    <td>₹{p.needs.toLocaleString()}</td>
                    <td>₹{p.wants.toLocaleString()}</td>
                    <td style={{ color: '#22c55e', fontWeight: 'bold' }}>₹{p.savings.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card setup-card">
        <h3 className="setup-section-title">Category Management</h3>
        <p className="helper-text" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Define the custom transaction categories you use to classify your spending.
        </p>

        {/* Existing Categories List */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {formData.categories.map((c, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '6px 12px', 
                backgroundColor: 'rgba(255,255,255,0.04)', 
                border: '1px solid var(--border)', 
                borderRadius: '20px',
                fontSize: '0.85rem' 
              }}
            >
              <span>{c.name}</span>
              {formData.categories.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => {
                    const updatedCats = formData.categories.filter((_, idx) => idx !== i);
                    const newFormData = { ...formData, categories: updatedCats };
                    setFormData(newFormData);
                    saveSettingsToBackend(newFormData);
                  }}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--danger)', 
                    cursor: 'pointer', 
                    padding: 0, 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}
                  title="Delete Category"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Category Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCategoryName.trim()) return;
            if (formData.categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
              alert('Category already exists!');
              return;
            }
            const newCats = [...formData.categories, { name: newCategoryName.trim() }];
            const newFormData = { ...formData, categories: newCats };
            setFormData(newFormData);
            saveSettingsToBackend(newFormData);
            setNewCategoryName('');
          }}
          style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: '500px' }}
        >
          <div className="form-group flex-1" style={{ marginBottom: 0 }}>
            <label>Add New Category</label>
            <input 
              type="text" 
              placeholder="e.g. Subscriptions, Gifts" 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
            Add
          </button>
        </form>
      </div>

      <div className="card setup-card" style={{ marginTop: '2rem' }}>
        <h3 className="setup-section-title">Payment Modes Management</h3>
        <p className="helper-text" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Configure the active payment methods available across your bank accounts (e.g. UPI, Credit Card, Cash, etc).
        </p>

        {/* Existing Payment Modes List */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {formData.paymentModes.map((pm, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '6px 12px', 
                backgroundColor: 'rgba(59, 130, 246, 0.08)', 
                border: '1px solid rgba(59, 130, 246, 0.2)', 
                borderRadius: '20px',
                color: '#3b82f6',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <span>{pm}</span>
              {formData.paymentModes.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => {
                    const updatedPMs = formData.paymentModes.filter((_, idx) => idx !== i);
                    const newFormData = { ...formData, paymentModes: updatedPMs };
                    setFormData(newFormData);
                    saveSettingsToBackend(newFormData);
                  }}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--danger)', 
                    cursor: 'pointer', 
                    padding: 0, 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}
                  title="Delete Payment Mode"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Payment Mode Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (!newPaymentMode.trim()) return;
            if (formData.paymentModes.some(pm => pm.toLowerCase() === newPaymentMode.trim().toLowerCase())) {
              alert('Payment Mode already exists!');
              return;
            }
            const newPMs = [...formData.paymentModes, newPaymentMode.trim()];
            const newFormData = { ...formData, paymentModes: newPMs };
            setFormData(newFormData);
            saveSettingsToBackend(newFormData);
            setNewPaymentMode('');
          }}
          style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: '500px' }}
        >
          <div className="form-group flex-1" style={{ marginBottom: 0 }}>
            <label>Add New Payment Mode</label>
            <input 
              type="text" 
              placeholder="e.g. GPay, Apple Pay" 
              value={newPaymentMode} 
              onChange={(e) => setNewPaymentMode(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
            Add
          </button>
        </form>
      </div>

      <div className="card setup-card" style={{ marginTop: '2rem' }}>
        <h3 className="setup-section-title">Bank Accounts & Payment Services Customization</h3>
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
                borderTop: '2px solid var(--primary-color)',
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
                  {formData.paymentModes.map(service => {
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
                {formData.paymentModes.map(service => {
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

      {user?.isPremium && (
        <div className="card setup-card" style={{ marginTop: '2rem' }}>
          <h3 className="setup-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={20} color="#f59e0b" /> Financial Diagnostics & Reports
          </h3>
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
      )}
    </div>
  );
};

export default Setup;
