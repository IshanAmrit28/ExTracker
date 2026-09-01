import { getCurrentMonthKey, getDateKey, getMonthKey } from "./dates";
import { getExpenseShare, isPersonalExpense } from "./transactions";

export const calculateSmartBudget = ({
  transactions = [],
  monthlyLimit,
  now = new Date(),
}) => {
  const limit = Number(monthlyLimit) || 0;
  if (limit <= 0) return null;

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const currentMonthKey = getCurrentMonthKey(now);
  const todayKey = getDateKey(now);
  const monthExpenses = transactions.filter(
    (transaction) =>
      isPersonalExpense(transaction) && getMonthKey(transaction.date) === currentMonthKey,
  );
  const spentToday = monthExpenses
    .filter((transaction) => getDateKey(transaction.date) === todayKey)
    .reduce((total, transaction) => total + getExpenseShare(transaction), 0);
  const totalSpentThisMonth = monthExpenses.reduce(
    (total, transaction) => total + getExpenseShare(transaction),
    0,
  );
  const originalDailyLimit = limit / daysInMonth;
  const remainingBudget = limit - totalSpentThisMonth;
  const daysAfterToday = daysInMonth - dayOfMonth;
  const budgetAtStartOfToday = remainingBudget + spentToday;
  const currentDailyLimit = budgetAtStartOfToday / (daysAfterToday + 1);
  const adjustedForTomorrow =
    daysAfterToday > 0 ? remainingBudget / daysAfterToday : 0;
  const todayOverage = spentToday - currentDailyLimit;
  const monthPct = Math.min(100, (totalSpentThisMonth / limit) * 100);

  let status = "ok";
  if (todayOverage > 0) status = "warning";
  if (remainingBudget <= 0) status = "danger";

  return {
    originalDailyLimit,
    currentDailyLimit,
    spentToday,
    todayOverage,
    totalSpentThisMonth,
    remainingBudget,
    adjustedForTomorrow,
    daysAfterToday,
    monthPct,
    daysInMonth,
    dayOfMonth,
    status,
  };
};
