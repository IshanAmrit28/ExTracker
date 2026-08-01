import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getLocalMonthString } from '../utils/dateUtils';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

const formatMonthLabel = (key) => {
  if (!key) return '';
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const getCurrentMonthKey = () => getLocalMonthString();

const MonthlyAnalysis = ({ transactions, settings }) => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [filterBank, setFilterBank] = useState('All');

  // Available unique months from transaction history
  const availableMonths = useMemo(() => {
    const keys = new Set(transactions.map(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).filter(Boolean));

    const sorted = Array.from(keys).sort((a, b) => b.localeCompare(a));
    const cur = getCurrentMonthKey();
    if (!keys.has(cur)) sorted.unshift(cur);
    return sorted;
  }, [transactions]);

  const { pieData, dailyData, totalSpent } = useMemo(() => {
    let tx = transactions.filter(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return false;
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mk === selectedMonth;
    });
    
    if (filterBank !== 'All') {
      tx = tx.filter(t => {
        const tBank = t.bank || '';
        return tBank.toLowerCase() === filterBank.toLowerCase();
      });
    }
    
    // Pie Data (excluding savings & income)
    const expensesByCategory = {};
    let total = 0;
    tx.filter(t => ['Need', 'Want', 'expense'].includes(t.type)).forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      total += t.amount;
    });

    const pie = Object.keys(expensesByCategory).map(key => ({
      name: key,
      value: expensesByCategory[key]
    }));

    // Daily Data
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    
    const dailyMap = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedMonth}-${String(i).padStart(2, '0')}`;
      dailyMap[dateStr] = 0;
    }

    tx.filter(t => ['Need', 'Want', 'expense'].includes(t.type)).forEach(t => {
      const dateStr = t.date.split('T')[0];
      if (dailyMap[dateStr] !== undefined) {
        dailyMap[dateStr] += t.amount;
      }
    });

    const daily = Object.keys(dailyMap).map(date => ({
      date,
      spent: dailyMap[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    return { pieData: pie, dailyData: daily, totalSpent: total };
  }, [transactions, selectedMonth, filterBank]);

  // Find peak spending day
  const maxSpendDay = useMemo(() => {
    return dailyData.reduce((max, d) => (d.spent > max.spent ? d : max), { spent: 0 });
  }, [dailyData]);

  const selectStyle = {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    cursor: 'pointer'
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Monthly Analysis</h2>
        <p>Granular look at your categorized spending and daily expenses.</p>
      </header>

      {/* Control row with Month & Bank Selectors */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Month:</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={selectStyle}>
            {availableMonths.map(mk => (
              <option key={mk} value={mk}>
                {formatMonthLabel(mk)}{mk === getCurrentMonthKey() ? ' (Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Account:</label>
          <select value={filterBank} onChange={(e) => setFilterBank(e.target.value)} style={selectStyle}>
            <option value="All">All Accounts</option>
            {settings.banks && settings.banks.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', padding: '0.5rem 1rem', backgroundColor: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.18)', borderLeft: '3px solid var(--primary-color)', borderRadius: '8px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Outflow: </span>
          <strong style={{ color: 'var(--primary-color)', fontSize: '1rem' }}>₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </div>
      </div>

      <div className="dashboard" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Donut Chart */}
        <div className="card">
          <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Category Breakup</h3>
          {pieData.length > 0 ? (
            <div style={{ height: '320px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={105} 
                    paddingAngle={3} 
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toFixed(2)}`} 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ffffff' }} 
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Center Label */}
              <div style={{ position: 'absolute', top: '44%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spent</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{Math.round(totalSpent).toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <p className="no-data" style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No expenses recorded for {formatMonthLabel(selectedMonth)}.</p>
          )}
        </div>

        {/* Daily Spend Table */}
        <div className="card">
          <h3>Daily Spend Log</h3>
          <p className="helper-text" style={{ marginBottom: '1rem' }}>Excludes savings. Shows total Need + Want spent per day.</p>
          <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Spent</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((d, i) => {
                  const isMax = maxSpendDay.spent > 0 && d.date === maxSpendDay.date;
                  return (
                    <tr key={i} style={isMax ? { backgroundColor: 'rgba(249, 115, 22, 0.08)' } : {}}>
                      <td style={{ color: isMax ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: isMax ? 'bold' : 'normal' }}>
                        {d.date} {isMax && <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--primary-color)', color: '#000000', marginLeft: '0.4rem', fontWeight: 'bold' }}>Peak</span>}
                      </td>
                      <td style={{ fontWeight: d.spent > 0 ? 'bold' : 'normal', color: d.spent > 0 ? (isMax ? 'var(--primary-color)' : 'var(--text-main)') : 'var(--text-muted)' }}>
                        ₹{d.spent.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAnalysis;
