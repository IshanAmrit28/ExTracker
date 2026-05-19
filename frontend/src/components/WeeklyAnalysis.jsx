import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const WeeklyAnalysis = ({ transactions, settings }) => {
  const [filterMode, setFilterMode] = useState('All');
  const [filterBank, setFilterBank] = useState('All');
  
  // Basic weekly aggregation
  const getWeeksData = () => {
    // For simplicity, we aggregate by ISO week in the current year, or just group by month chunks
    // Let's create a rough weekly chunking based on date
    const weeks = {};
    
    transactions.forEach(t => {
      // Exclude income and savings
      if (t.type === 'Income' || t.type === 'Saving' || t.type === 'income') return;
      if (filterMode !== 'All' && t.category !== filterMode) return;
      
      const tBank = t.bank || 'Cash / Wallet';
      if (filterBank !== 'All' && tBank.toLowerCase() !== filterBank.toLowerCase()) return;
      
      const date = new Date(t.date);
      // Get week number
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      
      const key = `Week ${weekNum} (${date.toLocaleString('default', { month: 'short' })})`;
      
      if (!weeks[key]) {
        weeks[key] = { name: key, spend: 0, limit: settings.weeklyLimit || 10000, bankBreakdown: {} };
      }
      weeks[key].spend += t.amount;
      weeks[key].bankBreakdown[tBank] = (weeks[key].bankBreakdown[tBank] || 0) + t.amount;
    });

    return Object.values(weeks).sort((a, b) => a.name.localeCompare(b.name));
  };

  const chartData = getWeeksData();

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Weekly Analysis</h2>
        <p>Monitor your weekly expenditure against your predefined limits.</p>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="form-row" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className="form-group flex-1" style={{ minWidth: '200px' }}>
            <label>Filter by Category</label>
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
              <option value="All">All Categories</option>
              {settings.categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group flex-1" style={{ minWidth: '200px' }}>
            <label>Filter by Bank Account</label>
            <select value={filterBank} onChange={(e) => setFilterBank(e.target.value)}>
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

        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <ReferenceLine y={settings.weeklyLimit || 10000} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Weekly Limit', fill: '#ef4444' }} />
              <Bar dataKey="spend" fill="#3b82f6" name="Spend" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Weekly Breakdown Table</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Week Identifier</th>
                <th>Total Spend</th>
                <th>Bank Breakdown</th>
                <th>Limit</th>
                <th>Ratio (%)</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => {
                const ratio = ((d.spend / d.limit) * 100).toFixed(1);
                return (
                  <tr key={i}>
                    <td>{d.name}</td>
                    <td style={{ color: d.spend > d.limit ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>₹{d.spend.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '250px' }}>
                        {Object.entries(d.bankBreakdown).map(([bankName, bankSpent]) => (
                          <div key={bankName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.015)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{bankName}:</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>₹{bankSpent.toFixed(2)}</span>
                          </div>
                        ))}
                        {Object.keys(d.bankBreakdown).length === 0 && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>₹{d.limit}</td>
                    <td>
                      <span className={`badge-type ${d.spend > d.limit ? 'want' : 'saving'}`}>
                        {ratio}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {chartData.length === 0 && <tr><td colSpan="5" className="no-data" style={{ padding: '2rem' }}>No data for selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyAnalysis;
