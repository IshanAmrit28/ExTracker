import { formatDateToYYYYMMDD } from "./dateUtils";

const DATE_SEPARATOR = /[.,/]/;

const isValidDate = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/**
 * Parse the compact date formats used by the transaction forms.
 * 10       -> the 10th of the current month/year
 * 10.1     -> 10 January of the current year
 * 10.1.26  -> 10 January 2026
 */
export const parseDateInput = (value, now = new Date()) => {
  const input = String(value ?? "").trim();
  if (!input) return "";

  const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let day;
  let month;
  let year;

  if (isoMatch) {
    [, year, month, day] = isoMatch.map(Number);
  } else {
    const parts = input.split(DATE_SEPARATOR).map((part) => part.trim());
    if (parts.length < 1 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) {
      return null;
    }

    [day, month, year] = parts.map(Number);
    if (parts.length === 1) {
      month = now.getMonth() + 1;
      year = now.getFullYear();
    } else if (parts.length === 2) {
      year = now.getFullYear();
    } else if (String(parts[2]).length === 2) {
      year += 2000;
    }
  }

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null;
  }
  if (!isValidDate(year, month, day)) return null;

  return formatDateToYYYYMMDD(new Date(year, month - 1, day));
};

export const formatDateInput = (value) => {
  if (!value) return "";
  const datePart = String(value).split("T")[0];
  const match = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return String(value);
  return `${match[3].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[1]}`;
};
