import React from "react";
import TransactionRow from "./TransactionRow";
import { formatMonthLabel } from "./utils";
import { formatDateDisplay } from "../../../utils/dateUtils";

const selectStyle = {
  padding: "6px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  backgroundColor: "rgba(255, 255, 255, 0.02)",
  color: "var(--text-main)",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const TransactionTable = ({
  settings,
  filteredTransactions,
  availableMonths,
  selectedMonth,
  setSelectedMonth,
  filterBank,
  setFilterBank,
  handleDelete,
  onEdit,
  expandedTxId,
  onToggleTransaction,
  reimbursementState,
  handleRecordReimbursement,
  totalOutflow,
  totalInflow,
}) => {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h3 style={{ margin: 0 }}>Transactions Log</h3>
          <span
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              fontWeight: "normal",
            }}
          >
            — {formatMonthLabel(selectedMonth)}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              Month:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={selectStyle}
            >
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthLabel(monthKey)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              Account:
            </label>
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              style={selectStyle}
            >
              <option value="All">All Accounts</option>
              {settings.banks?.map((bank) => (
                <option key={bank.name} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredTransactions.length > 0 && (
        <div
          style={{
            marginBottom: "1.25rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              borderLeft: "3px solid #ef4444",
              borderRadius: "8px",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>
              Outflow (My Share):{" "}
            </span>
            <strong style={{ color: "#ef4444" }}>
              -₹
              {totalOutflow.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </strong>
          </div>
          {totalInflow > 0 && (
            <div
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.15)",
                borderLeft: "3px solid #22c55e",
                borderRadius: "8px",
                fontSize: "0.85rem",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Inflow: </span>
              <strong style={{ color: "#22c55e" }}>
                +₹
                {totalInflow.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>
          )}
          <div
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderLeft: "3px solid var(--primary-color)",
              borderRadius: "8px",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>
              {filteredTransactions.length} transactions
            </span>
          </div>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-muted)",
          }}
        >
          No transactions found for {formatMonthLabel(selectedMonth)}.
        </div>
      ) : (
        <div
          className="table-responsive"
          style={{ maxHeight: "560px", overflowY: "auto" }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>My Share / Amount</th>
                <th>Bank</th>
                <th>Payment Mode</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction._id}
                  transaction={transaction}
                  isExpanded={expandedTxId === transaction._id}
                  onToggleExpand={onToggleTransaction}
                  onDelete={handleDelete}
                  onEdit={onEdit}
                  reimbursementState={reimbursementState}
                  onRecordReimbursement={handleRecordReimbursement}
                  formatDateDisplay={formatDateDisplay}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
