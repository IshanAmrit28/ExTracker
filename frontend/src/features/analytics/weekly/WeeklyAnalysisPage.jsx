import { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getExpenseShare, isExpense } from '../../../utils/finance/transactions';

const WeeklyAnalysis = ({ transactions, settings }) => {
  const [filterMode, setFilterMode] = useState('All');
  const [filterBank, setFilterBank] = useState('All');
  
  const getWeeksData = () => {
    const weeks = {};
    
    transactions.forEach(t => {
      if (!isExpense(t)) return;
      if (filterMode !== 'All' && t.category !== filterMode) return;
      
      const tBank = t.bank || '';
      if (filterBank !== 'All' && tBank.toLowerCase() !== filterBank.toLowerCase()) return;
      
      const date = new Date(t.date);
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      
      const key = `Week ${weekNum} (${date.toLocaleString('default', { month: 'short' })})`;
      
      const expAmt = getExpenseShare(t);
      if (!weeks[key]) {
        weeks[key] = { name: key, spend: 0, limit: settings.weeklyLimit || 10000, bankBreakdown: {} };
      }
      weeks[key].spend += expAmt;
      weeks[key].bankBreakdown[tBank] = (weeks[key].bankBreakdown[tBank] || 0) + expAmt;
    });

    return Object.values(weeks).sort((a, b) => a.name.localeCompare(b.name));
  };

  const chartData = getWeeksData();
  const weeklyLimit = settings.weeklyLimit || 10000;

  const getBarColor = (spend, limit) => {
    if (spend > limit) return '#ef4444'; // Over limit - Red
    if (spend >= limit * 0.7) return '#f97316'; // Near limit - Orange
    return '#22c55e'; // Safe - Green
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Weekly Analysis</h2>
        <p>Monitor your weekly expenditure against your predefined limits.</p>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="form-row" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
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
            </select>
          </div>
        </div>

        {/* Weekly Limit Summary Indicator */}
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configured Weekly Cap: <strong style={{ color: 'var(--text-main)' }}>₹{weeklyLimit.toLocaleString()}</strong></span>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span> &lt;70% Cap</span>
            <span style={{ color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }}></span> 70-100% Cap</span>
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span> &gt;100% Cap</span>
          </div>
        </div>

        <div style={{ width: '100%', height: 380 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text-main)' }}
                itemStyle={{ color: 'var(--text-main)' }}
              />
              <Legend />
              <ReferenceLine y={weeklyLimit} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'top', value: `Weekly Limit (₹${weeklyLimit})`, fill: '#ef4444', fontSize: 12 }} />
              <Bar dataKey="spend" name="Weekly Spend" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.spend, entry.limit)} />
                ))}
              </Bar>
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
                <th>Week</th>
                <th>Total Spend</th>
                <th>Bank Breakdown</th>
                <th>Limit</th>
                <th>Cap Utilized</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => {
                const ratio = ((d.spend / d.limit) * 100).toFixed(1);
                const isOver = d.spend > d.limit;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: '600' }}>{d.name}</td>
                    <td style={{ color: isOver ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}>₹{d.spend.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '260px' }}>
                        {Object.entries(d.bankBreakdown).map(([bankName, bankSpent]) => (
                          <div key={bankName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.015)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{bankName}:</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>₹{bankSpent.toFixed(2)}</span>
                          </div>
                        ))}
                        {Object.keys(d.bankBreakdown).length === 0 && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>₹{d.limit}</td>
                    <td>
                      <span className={`badge-type ${isOver ? 'want' : 'saving'}`}>
                        {ratio}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {chartData.length === 0 && <tr><td colSpan="5" className="no-data" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data for selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyAnalysis;
