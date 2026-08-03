export const getDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const getMonthKey = (value) => getDateKey(value).slice(0, 7);

export const getCurrentMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const formatMonthLabel = (key) => {
  if (!key) return "";
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString(
    "default",
    { month: "long", year: "numeric" },
  );
};
