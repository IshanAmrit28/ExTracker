import { useEffect, useRef, useState } from "react";
import { formatDateInput, parseDateInput } from "../utils/dateInput";

const DateInput = ({ value, onChange, onBlur, style, ...props }) => {
  const [draft, setDraft] = useState(formatDateInput(value));
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(formatDateInput(value));
  }, [value]);

  const handleChange = (event) => {
    setDraft(event.target.value);
    setError("");
    event.target.setCustomValidity("");
  };

  const handleBlur = (event) => {
    const parsed = parseDateInput(draft);
    if (!parsed) {
      setError("Use a date like 10, 10.1, or 10.1.26");
      event.currentTarget.setCustomValidity("Enter a valid date");
    } else {
      setError("");
      event.currentTarget.setCustomValidity("");
      setDraft(formatDateInput(parsed));
      onChange({ target: { name: props.name, value: parsed } });
    }
    onBlur?.(event);
  };

  return (
    <div style={{ width: "100%" }}>
      <input
        {...props}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={props.placeholder || "dd/mm/yyyy"}
        style={style}
        aria-invalid={Boolean(error)}
      />
      {error && (
        <div style={{ color: "var(--danger)", fontSize: "0.7rem", marginTop: "0.25rem" }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default DateInput;
