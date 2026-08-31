import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};

export const authApi = {
  login: (credentials) => apiClient.post("/auth/login", credentials),
  register: (credentials) => apiClient.post("/auth/register", credentials),
};

export const transactionsApi = {
  list: () => apiClient.get("/transactions"),
  create: (transaction) => apiClient.post("/transactions", transaction),
  update: (id, transaction) => apiClient.put(`/transactions/${id}`, transaction),
  remove: (id) => apiClient.delete(`/transactions/${id}`),
  recordReimbursement: (id, reimbursement) =>
    apiClient.post(`/transactions/${id}/reimburse`, reimbursement),
  recordReimbursements: (id, reimbursements) =>
    apiClient.post(`/transactions/${id}/reimbursements`, { reimbursements }),
};

export const settingsApi = {
  get: () => apiClient.get("/settings"),
  update: (settings) => apiClient.post("/settings", settings),
  sendWeeklyReport: () => apiClient.post("/settings/send-weekly-report"),
  sendMonthlyReport: () => apiClient.post("/settings/send-monthly-report"),
  startMonth: (month, initialBalance) =>
    apiClient.post("/settings/start-month", { month, initialBalance }),
};

export const reportsApi = {
  email: (report) => apiClient.post("/reports/email", report),
};
