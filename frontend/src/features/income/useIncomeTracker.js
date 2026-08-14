import { useMemo, useState } from "react";
import { transactionsApi } from "../../services/api";
import { getLocalDateString } from "../../utils/dateUtils";
import {
  formatMonthLabel,
  getCurrentMonthKey,
  getMonthKey,
} from "../../utils/finance/dates";

const createInitialForm = (settings, date = getLocalDateString()) => {
  const defaultBank = settings?.banks?.[0];
  return {
    description: "",
    amount: "",
    category: "Income",
    type: "Income",
    bank: defaultBank?.name || "",
    paymentMode: defaultBank?.services?.[0] || "",
    date,
  };
};

const filterEntries = (entries, selectedMonth, filterBank) =>
  entries
    .filter((transaction) => {
      const matchMonth = getMonthKey(transaction.date) === selectedMonth;
      const matchBank =
        filterBank === "All" ||
        (transaction.bank || "").toLowerCase() === filterBank.toLowerCase();
      return matchMonth && matchBank;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

export const useIncomeTracker = ({ transactions, settings, fetchTransactions }) => {
  const [filterBank, setFilterBank] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [formData, setFormData] = useState(() => createInitialForm(settings));
  const [editingTransaction, setEditingTransaction] = useState(null);

  const startEditing = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description || "",
      amount: String(transaction.amount ?? ""),
      category: transaction.category || "Income",
      type: transaction.type || "Income",
      bank: transaction.bank || "",
      paymentMode: transaction.paymentMode || "",
      date: String(transaction.date || "").slice(0, 10),
    });
  };

  const cancelEditing = () => {
    setEditingTransaction(null);
    setFormData((previous) => createInitialForm(settings, previous.date));
  };

  const handleBankChange = (bankName) => {
    const bank = settings?.banks?.find((item) => item.name === bankName);
    setFormData((previous) => {
      if (!bank) return { ...previous, bank: bankName };
      const paymentMode = bank.services.includes(previous.paymentMode)
        ? previous.paymentMode
        : bank.services[0] || "";
      return { ...previous, bank: bankName, paymentMode };
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "bank") {
      handleBankChange(value);
      return;
    }
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingTransaction) {
        await transactionsApi.update(editingTransaction._id, formData);
        setEditingTransaction(null);
        await fetchTransactions();
        setFormData((previous) => createInitialForm(settings, previous.date));
        alert("Income updated!");
        return;
      }
      await transactionsApi.create(formData);
      await fetchTransactions();
      setFormData((previous) => createInitialForm(settings, previous.date));
      alert("Income added!");
    } catch (error) {
      console.error("Error adding income:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await transactionsApi.remove(id);
      await fetchTransactions();
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  const incomeTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type === "Income"),
    [transactions],
  );
  const reimbursementTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type === "Reimbursement"),
    [transactions],
  );
  const availableMonths = useMemo(() => {
    const entries = [...incomeTransactions, ...reimbursementTransactions];
    const months = new Set(entries.map((entry) => getMonthKey(entry.date)).filter(Boolean));
    const sorted = Array.from(months).sort((a, b) => b.localeCompare(a));
    const currentMonth = getCurrentMonthKey();
    if (!months.has(currentMonth)) sorted.unshift(currentMonth);
    return sorted;
  }, [incomeTransactions, reimbursementTransactions]);
  const filteredIncome = useMemo(
    () => filterEntries(incomeTransactions, selectedMonth, filterBank),
    [incomeTransactions, selectedMonth, filterBank],
  );
  const filteredReimbursements = useMemo(
    () => filterEntries(reimbursementTransactions, selectedMonth, filterBank),
    [reimbursementTransactions, selectedMonth, filterBank],
  );
  const allFiltered = [...filteredIncome, ...filteredReimbursements].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  const totalInflow = filteredIncome.reduce((total, transaction) => total + transaction.amount, 0);
  const totalReimbursed = filteredReimbursements.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  return {
    filterBank,
    setFilterBank,
    selectedMonth,
    setSelectedMonth,
    formData,
    setFormData,
    editingTransaction,
    startEditing,
    cancelEditing,
    handleChange,
    handleSubmit,
    handleDelete,
    availableMonths,
    filteredIncome,
    filteredReimbursements,
    allFiltered,
    totalInflow,
    totalReimbursed,
    currentMonthKey: getCurrentMonthKey(),
    formatMonthLabel,
  };
};
