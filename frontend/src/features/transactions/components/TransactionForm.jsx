import React, { useEffect, useMemo, useState } from "react";
import { transactionsApi } from "../../../services/api";
import { Split, X } from "lucide-react";
import { getLocalDateString } from "../../../utils/dateUtils";
import DateInput from "../../../components/DateInput";
import SplitExpensePanel from "./SplitExpensePanel";
import { parseNumberOnBlur } from "./utils";
import {
  buildEqualMembers,
  buildPercentageMembers,
  calculateCustomSplit,
  calculateSplit,
  getMembersTotal,
  getMembersPercentage,
  hasValidMemberAllocation,
} from "../utils/splitCalculations";

const buildDefaultFormData = (settings) => {
  const defaultCategory = settings?.categories?.[0]?.name || "";
  const defaultBank = settings?.banks?.[0];
  return {
    description: "",
    amount: "",
    category: defaultCategory,
    type: "Need",
    bank: defaultBank?.name || "",
    paymentMode: defaultBank?.services?.[0] || "",
    date: getLocalDateString(),
  };
};

const TransactionForm = ({ settings, fetchTransactions, editingTransaction, onUpdate, onCancelEdit, onSaved }) => {
  const [formData, setFormData] = useState(buildDefaultFormData(settings));
  const [isSplit, setIsSplit] = useState(false);
  const [splitMethod, setSplitMethod] = useState("equal");
  const [numPeople, setNumPeople] = useState("2");
  const [alreadyPaidBack, setAlreadyPaidBack] = useState(false);
  const [members, setMembers] = useState([{ name: "", amount: "" }]);
  const [isFormOpen, setIsFormOpen] = useState(Boolean(editingTransaction));

  useEffect(() => {
    if (editingTransaction) setIsFormOpen(true);
  }, [editingTransaction]);

  useEffect(() => {
    if (!settings) return;
    setFormData((prev) => ({
      ...prev,
      category: prev.category || settings.categories?.[0]?.name || "",
      bank: prev.bank || settings.banks?.[0]?.name || "",
      paymentMode: prev.paymentMode || settings.banks?.[0]?.services?.[0] || "",
    }));
  }, [settings]);

  useEffect(() => {
    if (!editingTransaction) return;
    setFormData({
      description: editingTransaction.description || "",
      amount: String(editingTransaction.amount ?? ""),
      category: editingTransaction.category || "",
      type: editingTransaction.type || "Need",
      bank: editingTransaction.bank || "",
      paymentMode: editingTransaction.paymentMode || "",
      date: String(editingTransaction.date || "").slice(0, 10),
      notes: editingTransaction.notes || "",
    });
    setIsSplit(Boolean(editingTransaction.isSplit));
    setSplitMethod(editingTransaction.splitMethod || "equal");
    setNumPeople(String((editingTransaction.splitMembers?.length || 1) + 1));
    setMembers((editingTransaction.splitMembers || []).map((member) => ({
      name: member.name || "",
      amount: String(member.amount ?? ""),
      percentage: String(member.percentage ?? ""),
    })));
  }, [editingTransaction]);

  const totalAmountVal = Number(formData.amount) || 0;

  const closeForm = () => {
    setIsFormOpen(false);
    onCancelEdit?.();
  };

  useEffect(() => {
    if (splitMethod === "equal") {
      setMembers((previous) =>
        buildEqualMembers(totalAmountVal, numPeople, previous),
      );
    } else if (splitMethod === "percentage") {
      setMembers((previous) => buildPercentageMembers(totalAmountVal, previous));
    }
  }, [splitMethod, numPeople, totalAmountVal]);

  const splitCalculation = useMemo(() => {
    if (splitMethod === "equal") {
      return calculateSplit({
        totalAmount: totalAmountVal,
        method: "equal",
        peopleCount: numPeople,
      });
    }
    return calculateCustomSplit(totalAmountVal, members);
  }, [splitMethod, totalAmountVal, numPeople, members]);
  const calculatedMyShare = isSplit ? splitCalculation.myShare : totalAmountVal;
  const calculatedRecoverable = isSplit ? splitCalculation.recoverable : 0;
  const membersTotal = getMembersTotal(members);
  const membersPercentage = getMembersPercentage(members);
  const memberAllocationValid =
    !isSplit ||
    (members.length > 0 &&
      members.every((member) => member.name.trim()) &&
      (splitMethod !== "percentage" || membersPercentage <= 100) &&
      calculatedMyShare >= 0 &&
      hasValidMemberAllocation(members, calculatedRecoverable));

  const handleBankChange = (bankName) => {
    const bankObj = settings?.banks?.find((bank) => bank.name === bankName);
    const currentPM = formData.paymentMode;
    const supportsCurrentPM = bankObj?.services?.includes(currentPM);
    const paymentMode = supportsCurrentPM
      ? currentPM
      : bankObj?.services?.[0] || "";

    setFormData((prev) => ({
      ...prev,
      bank: bankName,
      paymentMode,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "bank") {
      handleBankChange(value);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedAmount = Number(formData.amount);

    if (
      isSplit &&
      (calculatedMyShare < 0 || calculatedMyShare > parsedAmount)
    ) {
      alert("My Share must be between ₹0 and Total Amount Paid.");
      return;
    }
    if (isSplit && calculatedRecoverable > 0 && !memberAllocationValid) {
      alert(
        `People's shares must add up to the recoverable amount (₹${calculatedRecoverable.toFixed(2)}).`,
      );
      return;
    }

    try {
      const splitMembersPayload = isSplit
        ? members.map((member) => ({
            name: member.name.trim(),
            amount: Number(member.amount) || 0,
            percentage: Number(member.percentage) || 0,
          }))
        : [];

      const splitWithString = isSplit
        ? members
            .map((m) => m.name.trim())
            .filter(Boolean)
            .join(", ")
        : "";

      const payload = {
        ...formData,
        amount: parsedAmount,
        isSplit,
        splitMethod,
        splitWith: splitWithString,
        splitMembers: splitMembersPayload,
        myShare: isSplit ? calculatedMyShare : parsedAmount,
        recoverableAmount: isSplit ? calculatedRecoverable : 0,
      };

      if (editingTransaction) {
        await onUpdate(editingTransaction._id, payload);
        setIsFormOpen(false);
        return;
      }

      const createdRes = await transactionsApi.create(payload);
      const createdId = createdRes.data._id || createdRes.data.id;

      if (
        isSplit &&
        alreadyPaidBack &&
        calculatedRecoverable > 0 &&
        createdId
      ) {
        await transactionsApi.recordReimbursements(
          createdId,
          splitMembersPayload.map((member) => ({
            amount: member.amount,
            date: formData.date,
            notes: "Paid back at time of expense",
            bank: formData.bank,
            paymentMode: formData.paymentMode,
            personName: member.name,
          })),
        );
      }

      fetchTransactions();
      onSaved?.(formData.date);
      setIsFormOpen(false);
      setFormData(buildDefaultFormData(settings));
      setIsSplit(false);
      setSplitMethod("equal");
      setNumPeople("2");
      setMembers([{ name: "", amount: "" }]);
      setAlreadyPaidBack(false);
      alert("Transaction added!");
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert(error.response?.data?.message || "Unable to add transaction.");
    }
  };

  const selectedBank = settings?.banks?.find(
    (bank) => bank.name === formData.bank,
  );
  const supportedServices = selectedBank?.services ||
    settings?.paymentModes || [
      "UPI",
      "Debit Card",
      "Credit Card",
      "Bank Transfer",
      "Cash",
    ];

  return (
    <>
      {!editingTransaction && !isFormOpen && (
        <button
          type="button"
          className="btn-primary data-entry-trigger"
          onClick={() => setIsFormOpen(true)}
        >
          Add Transaction
        </button>
      )}
      {(editingTransaction || isFormOpen) && (
        <div className="data-entry-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
          <div className="card data-entry-modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-form-title">
      <div className="data-entry-header">
        <div>
          <h3 id="transaction-form-title">{editingTransaction ? "Edit Transaction" : "Add Transaction"}</h3>
          <p>Enter the transaction details below.</p>
        </div>
        <div className="data-entry-header-actions">
          {editingTransaction && <span className="data-entry-status">Editing</span>}
          <button type="button" className="data-entry-close" onClick={closeForm} aria-label="Close transaction form">
            <X size={18} />
          </button>
        </div>
      </div>
      <form className="data-entry-form" onSubmit={handleSubmit}>
        <div
          className="form-row"
          style={{
            paddingBottom: "0.75rem",
            marginBottom: "1.25rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="form-group flex-1">
            <label>Date</label>
            <DateInput
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ flex: 2 }}>
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="e.g. Swiggy dinner"
            />
          </div>

          <div className="form-group flex-1">
            <label>{isSplit ? "Total Paid (₹)" : "Amount (₹)"}</label>
            <input
              type="text"
              inputMode="decimal"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              onBlur={() =>
                parseNumberOnBlur(formData.amount, (clean) =>
                  setFormData((prev) => ({ ...prev, amount: clean })),
                )
              }
              required
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {settings.categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group flex-1">
            <label>Bank / Wallet</label>
            <select
              name="bank"
              value={formData.bank}
              onChange={handleChange}
              required
            >
              {settings.banks?.map((bank) => (
                <option key={bank.name} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group flex-1">
            <label>Payment Mode</label>
            <select
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handleChange}
            >
              {supportedServices.map((paymentMode) => (
                <option key={paymentMode} value={paymentMode}>
                  {paymentMode}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px dashed var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: isSplit ? "1rem" : 0,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                cursor: "pointer",
                fontSize: "0.9rem",
                color: "var(--text-main)",
                fontWeight: "600",
              }}
            >
              <input
                type="checkbox"
                checked={isSplit}
                onChange={(e) => setIsSplit(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--primary-color)",
                  cursor: "pointer",
                }}
              />
              <Split size={16} color="var(--primary-color)" /> Split Expense
              (Paid on behalf of others)
            </label>
            {isSplit && (
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Total Paid:{" "}
                <strong style={{ color: "var(--text-main)" }}>
                  ₹{totalAmountVal.toFixed(2)}
                </strong>
              </span>
            )}
          </div>

          {isSplit && (
            <SplitExpensePanel
              splitMethod={splitMethod}
              setSplitMethod={setSplitMethod}
              numPeople={numPeople}
              setNumPeople={setNumPeople}
              members={members}
              setMembers={setMembers}
              totalAmountVal={totalAmountVal}
              calculatedMyShare={calculatedMyShare}
              calculatedRecoverable={calculatedRecoverable}
              membersTotal={membersTotal}
              membersPercentage={membersPercentage}
              memberAllocationValid={memberAllocationValid}
              alreadyPaidBack={alreadyPaidBack}
              setAlreadyPaidBack={setAlreadyPaidBack}
              parseNumberOnBlur={parseNumberOnBlur}
            />
          )}
        </div>

        <div style={{ marginTop: "1.25rem" }}>
          <button
            type="submit"
            className="btn-primary"
            style={{ maxWidth: "240px" }}
          >
            {editingTransaction ? "Save Changes" : "Add Transaction"}
          </button>
          {editingTransaction && (
            <button
              type="button"
              className="btn-secondary"
              onClick={closeForm}
              style={{ marginLeft: "0.75rem", maxWidth: "160px" }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionForm;
