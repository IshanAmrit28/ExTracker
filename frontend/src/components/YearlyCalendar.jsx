import { useMemo } from 'react';
import { formatDateToYYYYMMDD } from '../utils/dateUtils';

const YearlyCalendar = ({ transactions }) => {
  const currentYear = new Date().getFullYear();

  const heatmapData = useMemo(() => {
    // Generate all days in the current year
    const data = {};
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDateToYYYYMMDD(d);
      data[dateStr] = 0;
    }

    // Add spending
    transactions.forEach(t => {
      if (['Need', 'Want', 'expense'].includes(t.type)) {
        const dateStr = t.date.split('T')[0];
        if (data[dateStr] !== undefined) {
          data[dateStr] += t.amount;
        }
      }
    });

    return data;
  }, [transactions, currentYear]);

  // Group by month to render nicely
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const getIntensityClass = (amount) => {
    if (amount === 0) return 'level-0';
    if (amount < 500) return 'level-1';
    if (amount < 1500) return 'level-2';
    if (amount < 3000) return 'level-3';
    return 'level-4';
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Yearly Calendar Heatmap</h2>
        <p>Visual overview of your spending intensity across {currentYear}</p>
      </header>

      <div className="card">
        <div className="heatmap-container">
          {months.map((month, monthIndex) => {
            const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
            const firstDayOfWeek = new Date(currentYear, monthIndex, 1).getDay();
            const days = [];
            
            for (let i = 0; i < firstDayOfWeek; i++) {
              days.push({ empty: true, key: `empty-${monthIndex}-${i}` });
            }

            for (let i = 1; i <= daysInMonth; i++) {
              const dateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
              days.push({
                date: dateStr,
                dayNum: i,
                amount: heatmapData[dateStr] || 0
              });
            }

            return (
              <div key={month} className="heatmap-month">
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)', fontSize: '1rem', textAlign: 'center' }}>{month}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                <div className="heatmap-grid">
                  {days.map(d => d.empty ? (
                    <div key={d.key} className="heatmap-cell empty"></div>
                  ) : (
                    <div 
                      key={d.date} 
                      className={`heatmap-cell ${getIntensityClass(d.amount)}`}
                      title={`${d.date}: ₹${d.amount.toFixed(2)}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: d.amount > 0 ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}
                    >
                      {d.dayNum}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="heatmap-legend">
          <span>Less</span>
          <div className="heatmap-cell level-0"></div>
          <div className="heatmap-cell level-1"></div>
          <div className="heatmap-cell level-2"></div>
          <div className="heatmap-cell level-3"></div>
          <div className="heatmap-cell level-4"></div>
          <span>More Spending</span>
        </div>
      </div>
    </div>
  );
};

export default YearlyCalendar;
