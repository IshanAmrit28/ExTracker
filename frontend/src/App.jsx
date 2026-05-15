import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Setup from './components/Setup';
import DailyTracker from './components/DailyTracker';
import MonthlyAnalysis from './components/MonthlyAnalysis';
import WeeklyAnalysis from './components/WeeklyAnalysis';
import YearlyCalendar from './components/YearlyCalendar';
import Auth from './components/Auth';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/_/backend';
const API_URL = `${API_BASE_URL}/api/transactions`;
const SETTINGS_URL = `${API_BASE_URL}/api/settings`;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);

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
    return <Auth setToken={setToken} />;
  }

  if (!settings) return <div className="loading" style={{color: 'white', textAlign: 'center', marginTop: '5rem'}}>Loading Finance Tracker...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} settings={settings} />;
      case 'dailyTracker':
        return <DailyTracker transactions={transactions} settings={settings} fetchTransactions={fetchTransactions} />;
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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
