export {
  formatMonthLabel,
  getCurrentMonthKey,
  getDateKey,
  getMonthKey,
} from "../../../utils/finance/dates";

export const parseNumberOnBlur = (val, setter, defaultVal = "") => {
  if (val === "" || val === null || val === undefined) {
    if (defaultVal !== null) setter(defaultVal);
    return;
  }

  const parsed = parseFloat(val);
  if (isNaN(parsed)) {
    setter(defaultVal);
  } else {
    setter(String(parsed));
  }
};
