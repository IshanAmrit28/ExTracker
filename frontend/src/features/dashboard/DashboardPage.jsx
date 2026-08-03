import { Activity, Target, Wallet, TrendingDown, Landmark, PieChart, Receipt } from 'lucide-react';
import { getCurrentMonthKey, getMonthKey } from '../../utils/finance/dates';
import { getExpenseShare, isExpense, isIncome } from '../../utils/finance/transactions';

const Dashboard = ({ transactions, settings }) => {
  const currentMonth = getCurrentMonthKey();
  const thisMonthTx = transactions.filter(t => getMonthKey(t.date) === currentMonth);

  const actualNeed = thisMonthTx.filter(t => t.type === 'Need' || t.type === 'expense').reduce((acc, curr) => acc + getExpenseShare(curr), 0);
  const actualWant = thisMonthTx.filter(t => t.type === 'Want').reduce((acc, curr) => acc + getExpenseShare(curr), 0);
  const actualSaving = thisMonthTx.filter(t => t.type === 'Saving').reduce((acc, curr) => acc + getExpenseShare(curr), 0);

  const totalCreditedThisMonth = thisMonthTx.filter(isIncome).reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpentThisMonth = actualNeed + actualWant;
  const monthlyBudget = Number(settings.monthlyLimit) || 0;
  const budgetLeftThisMonth = monthlyBudget > 0
    ? monthlyBudget - totalSpentThisMonth
    : 0;
  const percentBudgetLeft = monthlyBudget > 0
    ? Math.round((budgetLeftThisMonth / monthlyBudget) * 100)
    : 0;

  const totalAllTimeCredited = transactions.filter(isIncome).reduce((acc, curr) => acc + curr.amount, 0);
  const totalAllTimeSpent = transactions.filter(isExpense).reduce((acc, curr) => acc + getExpenseShare(curr), 0);
  const overallLeft = totalAllTimeCredited - totalAllTimeSpent;

  // Outstanding Reimbursements total across all pending/partial split transactions
  const totalOutstandingReimbursements = transactions
    .filter(t => t.isSplit && t.reimbursementStatus !== 'Completed')
    .reduce((acc, curr) => acc + Math.max(0, (curr.recoverableAmount || 0) - (curr.reimbursedAmount || 0)), 0);

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

  const scoreColor = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Calc Summary</h2>
        <p>Your overarching Budget vs Actual overview</p>
      </header>

      {/* Top Stat Cards */}
      <div className="account-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
              <Wallet size={22} />
            </div>
            <div className="stat-value" style={{ color: '#22c55e' }}>
              ₹{totalCreditedThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Credited This Month</div>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <TrendingDown size={22} />
            </div>
            <div className="stat-value" style={{ color: '#ef4444' }}>
              ₹{totalSpentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Spent This Month</div>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <PieChart size={22} />
            </div>
            <div className="stat-value" style={{ color: budgetLeftThisMonth < 0 ? '#ef4444' : '#3b82f6' }}>
              ₹{budgetLeftThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-label">
              Budget Left to Spend <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({percentBudgetLeft}%)</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Landmark size={22} />
            </div>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>
              ₹{overallLeft.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Total Overall Balance</div>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}>
              <Receipt size={22} />
            </div>
            <div className="stat-value" style={{ color: '#f97316' }}>
              ₹{totalOutstandingReimbursements.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Outstanding Reimbursements</div>
          </div>
        </div>
      </div>

      <div className="top-metrics">
        {/* Score Card with dynamic conic-gradient ring */}
        <div className="score-card">
          <div className="score-header">
            <Activity size={24} color={scoreColor} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Financial Score</h2>
          </div>
          <div 
            className="score-circle" 
            style={{ 
              background: `conic-gradient(${scoreColor} 0% ${score}%, var(--border) ${score}% 100%)`,
              padding: '8px'
            }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="score-value" style={{ color: scoreColor }}>{score}</div>
              <div className="score-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</div>
            </div>
          </div>
        </div>

        {/* Budget vs Actual Variance Card */}
        <div className="budget-variance-card">
          <div className="budget-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Target size={24} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Budget vs Actual ({settings.needsPercentage || 50}:{settings.wantsPercentage || 30}:{settings.savingsPercentage || 20})</h2>
          </div>
          
          <div className="variance-item">
            <div className="v-labels">
              <span className="v-title">Needs ({settings.needsPercentage || 50}%)</span>
              <span className="v-amounts" style={{ fontWeight: '600' }}>₹{actualNeed.toLocaleString()} / ₹{budgetNeed.toLocaleString()}</span>
            </div>
            <div className="budget-progress">
              <div className={`progress-bar ${actualNeed > budgetNeed ? 'danger' : ''}`} style={{ width: `${Math.min(100, (actualNeed / (budgetNeed || 1)) * 100)}%` }}></div>
            </div>
          </div>

          <div className="variance-item">
            <div className="v-labels">
              <span className="v-title">Wants ({settings.wantsPercentage || 30}%)</span>
              <span className="v-amounts" style={{ fontWeight: '600' }}>₹{actualWant.toLocaleString()} / ₹{budgetWant.toLocaleString()}</span>
            </div>
            <div className="budget-progress">
              <div className={`progress-bar ${actualWant > budgetWant ? 'danger' : 'warning'}`} style={{ width: `${Math.min(100, (actualWant / (budgetWant || 1)) * 100)}%`, backgroundColor: actualWant > budgetWant ? '' : '#f59e0b' }}></div>
            </div>
          </div>

          <div className="variance-item" style={{ marginBottom: 0 }}>
            <div className="v-labels">
              <span className="v-title">Savings ({settings.savingsPercentage || 20}%)</span>
              <span className="v-amounts" style={{ fontWeight: '600' }}>₹{actualSaving.toLocaleString()} / ₹{budgetSaving.toLocaleString()}</span>
            </div>
            <div className="budget-progress">
              <div className="progress-bar success" style={{ width: `${Math.min(100, (actualSaving / (budgetSaving || 1)) * 100)}%`, backgroundColor: '#10b981' }}></div>
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
          const tBank = t.bank || '';
          if (!(tBank in bankBalances)) {
            bankBalances[tBank] = { name: tBank, credited: 0, spent: 0, balance: 0 };
          }
          
          if (t.type === 'Income' || t.type === 'Reimbursement') {
            bankBalances[tBank].credited += t.amount;
            bankBalances[tBank].balance += t.amount;
          } else if (['Need', 'Want', 'expense'].includes(t.type)) {
            bankBalances[tBank].spent += t.amount;
            bankBalances[tBank].balance -= t.amount;
          }
        });

        const activeBankNames = settings?.banks?.length > 0 
          ? settings.banks.map(b => b.name) 
          : [];
        const bankList = Object.values(bankBalances).filter(b => activeBankNames.includes(b.name));

        return (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              <Landmark color="var(--primary-color)" size={20} /> Bank Account & Wallet Balances
            </h3>
            <p className="helper-text" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Real-time balance aggregations computed directly across all transaction history logged per bank profile.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {bankList.map((b, idx) => {
                const isPositive = b.balance >= 0;
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '1.5rem', 
                      backgroundColor: 'rgba(255, 255, 255, 0.015)', 
                      border: '1px solid var(--border)', 
                      borderTop: `3px solid ${isPositive ? '#22c55e' : '#ef4444'}`,
                      borderRadius: '12px',
                      transition: 'transform 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem' }}>{b.name}</h4>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '100px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontWeight: 'bold' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span> Linked
                      </span>
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
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isPositive ? '#22c55e' : '#ef4444' }}>
                        ₹{b.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
