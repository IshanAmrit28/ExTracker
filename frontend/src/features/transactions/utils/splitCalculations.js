export const roundCurrency = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

export const calculateSplit = ({
  totalAmount,
  method,
  peopleCount,
  mySharePct,
  myShareExact,
}) => {
  const total = Math.max(0, Number(totalAmount) || 0);
  let myShare = total;

  if (method === "equal") {
    const people = Math.max(2, Number.parseInt(peopleCount, 10) || 2);
    myShare = roundCurrency(total / people);
  } else if (method === "percentage") {
    const percentage = Math.min(100, Math.max(0, Number(mySharePct) || 0));
    myShare = roundCurrency((total * percentage) / 100);
  } else if (method === "exact") {
    myShare = Math.min(total, Math.max(0, roundCurrency(myShareExact)));
  }

  return {
    total,
    myShare,
    recoverable: roundCurrency(total - myShare),
  };
};

export const calculateCustomSplit = (totalAmount, members) => {
  const total = roundCurrency(totalAmount);
  const recoverable = getMembersTotal(members);
  return {
    total,
    recoverable,
    myShare: roundCurrency(total - recoverable),
  };
};

export const buildPercentageMembers = (totalAmount, members = []) =>
  members.map((member) => {
    const percentage = Math.min(100, Math.max(0, Number(member.percentage) || 0));
    return {
      ...member,
      percentage,
      amount: roundCurrency((Number(totalAmount) || 0) * percentage / 100),
    };
  });

export const getMembersPercentage = (members) =>
  Math.round(
    members.reduce((total, member) => total + (Number(member.percentage) || 0), 0) * 100,
  ) / 100;

export const buildEqualMembers = (totalAmount, peopleCount, members = []) => {
  const people = Math.max(2, Number.parseInt(peopleCount, 10) || 2);
  const { recoverable } = calculateSplit({
    totalAmount,
    method: "equal",
    peopleCount: people,
  });
  const memberCount = people - 1;
  const baseAmount = roundCurrency((Number(totalAmount) || 0) / people);

  return Array.from({ length: memberCount }, (_, index) => ({
    name: members[index]?.name || "",
    amount:
      index === memberCount - 1
        ? roundCurrency(recoverable - baseAmount * (memberCount - 1))
        : baseAmount,
  }));
};

export const getMembersTotal = (members) =>
  roundCurrency(
    members.reduce((total, member) => total + (Number(member.amount) || 0), 0),
  );

export const hasValidMemberAllocation = (members, recoverable) =>
  Math.abs(getMembersTotal(members) - roundCurrency(recoverable)) < 0.01;
