import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getLocalMonthString } from '../utils/dateUtils';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

const MonthlyAnalysis = ({ transactions, settings }) => {
  const [selectedMonth, setSelectedMonth] = useState(getLocalMonthString());
  const [filterBank, setFilterBank] = useState('All');

  const { thisMonthTx, pieData, dailyData } = useMemo(() => {
    let tx = transactions.filter(t => t.date.startsWith(selectedMonth));
    
    if (filterBank !== 'All') {
      tx = tx.filter(t => {
        const tBank = t.bank || '';
        return tBank.toLowerCase() === filterBank.toLowerCase();
      });
    }
    
    // Pie Data (excluding savings)
    const expensesByCategory = {};
    tx.filter(t => ['Need', 'Want', 'expense'].includes(t.type)).forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });
    const pie = Object.keys(expensesByCategory).map(key => ({
      name: key,
      value: expensesByCategory[key]
    }));

    // Daily Data
    // Get days in month
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
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

    return { thisMonthTx: tx, pieData: pie, dailyData: daily };
  }, [transactions, selectedMonth, filterBank]);

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Monthly Analysis</h2>
        <p>Granular look at your categorized spending and daily expenses.</p>
      </header>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ maxWidth: '200px', flex: 1 }}>
          <label>Select Month</label>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        </div>
        <div className="form-group" style={{ maxWidth: '200px', flex: 1 }}>
          <label>Select Bank / Account</label>
          <select 
            value={filterBank} 
            onChange={(e) => setFilterBank(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem', cursor: 'pointer' }}
          >
            <option value="All">All Accounts</option>
            {settings.banks && settings.banks.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>Actual Spend</h3>
          {pieData.length > 0 ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={0} outerRadius={100} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="no-data" style={{ marginTop: '4rem' }}>No expenses recorded this month.</p>
          )}
        </div>

        <div className="card">
          <h3>Daily Spend Table</h3>
          <p className="helper-text">Excludes savings. Shows total Need + Want spent per day.</p>
          <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Spent</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((d, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{d.date}</td>
                    <td style={{ fontWeight: d.spent > 0 ? 'bold' : 'normal', color: d.spent > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      ₹{d.spent.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAnalysis;
