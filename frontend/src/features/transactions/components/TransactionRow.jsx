import React from "react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Pencil,
  CheckCircle,
  PlusCircle,
} from "lucide-react";
import DateInput from "../../../components/DateInput";

const getActionBadgeClass = (type) => {
  const normalizedType = (type || "").toLowerCase();
  return ["income", "reimbursement"].includes(normalizedType)
    ? "income"
    : "expense";
};

const TransactionRow = ({
  transaction,
  isExpanded,
  onToggleExpand,
  onDelete,
  onEdit,
  reimbursementState,
  onRecordReimbursement,
  formatDateDisplay,
}) => {
  const {
    reimbursePerson,
    reimburseAmount,
    reimburseDate,
    reimburseNotes,
    setReimbursePerson,
    setReimburseAmount,
    setReimburseDate,
    setReimburseNotes,
    submittingReimburse,
  } = reimbursementState;
  const myShareVal =
    transaction.isSplit && transaction.myShare != null
      ? transaction.myShare
      : transaction.amount;
  const recoverable = transaction.recoverableAmount || 0;
  const reimbursed = transaction.reimbursedAmount || 0;
  const outstanding = Math.max(0, recoverable - reimbursed);
  const isSplitTransaction = transaction.isSplit;
  const requiresPerson = transaction.splitMembers?.length > 0;

  const statusColor =
    transaction.reimbursementStatus === "Completed"
      ? "#22c55e"
      : transaction.reimbursementStatus === "Partial"
        ? "#f59e0b"
        : "#f97316";

  const statusLabel =
    transaction.reimbursementStatus ||
    (outstanding === 0 ? "Completed" : "Pending");

  const getPersonOwed = (personName) => {
    if (!transaction.splitMembers) return 0;
    const member = transaction.splitMembers.find(
      (item) => item.name.toLowerCase() === personName.toLowerCase(),
    );
    if (!member) return 0;
    return Math.max(0, member.amount - (member.reimbursedAmount || 0));
  };
  const reimbursementLimit = reimbursePerson
    ? getPersonOwed(reimbursePerson)
    : outstanding;

  return (
    <>
      <tr
        style={
          isExpanded ? { backgroundColor: "rgba(249, 115, 22, 0.05)" } : {}
        }
      >
        <td style={{ color: "var(--text-muted)" }}>
          {formatDateDisplay(transaction.date)}
        </td>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {isSplitTransaction && (
              <button
                type="button"
                onClick={() => onToggleExpand(transaction._id)}
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--primary-color)",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
                title="Toggle reimbursement details"
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            )}
            <span>{transaction.description}</span>
            {isSplitTransaction && (
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(249, 115, 22, 0.15)",
                  color: "#f97316",
                  fontWeight: "bold",
                }}
              >
                Split
                {transaction.splitWith ? ` (${transaction.splitWith})` : ""}
              </span>
            )}
          </div>
        </td>
        <td>{transaction.category}</td>
        <td className={`amount ${getActionBadgeClass(transaction.type)}`}>
          <div>₹{myShareVal.toFixed(2)}</div>
          {transaction.isSplit && (
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontWeight: "normal",
              }}
            >
              (Paid ₹{transaction.amount.toFixed(2)})
            </div>
          )}
        </td>
        <td style={{ color: "var(--primary-color)", fontWeight: "bold" }}>
          {transaction.bank || ""}
        </td>
        <td style={{ color: "#3b82f6" }}>{transaction.paymentMode}</td>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {isSplitTransaction && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onToggleExpand(transaction._id)}
                style={{
                  padding: "3px 8px",
                  fontSize: "0.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.2rem",
                }}
              >
                Reimburse
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onEdit(transaction)}
              style={{ padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
              title="Edit transaction"
            >
              <Pencil size={15} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="delete-btn"
              onClick={() => onDelete(transaction._id)}
              style={{ padding: "4px" }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>

      {isSplitTransaction && isExpanded && (
        <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}>
          <td
            colSpan="7"
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {transaction.splitWith && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--primary-color)",
                    fontWeight: "bold",
                  }}
                >
                  People Involved / Paid For:{" "}
                  <span
                    style={{ color: "var(--text-main)", fontWeight: "600" }}
                  >
                    {transaction.splitWith}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {[
                  {
                    label: "Total Paid",
                    value: `₹${transaction.amount.toFixed(2)}`,
                  },
                  {
                    label: "My Share",
                    value: `₹${myShareVal.toFixed(2)}`,
                    color: "#ef4444",
                  },
                  {
                    label: "Recoverable",
                    value: `₹${recoverable.toFixed(2)}`,
                    color: "#f97316",
                  },
                  {
                    label: "Reimbursed",
                    value: `₹${reimbursed.toFixed(2)}`,
                    color: "#22c55e",
                  },
                  {
                    label: "Outstanding",
                    value: `₹${outstanding.toFixed(2)}`,
                    color: outstanding > 0 ? "#f97316" : "#22c55e",
                  },
                  {
                    label: "Status",
                    value: statusLabel,
                    color: statusColor,
                    isStatus: true,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "0.6rem 0.8rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.2rem",
                      }}
                    >
                      {item.label}
                    </div>
                    {item.isStatus ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          backgroundColor: `${item.color}22`,
                          color: item.color,
                        }}
                      >
                        {item.value}
                      </span>
                    ) : (
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "0.95rem",
                          color: item.color || "var(--text-main)",
                        }}
                      >
                        {item.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {transaction.splitMembers &&
                transaction.splitMembers.length > 0 && (
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <h5
                      style={{
                        margin: "0 0 0.6rem",
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Per-Person Member Breakdown
                    </h5>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "0.55rem",
                      }}
                    >
                      {transaction.splitMembers.map((member, idx) => {
                        const owed = Math.max(
                          0,
                          member.amount - (member.reimbursedAmount || 0),
                        );
                        const isDone = member.isFullyReimbursed || owed <= 0.01;
                        return (
                          <div
                            key={`${member.name}-${idx}`}
                            style={{
                              padding: "0.55rem 0.75rem",
                              borderRadius: "6px",
                              backgroundColor: isDone
                                ? "rgba(34, 197, 94, 0.06)"
                                : "rgba(249, 115, 22, 0.06)",
                              border: `1px solid ${isDone ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)"}`,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: "0.82rem",
                                  fontWeight: "bold",
                                  color: "var(--text-main)",
                                }}
                              >
                                {member.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                Paid ₹
                                {(member.reimbursedAmount || 0).toFixed(2)} / ₹
                                {member.amount.toFixed(2)}
                              </div>
                            </div>
                            {!isDone ? (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                  setReimbursePerson(member.name);
                                  setReimburseAmount(owed.toFixed(2));
                                }}
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "0.72rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Collect ₹{owed.toFixed(2)}
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#22c55e",
                                  fontWeight: "bold",
                                }}
                              >
                                ✓ Paid
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {outstanding > 0 ? (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "8px",
                    backgroundColor: "rgba(249, 115, 22, 0.05)",
                    border: "1px solid rgba(249, 115, 22, 0.2)",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 0.75rem",
                      fontSize: "0.85rem",
                      color: "#f97316",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <PlusCircle size={15} /> Record Reimbursement Received
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "140px" }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          display: "block",
                          marginBottom: "0.2rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        From Person
                      </label>
                      <select
                        value={reimbursePerson}
                        onChange={(event) => {
                          const name = event.target.value;
                          setReimbursePerson(name);
                          if (name) {
                            setReimburseAmount(getPersonOwed(name).toFixed(2));
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          fontSize: "0.85rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--bg-color)",
                          color: "var(--text-main)",
                        }}
                      >
                        <option value="">
                          {requiresPerson ? "Choose a person" : "All / Unspecified"}
                        </option>
                        {transaction.splitMembers?.map((member) => {
                          const owed = getPersonOwed(member.name);
                          if (owed <= 0.01) return null;
                          return (
                            <option key={member.name} value={member.name}>
                              {member.name} (Owes ₹{owed.toFixed(2)})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: "120px" }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          display: "block",
                          marginBottom: "0.2rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Amount (₹)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={`Max ₹${reimbursementLimit.toFixed(2)}`}
                        value={reimburseAmount}
                        onChange={(event) =>
                          setReimburseAmount(event.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          fontSize: "0.85rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--bg-color)",
                          color: "var(--text-main)",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: "120px" }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          display: "block",
                          marginBottom: "0.2rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Date
                      </label>
                      <DateInput
                        value={reimburseDate}
                        onChange={(event) =>
                          setReimburseDate(event.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          fontSize: "0.85rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--bg-color)",
                          color: "var(--text-main)",
                        }}
                      />
                    </div>
                    <div style={{ flex: 2, minWidth: "160px" }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          display: "block",
                          marginBottom: "0.2rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paid back via GPay"
                        value={reimburseNotes}
                        onChange={(event) =>
                          setReimburseNotes(event.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          fontSize: "0.85rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--bg-color)",
                          color: "var(--text-main)",
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={submittingReimburse || (requiresPerson && !reimbursePerson)}
                      onClick={() =>
                        onRecordReimbursement(
                          transaction._id,
                          reimbursementLimit,
                          requiresPerson,
                        )
                      }
                      style={{
                        padding: "7px 16px",
                        fontSize: "0.82rem",
                        width: "auto",
                      }}
                    >
                      {submittingReimburse
                        ? "Recording..."
                        : "Submit Reimbursement"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "0.6rem 1rem",
                    borderRadius: "8px",
                    backgroundColor: "rgba(34, 197, 94, 0.08)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                    fontSize: "0.82rem",
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <CheckCircle size={16} /> Fully Reimbursed! No outstanding
                  amount remaining for this expense.
                </div>
              )}

              {transaction.reimbursements?.length > 0 && (
                <div>
                  <h5
                    style={{
                      margin: "0.5rem 0 0.4rem",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Reimbursement History
                  </h5>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.3rem",
                    }}
                  >
                    {transaction.reimbursements.map((reimbursement, idx) => (
                      <div
                        key={`${transaction._id}-reimburse-${idx}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.8rem",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "6px",
                          backgroundColor: "rgba(255,255,255,0.02)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <span>
                          {formatDateDisplay(reimbursement.date)}{" "}
                          {reimbursement.personName && (
                            <strong style={{ color: "#f97316" }}>
                              ({reimbursement.personName})
                            </strong>
                          )}
                        </span>
                        <span style={{ color: "#22c55e", fontWeight: "bold" }}>
                          +₹{Number(reimbursement.amount).toFixed(2)}
                        </span>
                        {reimbursement.notes && (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontStyle: "italic",
                              flex: 1,
                              textAlign: "right",
                              marginLeft: "0.5rem",
                            }}
                          >
                            {reimbursement.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default TransactionRow;
