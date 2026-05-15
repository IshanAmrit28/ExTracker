import { useState } from 'react';
import axios from 'axios';

const Setup = ({ settings, fetchSettings }) => {
  const [formData, setFormData] = useState({
    salary: settings.salary || 50000,
    weeklyLimit: settings.weeklyLimit || 10000,
    needsPercentage: settings.needsPercentage || 50,
    wantsPercentage: settings.wantsPercentage || 30,
    savingsPercentage: settings.savingsPercentage || 20
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: Number(e.target.value) });
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/settings', formData);
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
    </div>
  );
};

export default Setup;
