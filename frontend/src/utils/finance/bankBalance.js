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

const entryDate = (entry) =>
  String(entry?.date || (entry?.month ? `${entry.month}-01` : '')).slice(0, 10);

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
  // Use the latest opening date that is not in the future. This lets a user
  // correct the tracking start date later without adding multiple baselines.
  const sortedOpenings = [...openingBalances]
    .filter((entry) => entry?.month)
    .sort((a, b) => entryDate(b).localeCompare(entryDate(a)));
  const openingEntry = sortedOpenings.find((entry) => entryDate(entry) <= todayKey());
  const openingDate = openingEntry ? entryDate(openingEntry) : '';

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
    const transactionDate = entryDate(transaction);

    // Reimbursement rows are activity-log shadows. The parent split
    // transaction's reimbursement history is the canonical source.
    if (isReimbursement(transaction)) return;

    if (openingDate && transactionDate < openingDate) {
      const receivedAfterOpening = (transaction.reimbursements || [])
        .filter((entry) => entryDate(entry) >= openingDate)
        .reduce((total, entry) => total + amountOf(entry), 0);
      if (receivedAfterOpening > 0) {
        const bankName = resolveBankName(transaction?.bank, banks);
        if (!balances[bankName]) {
          balances[bankName] = { name: bankName, credited: 0, spent: 0, openingBalance: 0, balance: 0 };
        }
        balances[bankName].credited += receivedAfterOpening;
        balances[bankName].balance += receivedAfterOpening;
      }
      return;
    }

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
      const reimbursementHistory = Array.isArray(transaction.reimbursements)
        ? transaction.reimbursements
        : [];
      const reimbursedAmount = openingDate && reimbursementHistory.length > 0
        ? reimbursementHistory
          .filter((entry) => entryDate(entry) >= openingDate)
          .reduce((total, entry) => total + amountOf(entry), 0)
        : Number(transaction?.reimbursedAmount);
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

