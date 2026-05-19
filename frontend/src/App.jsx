import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Setup from './components/Setup';
import DailyTracker from './components/DailyTracker';
import IncomeTracker from './components/IncomeTracker';
import MonthlyAnalysis from './components/MonthlyAnalysis';
import WeeklyAnalysis from './components/WeeklyAnalysis';
import YearlyCalendar from './components/YearlyCalendar';
import Auth from './components/Auth';
import { Analytics } from "@vercel/analytics/react";
import { Menu } from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/transactions`;
const SETTINGS_URL = `${API_BASE_URL}/api/settings`;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchTransactions();
      fetchSettings();
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(API_URL);
      setTransactions(res.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(SETTINGS_URL);
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleLogout = () => {
    setToken('');
    setSettings(null);
    setTransactions([]);
  };

  if (!token) {
    return (
      <>
        <Auth setToken={setToken} />
        <Analytics />
      </>
    );
  }

  if (!settings) return <div className="loading" style={{color: 'white', textAlign: 'center', marginTop: '5rem'}}>Loading Finance Tracker...</div>;

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
      case 'setup':
        return <Setup settings={settings} fetchSettings={fetchSettings} />;
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
        <span className="mobile-title">FinanceTracker</span>
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
      />
      <div className="main-content">
        {renderContent()}
      </div>
      <Analytics />
    </div>
  );
}

export default App;
