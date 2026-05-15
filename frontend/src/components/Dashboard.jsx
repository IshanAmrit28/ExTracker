import { Activity, Target, Wallet, TrendingDown, Landmark, PieChart } from 'lucide-react';

const Dashboard = ({ transactions, settings }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
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
    </div>
  );
};

export default Dashboard;
