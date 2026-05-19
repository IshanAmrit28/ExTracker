import { Activity, Target, Wallet, TrendingDown, Landmark, PieChart } from 'lucide-react';
import { getLocalMonthString } from '../utils/dateUtils';

const Dashboard = ({ transactions, settings }) => {
  const currentMonth = getLocalMonthString();
  const thisMonthTx = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const actualNeed = thisMonthTx.filter(t => t.type === 'Need' || t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const actualWant = thisMonthTx.filter(t => t.type === 'Want').reduce((acc, curr) => acc + curr.amount, 0);
  const actualSaving = thisMonthTx.filter(t => t.type === 'Saving').reduce((acc, curr) => acc + curr.amount, 0);

  const totalCreditedThisMonth = thisMonthTx.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpentThisMonth = actualNeed + actualWant;
  const totalLeftThisMonth = totalCreditedThisMonth - totalSpentThisMonth;
  const percentLeftThisMonth = totalCreditedThisMonth > 0 ? Math.round((totalLeftThisMonth / totalCreditedThisMonth) * 100) : 0;

  const totalAllTimeCredited = transactions.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalAllTimeSpent = transactions.filter(t => ['Need', 'Want', 'expense'].includes(t.type)).reduce((acc, curr) => acc + curr.amount, 0);
  const overallLeft = totalAllTimeCredited - totalAllTimeSpent;

  const salary = totalCreditedThisMonth > 0 ? totalCreditedThisMonth : (settings.salary || 0);
  
  const needP = (settings.needsPercentage || 50) / 100;
  const wantP = (settings.wantsPercentage || 30) / 100;
  const saveP = (settings.savingsPercentage || 20) / 100;

  const budgetNeed = Math.floor(salary * needP);
  const budgetWant = Math.floor(salary * wantP);
  const budgetSaving = Math.ceil(salary * saveP);

  // Score Calculation
  let score = 50;
  if (salary > 0) {
    const needAdherence = Math.max(0, 1 - (actualNeed / budgetNeed));
    const wantAdherence = Math.max(0, 1 - (actualWant / budgetWant));
    score += (needAdherence * 15) + (wantAdherence * 15);
    
    if (actualSaving >= budgetSaving) {
      score += 20;
    } else {
      score += (actualSaving / budgetSaving) * 20;
    }
  }
  score = Math.min(100, Math.round(score));

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Calc Summary</h2>
        <p>Your overarching Budget vs Actual overview</p>
      </header>

      <div className="account-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem' }}>
          <Wallet color="#10b981" size={28} style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Credited This Month</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>₹{totalCreditedThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem' }}>
          <TrendingDown color="#ef4444" size={28} style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Spent This Month</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>₹{totalSpentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem' }}>
          <PieChart color="#3b82f6" size={28} style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Left This Month</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>₹{totalLeftThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal'}}>({percentLeftThisMonth}%)</span></p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem' }}>
          <Landmark color="#8b5cf6" size={28} style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Overall Balance</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>₹{overallLeft.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="top-metrics">
        <div className="score-card">
          <div className="score-header">
            <Activity size={24} color="#8b5cf6" />
            <h2>Financial Score</h2>
          </div>
          <div className="score-circle">
            <div className="score-value">{score}</div>
            <div className="score-label">/ 100</div>
          </div>
        </div>

        <div className="budget-variance-card">
          <div className="budget-header">
            <Target size={24} color="#3b82f6" />
            <h2>Budget vs Actual ({settings.needsPercentage || 50}:{settings.wantsPercentage || 30}:{settings.savingsPercentage || 20})</h2>
          </div>
          
          <div className="variance-item">
            <div className="v-labels">
              <span className="v-title">Needs ({settings.needsPercentage || 50}%)</span>
              <span className="v-amounts">₹{actualNeed} / ₹{budgetNeed}</span>
            </div>
            <div className="budget-progress">
              <div className={`progress-bar ${actualNeed > budgetNeed ? 'danger' : ''}`} style={{ width: `${Math.min(100, (actualNeed / budgetNeed || 0) * 100)}%` }}></div>
            </div>
          </div>

          <div className="variance-item">
            <div className="v-labels">
              <span className="v-title">Wants ({settings.wantsPercentage || 30}%)</span>
              <span className="v-amounts">₹{actualWant} / ₹{budgetWant}</span>
            </div>
            <div className="budget-progress">
              <div className={`progress-bar ${actualWant > budgetWant ? 'danger' : 'warning'}`} style={{ width: `${Math.min(100, (actualWant / budgetWant || 0) * 100)}%`, backgroundColor: actualWant > budgetWant ? '' : '#f59e0b' }}></div>
            </div>
          </div>

          <div className="variance-item">
            <div className="v-labels">
              <span className="v-title">Savings ({settings.savingsPercentage || 20}%)</span>
              <span className="v-amounts">₹{actualSaving} / ₹{budgetSaving}</span>
            </div>
            <div className="budget-progress">
              <div className="progress-bar success" style={{ width: `${Math.min(100, (actualSaving / budgetSaving || 0) * 100)}%`, backgroundColor: '#10b981' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Account Balances Grid */}
      {(() => {
        const bankBalances = {};
        if (settings?.banks) {
          settings.banks.forEach(b => {
            bankBalances[b.name] = { name: b.name, credited: 0, spent: 0, balance: 0 };
          });
        }
        
        transactions.forEach(t => {
          const tBank = t.bank || 'Cash / Wallet';
          if (!(tBank in bankBalances)) {
            bankBalances[tBank] = { name: tBank, credited: 0, spent: 0, balance: 0 };
          }
          
          if (t.type === 'Income') {
            bankBalances[tBank].credited += t.amount;
            bankBalances[tBank].balance += t.amount;
          } else if (['Need', 'Want', 'expense'].includes(t.type)) {
            bankBalances[tBank].spent += t.amount;
            bankBalances[tBank].balance -= t.amount;
          }
        });

        const bankList = Object.values(bankBalances);

        return (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>
              <Landmark color="var(--primary-color)" size={20} /> Bank Account & Wallet Balances
            </h3>
            <p className="helper-text" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Real-time balance aggregations computed directly across all transaction history categories logged for each bank profile.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {bankList.map((b, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'rgba(255, 255, 255, 0.015)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '12px',
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{b.name}</h4>
                    <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', fontWeight: 'bold' }}>Linked</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Credited (Inflow):</span>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>+₹{b.credited.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Spent (Outflow):</span>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>-₹{b.spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Net Balance:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: b.balance >= 0 ? '#10b981' : '#ef4444' }}>
                      ₹{b.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
