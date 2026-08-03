const roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;

const validateSplitExpense = ({ amount, myShare, members }) => {
  const totalAmount = roundCurrency(amount);
  const personalShare = roundCurrency(myShare);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return { error: "Transaction amount must be greater than 0." };
  }
  if (!Number.isFinite(personalShare) || personalShare < 0 || personalShare > totalAmount) {
    return { error: "Your share must be between 0 and the total paid amount." };
  }

  const normalizedMembers = (members || []).map((member) => ({
    name: String(member.name || "").trim(),
    amount: roundCurrency(member.amount),
  }));
  const memberNames = new Set();

  for (const member of normalizedMembers) {
    if (!member.name) return { error: "Each person in a split must have a name." };
    if (member.amount <= 0) return { error: "Each person's share must be greater than 0." };
    const normalizedName = member.name.toLowerCase();
    if (memberNames.has(normalizedName)) {
      return { error: "Each person in a split must have a unique name." };
    }
    memberNames.add(normalizedName);
  }

  const recoverableAmount = roundCurrency(totalAmount - personalShare);
  const memberTotal = roundCurrency(
    normalizedMembers.reduce((total, member) => total + member.amount, 0),
  );
  if (recoverableAmount > 0 && normalizedMembers.length === 0) {
    return { error: "Add the people who owe you their share of this expense." };
  }
  if (Math.abs(memberTotal - recoverableAmount) >= 0.01) {
    return {
      error: `The people listed must add up to the recoverable amount (${recoverableAmount.toFixed(2)}).`,
    };
  }

  return { totalAmount, personalShare, recoverableAmount, members: normalizedMembers };
};

module.exports = { roundCurrency, validateSplitExpense };
