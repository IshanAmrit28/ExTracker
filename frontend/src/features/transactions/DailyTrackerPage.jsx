import React, { useMemo, useState } from "react";
import { transactionsApi } from "../../services/api";
import TransactionForm from "./components/TransactionForm";
import SmartBudgetWidget from "./components/SmartBudgetWidget";
import TransactionTable from "./components/TransactionTable";
import { getMonthKey, getCurrentMonthKey } from "./components/utils";
import { getLocalDateString } from "../../utils/dateUtils";

const DailyTracker = ({ transactions, settings, fetchTransactions }) => {
  const [filterBank, setFilterBank] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [reimbursePerson, setReimbursePerson] = useState("");
  const [reimburseAmount, setReimburseAmount] = useState("");
  const [reimburseDate, setReimburseDate] = useState(getLocalDateString());
  const [reimburseNotes, setReimburseNotes] = useState("");
  const [submittingReimburse, setSubmittingReimburse] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const availableMonths = useMemo(() => {
    const keys = new Set(
      transactions.map((tx) => getMonthKey(tx.date)).filter(Boolean),
    );
    const sorted = Array.from(keys).sort((a, b) => b.localeCompare(a));
    const currentMonth = getCurrentMonthKey();
    if (!keys.has(currentMonth)) sorted.unshift(currentMonth);
    return sorted;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (tx.type === "Reimbursement") return false;
        const matchMonth = getMonthKey(tx.date) === selectedMonth;
        const matchBank =
          filterBank === "All" ||
          (tx.bank || "").toLowerCase() === filterBank.toLowerCase();
        return matchMonth && matchBank;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, selectedMonth, filterBank]);

  const totalOutflow = useMemo(
    () =>
      filteredTransactions
        .filter((tx) => ["Need", "Want", "expense"].includes(tx.type))
        .reduce(
          (sum, tx) =>
            sum + (tx.isSplit && tx.myShare != null ? tx.myShare : tx.amount),
          0,
        ),
    [filteredTransactions],
  );

  const totalInflow = useMemo(
    () =>
      filteredTransactions
        .filter((tx) => tx.type === "Income")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [filteredTransactions],
  );

  const handleDelete = async (id) => {
    try {
      await transactionsApi.remove(id);
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert(error.response?.data?.message || "Unable to delete transaction.");
    }
  };

  const handleRecordReimbursement = async (txId, maxAmount, requiresPerson) => {
    const amt = Number(reimburseAmount);
    if (requiresPerson && !reimbursePerson) {
      alert("Choose the person who made this reimbursement.");
      return;
    }
    if (!amt || amt <= 0) {
      alert("Please enter a valid reimbursement amount.");
      return;
    }
    if (amt > maxAmount + 0.01) {
      alert(`Reimbursement amount (₹${amt}) cannot exceed outstanding amount (₹${maxAmount.toFixed(2)}).`);
      return;
    }

    setSubmittingReimburse(true);

    try {
      const parentTx = transactions.find((tx) => tx._id === txId);

      await transactionsApi.recordReimbursement(txId, {
        amount: amt,
        date: reimburseDate,
        notes: reimburseNotes,
        personName: reimbursePerson,
        bank: parentTx?.bank || "",
        paymentMode: parentTx?.paymentMode || "UPI",
      });

      fetchTransactions();
      setReimburseAmount("");
      setReimburseNotes("");
      setReimbursePerson("");
      alert("Reimbursement recorded successfully!");
    } catch (error) {
      console.error("Error recording reimbursement:", error);
      alert(error.response?.data?.message || "Failed to record reimbursement");
    } finally {
      setSubmittingReimburse(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await transactionsApi.update(id, payload);
      await fetchTransactions();
      setEditingTransaction(null);
      alert("Transaction updated!");
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert(error.response?.data?.message || "Unable to update transaction.");
      throw error;
    }
  };

  const handleToggleTransaction = (id) => {
    setExpandedTxId((current) => (current === id ? null : id));
    setReimbursePerson("");
    setReimburseAmount("");
    setReimburseNotes("");
  };

  const reimbursementState = {
    reimbursePerson,
    reimburseAmount,
    reimburseDate,
    reimburseNotes,
    setReimbursePerson,
    setReimburseAmount,
    setReimburseDate,
    setReimburseNotes,
    submittingReimburse,
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Daily Expense Tracker</h2>
        <p>Log your daily activities. Choose your category, type, and bank account details.</p>
      </header>

      <SmartBudgetWidget transactions={transactions} settings={settings} />

      <TransactionForm
        settings={settings}
        fetchTransactions={fetchTransactions}
        editingTransaction={editingTransaction}
        onUpdate={handleUpdate}
        onCancelEdit={() => setEditingTransaction(null)}
      />

      <TransactionTable
        settings={settings}
        filteredTransactions={filteredTransactions}
        availableMonths={availableMonths}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        filterBank={filterBank}
        setFilterBank={setFilterBank}
        handleDelete={handleDelete}
        onEdit={setEditingTransaction}
        expandedTxId={expandedTxId}
        onToggleTransaction={handleToggleTransaction}
        reimbursementState={reimbursementState}
        handleRecordReimbursement={handleRecordReimbursement}
        totalOutflow={totalOutflow}
        totalInflow={totalInflow}
      />
    </div>
  );
};

export default DailyTracker;
