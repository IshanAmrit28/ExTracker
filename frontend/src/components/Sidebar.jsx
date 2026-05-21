import { LayoutDashboard, Receipt, BarChart3, PieChart, CalendarDays, Settings, LogOut, Banknote, X } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, handleLogout, isOpen, setIsOpen }) => {
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)}></div>}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>FinanceTracker</h1>
          <button className="sidebar-close-btn" onClick={() => setIsOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
      <nav className="nav-menu" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button className={`nav-item ${activeTab === 'dailyTracker' ? 'active' : ''}`} onClick={() => setActiveTab('dailyTracker')}>
          <Receipt size={20} />
          <span>Daily Tracker</span>
        </button>
        <button className={`nav-item ${activeTab === 'incomeTracker' ? 'active' : ''}`} onClick={() => setActiveTab('incomeTracker')}>
          <Banknote size={20} />
          <span>Income Tracker</span>
        </button>
        <button className={`nav-item ${activeTab === 'weeklyAnalysis' ? 'active' : ''}`} onClick={() => setActiveTab('weeklyAnalysis')}>
          <BarChart3 size={20} />
          <span>Weekly Analysis</span>
        </button>
        <button className={`nav-item ${activeTab === 'monthlyAnalysis' ? 'active' : ''}`} onClick={() => setActiveTab('monthlyAnalysis')}>
          <PieChart size={20} />
          <span>Monthly Analysis</span>
        </button>
        <button className={`nav-item ${activeTab === 'yearlyCalendar' ? 'active' : ''}`} onClick={() => setActiveTab('yearlyCalendar')}>
          <CalendarDays size={20} />
          <span>Yearly Calendar</span>
        </button>
        <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <PieChart size={20} />
          <span>Reports & Diagnostics</span>
        </button>
        <button className={`nav-item ${activeTab === 'setup' ? 'active' : ''}`} onClick={() => setActiveTab('setup')}>
          <Settings size={20} />
          <span>Setup</span>
        </button>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
    </>
  );
};

export default Sidebar;
