import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { AuthPage as Auth } from '../features/auth';
import { DashboardPage as Dashboard } from '../features/dashboard';
import { SettingsPage as Setup } from '../features/settings';
import { DailyTrackerPage as DailyTracker } from '../features/transactions';
import { IncomeTrackerPage as IncomeTracker } from '../features/income';
import {
  MonthlyAnalysisPage as MonthlyAnalysis,
  WeeklyAnalysisPage as WeeklyAnalysis,
  YearlyCalendarPage as YearlyCalendar,
} from '../features/analytics';
import { ReportsPage as ReportsAndDiagnostics } from '../features/reports';
import { Analytics } from "@vercel/analytics/react";
import { Menu } from 'lucide-react';
import InstallPrompt from '../components/InstallPrompt';
import { useAppData } from '../hooks/useAppData';
import './App.css';

function App() {
  const {
    token,
    setToken,
    user,
    saveUser,
    transactions,
    settings,
    fetchTransactions,
    fetchSettings,
    handleLogout,
  } = useAppData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!token) {
    return (
      <>
        <Auth setToken={setToken} setUser={saveUser} />
        <InstallPrompt />
        <Analytics />
      </>
    );
  }

  if (!settings) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '1.25rem', fontWeight: '800', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ExTracker</span>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your financial data...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} settings={settings} />;
      case 'dailyTracker':
        return <DailyTracker transactions={transactions} settings={settings} fetchTransactions={fetchTransactions} />;
      case 'incomeTracker':
        return <IncomeTracker transactions={transactions} settings={settings} fetchTransactions={fetchTransactions} />;
      case 'monthlyAnalysis':
        return <MonthlyAnalysis transactions={transactions} settings={settings} />;
      case 'weeklyAnalysis':
        return <WeeklyAnalysis transactions={transactions} settings={settings} />;
      case 'yearlyCalendar':
        return <YearlyCalendar transactions={transactions} />;
      case 'reports':
        return <ReportsAndDiagnostics transactions={transactions} settings={settings} user={user} />;
      case 'setup':
        return <Setup settings={settings} fetchSettings={fetchSettings} user={user} />;
      default:
        return <Dashboard transactions={transactions} settings={settings} />;
    }
  };

  return (
    <div className="app-wrapper">
      <header className="mobile-header">
        <button className="menu-toggle-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>
        <span className="mobile-title">ExTracker</span>
        <div style={{ width: 24 }}></div>
      </header>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }} 
        handleLogout={handleLogout} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
      />
      <div className="main-content">
        {renderContent()}
      </div>
      <Analytics />
      <InstallPrompt />
    </div>
  );
}

export default App;
