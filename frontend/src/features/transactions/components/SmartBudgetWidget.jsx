import React, { useEffect, useMemo, useState } from "react";
import { Gauge, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import { calculateSmartBudget } from "../../../utils/finance/budget";

const SmartBudgetWidget = ({ transactions, settings }) => {
  const monthlyLimit = settings?.monthlyLimit || 0;
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      const millisecondsUntilMidnight = nextMidnight.getTime() - now.getTime();

      return window.setTimeout(() => {
        setCurrentTime(new Date());
      }, millisecondsUntilMidnight);
    };

    const timeoutId = scheduleMidnightRefresh();
    return () => window.clearTimeout(timeoutId);
  }, [currentTime]);

  const smartBudget = useMemo(() => {
    return calculateSmartBudget({
      transactions,
      monthlyLimit,
      now: currentTime,
    });
  }, [currentTime, monthlyLimit, transactions]);

  if (!smartBudget) {
    return null;
  }

  const statusColor =
    smartBudget.status === "ok"
      ? "#22c55e"
      : smartBudget.status === "warning"
        ? "#f97316"
        : "#ef4444";
  const statusBg =
    smartBudget.status === "ok"
      ? "rgba(34,197,94,0.08)"
      : smartBudget.status === "warning"
        ? "rgba(249,115,22,0.08)"
        : "rgba(239,68,68,0.08)";

  const StatusIcon =
    smartBudget.status === "ok"
      ? CheckCircle2
      : smartBudget.status === "warning"
        ? AlertTriangle
        : AlertOctagon;
  const statusText =
    smartBudget.status === "ok"
      ? "On Track"
      : smartBudget.status === "warning"
        ? "Daily Limit Exceeded"
        : "Monthly Limit Reached";

  return (
    <div
      className="card"
      style={{
        marginBottom: "1.5rem",
        border: `1px solid ${statusColor}40`,
        background: statusBg,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Gauge size={18} color="var(--primary-color)" /> Smart Daily Budget
          </h3>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
            }}
          >
            Day {smartBudget.dayOfMonth} of {smartBudget.daysInMonth} —{" "}
            {smartBudget.daysAfterToday} day
            {smartBudget.daysAfterToday !== 1 ? "s" : ""} remaining after today
          </p>
        </div>
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "20px",
            backgroundColor: statusColor + "22",
            color: statusColor,
            border: `1px solid ${statusColor}55`,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <StatusIcon size={14} color={statusColor} /> {statusText}
        </span>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginBottom: "0.3rem",
          }}
        >
          <span>Monthly spend</span>
          <span
            style={{
              color:
                smartBudget.monthPct >= 90 ? "#ef4444" : "var(--text-muted)",
            }}
          >
            ₹{Math.round(smartBudget.totalSpentThisMonth).toLocaleString()} / ₹
            {monthlyLimit.toLocaleString()} ({Math.round(smartBudget.monthPct)}
            %)
          </span>
        </div>
        <div
          style={{
            height: "7px",
            borderRadius: "4px",
            backgroundColor: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${smartBudget.monthPct}%`,
              borderRadius: "4px",
              background:
                smartBudget.monthPct >= 100
                  ? "#ef4444"
                  : smartBudget.monthPct >= 80
                    ? "#f97316"
                    : "#22c55e",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            padding: "0.7rem 0.9rem",
            borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.3rem",
            }}
          >
            Base Daily Limit
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            ₹{Math.round(smartBudget.originalDailyLimit).toLocaleString()}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            ₹{monthlyLimit.toLocaleString()} ÷ {smartBudget.daysInMonth}d
          </div>
        </div>

        <div
          style={{
            padding: "0.7rem 0.9rem",
            borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: `1px solid ${smartBudget.todayOverage > 0 ? "#f9731640" : "var(--border)"}`,
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.3rem",
            }}
          >
            Spent Today
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color:
                smartBudget.spentToday > smartBudget.currentDailyLimit
                  ? "#ef4444"
                  : "#22c55e",
            }}
          >
            ₹{Math.round(smartBudget.spentToday).toLocaleString()}
          </div>
          {smartBudget.todayOverage > 0 ? (
            <div style={{ fontSize: "0.7rem", color: "#ef4444" }}>
              +₹{Math.round(smartBudget.todayOverage).toLocaleString()} over
              limit
            </div>
          ) : (
            <div style={{ fontSize: "0.7rem", color: "#22c55e" }}>
              ₹
              {Math.round(
                smartBudget.currentDailyLimit - smartBudget.spentToday,
              ).toLocaleString()}{" "}
              remaining
            </div>
          )}
        </div>

        <div
          style={{
            padding: "0.7rem 0.9rem",
            borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: `1px solid ${smartBudget.adjustedForTomorrow < smartBudget.originalDailyLimit * 0.7 ? "#ef444440" : "var(--border)"}`,
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.3rem",
            }}
          >
            Adjusted / Remaining Day
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color:
                smartBudget.remainingBudget <= 0
                  ? "#ef4444"
                  : smartBudget.adjustedForTomorrow <
                      smartBudget.originalDailyLimit * 0.7
                    ? "#f97316"
                    : "#22c55e",
            }}
          >
            {smartBudget.daysAfterToday > 0
              ? `₹${Math.round(smartBudget.adjustedForTomorrow).toLocaleString()}`
              : "—"}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {smartBudget.daysAfterToday > 0
              ? `for next ${smartBudget.daysAfterToday} day${smartBudget.daysAfterToday !== 1 ? "s" : ""}`
              : "Last day of month"}
          </div>
        </div>

        <div
          style={{
            padding: "0.7rem 0.9rem",
            borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: `1px solid ${smartBudget.remainingBudget < 0 ? "#ef444440" : "var(--border)"}`,
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.3rem",
            }}
          >
            Monthly Balance
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: smartBudget.remainingBudget < 0 ? "#ef4444" : "#22c55e",
            }}
          >
            {smartBudget.remainingBudget >= 0 ? "₹" : "-₹"}
            {Math.abs(Math.round(smartBudget.remainingBudget)).toLocaleString()}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            left this month
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartBudgetWidget;
