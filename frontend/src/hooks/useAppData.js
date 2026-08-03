import { useCallback, useEffect, useState } from "react";
import { setAuthToken, settingsApi, transactionsApi } from "../services/api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_KEY);

  try {
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const useAppData = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(getStoredUser);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);

  const handleLogout = useCallback(() => {
    setToken("");
    setUser(null);
    setSettings(null);
    setTransactions([]);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthToken("");
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data } = await transactionsApi.list();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (error.response?.status === 401) handleLogout();
    }
  }, [handleLogout]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await settingsApi.get();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      if (error.response?.status === 401) handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    if (!token) {
      setAuthToken("");
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    fetchTransactions();
    fetchSettings();
  }, [token, fetchSettings, fetchTransactions]);

  const saveUser = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  return {
    token,
    setToken,
    user,
    saveUser,
    transactions,
    settings,
    fetchTransactions,
    fetchSettings,
    handleLogout,
  };
};
