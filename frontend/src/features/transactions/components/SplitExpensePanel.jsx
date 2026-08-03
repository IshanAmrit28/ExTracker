import React from "react";
import { CheckCircle, Plus, Trash2, User } from "lucide-react";
import { roundCurrency } from "../utils/splitCalculations";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  fontSize: "0.85rem",
  padding: "0.65rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  backgroundColor: "var(--bg-color)",
  color: "var(--text-main)",
};

const SplitExpensePanel = ({
  splitMethod,
  setSplitMethod,
  numPeople,
  setNumPeople,
  members,
  setMembers,
  totalAmountVal,
  calculatedMyShare,
  calculatedRecoverable,
  membersTotal,
  membersPercentage,
  memberAllocationValid,
  alreadyPaidBack,
  setAlreadyPaidBack,
  parseNumberOnBlur,
}) => {
  const isEqualSplit = splitMethod === "equal";
  const isPercentageSplit = splitMethod === "percentage";

  const updateMember = (index, changes) => {
    setMembers((current) =>
      current.map((member, memberIndex) =>
        memberIndex === index
          ? {
              ...member,
              ...changes,
              ...(changes.percentage !== undefined
                ? { amount: roundCurrency((totalAmountVal * (Number(changes.percentage) || 0)) / 100) }
                : {}),
            }
          : member,
      ),
    );
  };

  const addMember = () => {
    setMembers((current) => [...current, { name: "", amount: "" }]);
  };

  const removeMember = (index) => {
    setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index));
  };

  const handleMethodChange = (event) => {
    const nextMethod = event.target.value;
    setSplitMethod(nextMethod);
    if (nextMethod === "equal" && members.length === 0) {
      setMembers([{ name: "", amount: "" }]);
    }
  };

  return (
    <section
      aria-label="Split expense details"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1.25rem",
        marginTop: "1rem",
        border: "1px solid rgba(59, 130, 246, 0.35)",
        borderRadius: "12px",
        background: "linear-gradient(180deg, rgba(59,130,246,0.08), rgba(255,255,255,0.02))",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <User size={17} color="var(--primary-color)" />
          <strong>Split this bill</strong>
        </div>
        <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
          Add the people who owe you money. Their shares must add up to the amount you will collect.
        </p>
      </div>

      <div className="form-row" style={{ margin: 0 }}>
        <div className="form-group flex-1">
          <label>How should the bill be split?</label>
          <select value={splitMethod} onChange={handleMethodChange}>
            <option value="equal">Equal shares</option>
            <option value="percentage">Percentage shares</option>
            <option value="exact">Custom amounts</option>
          </select>
        </div>

        {isEqualSplit && (
          <div className="form-group flex-1">
            <label>Total people, including you</label>
            <input
              type="number"
              min="2"
              step="1"
              value={numPeople}
              onChange={(event) => setNumPeople(event.target.value)}
              onBlur={() => parseNumberOnBlur(numPeople, setNumPeople, "2")}
            />
          </div>
        )}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>People who owe you</span>
          {!isEqualSplit && (
            <button type="button" className="btn-secondary" onClick={addMember} style={{ width: "auto", padding: "0.45rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <Plus size={14} /> Add person
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {members.map((member, index) => (
            <div key={`split-member-${index}`} style={{ display: "grid", gridTemplateColumns: isPercentageSplit ? "minmax(0, 1.3fr) minmax(90px, 0.7fr) minmax(120px, 1fr) auto" : "minmax(0, 1.5fr) minmax(120px, 1fr) auto", gap: "0.55rem", alignItems: "center" }}>
              {isPercentageSplit && (
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  placeholder="%"
                  value={member.percentage ?? ""}
                  onChange={(event) => updateMember(index, { percentage: event.target.value })}
                  style={inputStyle}
                />
              )}
              <input
                type="text"
                required
                placeholder={`Person ${index + 1} name`}
                value={member.name}
                onChange={(event) => updateMember(index, { name: event.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Amount owed"
                value={member.amount}
                readOnly={isEqualSplit || isPercentageSplit}
                disabled={isEqualSplit || isPercentageSplit}
                onChange={(event) => updateMember(index, { amount: event.target.value })}
                onBlur={() => {
                  if (!isEqualSplit && !isPercentageSplit) {
                    parseNumberOnBlur(member.amount, (value) => updateMember(index, { amount: value }));
                  }
                }}
                style={{
                  ...inputStyle,
                  opacity: isEqualSplit || isPercentageSplit ? 0.7 : 1,
                  cursor: isEqualSplit || isPercentageSplit ? "not-allowed" : "text",
                }}
              />
              {!isEqualSplit && (
                <button type="button" className="delete-btn" onClick={() => removeMember(index)} aria-label={`Remove ${member.name || `person ${index + 1}`}`} style={{ padding: "0.45rem" }}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.6rem" }}>
        <div className="split-summary-card split-summary-card--personal">
          <span>Your share</span>
          <strong>₹{calculatedMyShare.toFixed(2)}</strong>
        </div>
        <div className="split-summary-card split-summary-card--recoverable">
          <span>Others owe</span>
          <strong>₹{calculatedRecoverable.toFixed(2)}</strong>
        </div>
        <div className={`split-summary-card ${memberAllocationValid ? "split-summary-card--valid" : "split-summary-card--invalid"}`}>
          <span>Assigned</span>
          <strong>₹{membersTotal.toFixed(2)} / ₹{calculatedRecoverable.toFixed(2)}</strong>
        </div>
      </div>

      {isPercentageSplit && (
        <p style={{ margin: 0, color: membersPercentage > 100 ? "#ef4444" : "var(--text-muted)", fontSize: "0.8rem" }}>
          {membersPercentage.toFixed(2)}% assigned to others. Your share is the remaining {Math.max(0, 100 - membersPercentage).toFixed(2)}%.
        </p>
      )}

      {!memberAllocationValid && calculatedRecoverable > 0 && (
        <p style={{ margin: 0, color: "#ef4444", fontSize: "0.8rem" }}>
          Add names and assign exactly ₹{calculatedRecoverable.toFixed(2)} before saving.
        </p>
      )}

      {calculatedRecoverable > 0 && (
        <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.82rem", cursor: "pointer" }}>
          <input type="checkbox" checked={alreadyPaidBack} onChange={(event) => setAlreadyPaidBack(event.target.checked)} />
          <CheckCircle size={15} color={alreadyPaidBack ? "#22c55e" : "var(--text-muted)"} />
          Everyone has already paid me back
        </label>
      )}
    </section>
  );
};

export default SplitExpensePanel;
