export const EXPENSE_TYPES = ["Need", "Want", "expense"];

export const isExpense = (transaction) =>
  EXPENSE_TYPES.includes(transaction?.type);

export const isIncome = (transaction) =>
  ["Income", "income"].includes(transaction?.type);

export const getExpenseShare = (transaction) => {
  if (transaction?.isSplit && transaction.myShare != null) {
    return Number(transaction.myShare) || 0;
  }

  return Number(transaction?.amount) || 0;
};

export const getTransactionAmount = (transaction) =>
  isExpense(transaction)
    ? getExpenseShare(transaction)
    : Number(transaction?.amount) || 0;

export const sumTransactions = (transactions, predicate, amountGetter) =>
  transactions
    .filter(predicate)
    .reduce((total, transaction) => total + amountGetter(transaction), 0);
