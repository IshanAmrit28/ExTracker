const EXPENSE_TYPES = new Set(['need', 'want', 'expense', 'saving']);

const normalize = (value) => String(value || '').trim().toLowerCase();

const amountOf = (transaction) => {
  const amount = Number(transaction?.amount);
  return Number.isFinite(amount) ? amount : 0;
};

const isReimbursement = (transaction) =>
  normalize(transaction?.type) === 'reimbursement' ||
  normalize(transaction?.category) === 'reimbursement';

const isIncome = (transaction) => normalize(transaction?.type) === 'income';

const isOutgoing = (transaction) =>
  EXPENSE_TYPES.has(normalize(transaction?.type));

const bankNamesMatch = (left, right) => {
  const a = normalize(left);
  const b = normalize(right);
  if (a === b) return true;

  const cashNames = new Set(['cash', 'cash / wallet', 'wallet']);
  return cashNames.has(a) && cashNames.has(b);
};

const resolveBankName = (transactionBank, banks) => {
  const rawBank = String(transactionBank || '').trim();
  const configuredBank = (banks || []).find((bank) =>
    bankNamesMatch(bank.name, rawBank),
  );

  return configuredBank?.name || rawBank || 'Cash / Wallet';
};

/**
 * Calculates actual cash movement from persisted transactions.
 *
 * This intentionally uses transaction.amount for outgoing transactions:
 * amount is what left the bank. Split `myShare` is only a budget metric and
 * must not be used to calculate the bank's actual balance.
 *
 * Reimbursements are stored twice by the API: the original split transaction
 * stores the canonical `reimbursedAmount`, and a separate Reimbursement row
 * is created for the activity log. The activity row is not counted here, or
 * the same money would be credited twice.
 */
export const calculateBankBalances = (
  transactions = [],
  banks = [],
  openingBalances = [],
) => {
  // The first saved opening amount is the baseline before the user's tracked
  // history. Later month-start entries are historical snapshots and must not
  // be added on top of the same transaction history.
  const sortedOpenings = [...openingBalances]
    .filter((entry) => entry?.month)
    .sort((a, b) => String(a.month).localeCompare(String(b.month)));
  const openingEntry = sortedOpenings[0];

  const balances = {};

  banks.forEach((bank) => {
    if (!bank?.name) return;
    balances[bank.name] = {
      name: bank.name,
      credited: 0,
      spent: 0,
      openingBalance: 0,
      balance: 0,
    };
  });

  (openingEntry?.bankBalances || []).forEach((opening) => {
    const bankName = resolveBankName(opening.bank, banks);
    if (!balances[bankName]) {
      balances[bankName] = {
        name: bankName,
        credited: 0,
        spent: 0,
        openingBalance: 0,
        balance: 0,
      };
    }

    const amount = amountOf({ amount: opening.balance });
    balances[bankName].openingBalance += amount;
    balances[bankName].balance += amount;
  });

  transactions.forEach((transaction) => {
    // Reimbursement rows are activity-log shadows. The parent split
    // transaction's reimbursement history is the canonical source.
    if (isReimbursement(transaction)) return;

    const bankName = resolveBankName(transaction?.bank, banks);
    if (!balances[bankName]) {
      balances[bankName] = {
        name: bankName,
        credited: 0,
        spent: 0,
        openingBalance: 0,
        balance: 0,
      };
    }

    const amount = amountOf(transaction);
    const balance = balances[bankName];

    if (isIncome(transaction)) {
      balance.credited += amount;
      balance.balance += amount;
    } else if (isOutgoing(transaction)) {
      balance.spent += amount;
      balance.balance -= amount;
    }

    // Reimbursements received for a split expense are credited once from the
    // original transaction, even though the API also stores shadow rows.
    if (isOutgoing(transaction)) {
      const reimbursedAmount = Number(transaction?.reimbursedAmount);
      if (Number.isFinite(reimbursedAmount) && reimbursedAmount > 0) {
        balance.credited += reimbursedAmount;
        balance.balance += reimbursedAmount;
      }
    }
  });

  return Object.values(balances);
};

export const calculateOverallBalance = (transactions = [], banks = [], openingBalances = []) =>
  calculateBankBalances(transactions, banks, openingBalances).reduce(
    (total, bank) => total + bank.balance,
    0,
  );

