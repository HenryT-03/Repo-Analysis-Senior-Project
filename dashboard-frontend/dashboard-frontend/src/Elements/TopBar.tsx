import React, { useState, useRef, useEffect } from "react";
import Calendar from "./Calendar";
import type { DateRange } from "./Calendar";

const CARDINAL = "#822433";

const TIME_OPTIONS = [
  "Last 5 Minutes",
  "Last 15 Minutes",
  "Last 30 Minutes",
  "Last 1 Hour",
  "Last 6 Hours",
  "Last 24 Hours",
  "Last 7 Days",
  "Last 30 Days",
];

const CalendarIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    style={{ flexShrink: 0 }}
  >
    <rect x="1" y="3" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <line x1="1" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.5" />
    <line x1="5" y1="1" x2="5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="11" y1="1" x2="11" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TopBar: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedTime, setSelectedTime] = useState("Last 15 Minutes");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCalendarApply = (_range: DateRange, label: string) => {
    setSelectedTime(label);
    setCalendarOpen(false);
  };

  return (
    <div style={styles.topBar}>
      <div style={styles.searchWrapper}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <svg style={styles.searchIcon} width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#888" strokeWidth="1.6" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="#888" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <button style={styles.button}>
        <span style={styles.btnIcon}>&#8635;</span> Refresh
      </button>
      <div style={styles.calendarWrapper} ref={calendarRef}>
        <button
          style={{ ...styles.button, ...styles.calendarBtn }}
          onClick={() => { setCalendarOpen((o) => !o); setDropdownOpen(false); }}
          title="Pick custom date range"
        >
          <CalendarIcon />
        </button>
        {calendarOpen && (
          <div style={styles.calendarPopover}>
            <Calendar
              onApply={handleCalendarApply}
              onClose={() => setCalendarOpen(false)}
            />
          </div>
        )}
      </div>
      <div style={styles.timeSelector} ref={dropdownRef}>
        <button
          style={{ ...styles.button, ...styles.timeBtn }}
          onClick={() => { setDropdownOpen((o) => !o); setCalendarOpen(false); }}
        >
          {selectedTime}
          <span style={styles.btnArrow}>{dropdownOpen ? "▲" : "▼"}</span>
        </button>
        {dropdownOpen && (
          <div style={styles.dropdown}>
            {TIME_OPTIONS.map((opt) => (
              <div
                key={opt}
                style={{
                  ...styles.dropdownItem,
                  ...(opt === selectedTime ? styles.dropdownItemActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (opt !== selectedTime)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  if (opt !== selectedTime)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "white";
                }}
                onClick={() => {
                  setSelectedTime(opt);
                  setDropdownOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
const styles: Record<string, React.CSSProperties> = {
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "#f0f0f0",
    borderBottom: "1px solid #ccc",
  },
  searchWrapper: {
    position: "relative",
    flex: 1,
    height: "34px",
  },
  searchInput: {
    width: "100%",
    height: "34px",
    padding: "0 32px 0 10px",
    border: "1px solid #bbb",
    borderRadius: "3px",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.95rem",
    backgroundColor: "white",
    boxSizing: "border-box",
    color: "#222",
  },
  searchIcon: {
    position: "absolute",
    right: "9px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "block",
    pointerEvents: "none",
    flexShrink: 0,
  },
  button: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    height: "34px",
    padding: "0 14px",
    backgroundColor: CARDINAL,
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.9rem",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
  },
  calendarWrapper: {
    position: "relative",
    height: "34px",
  },
  calendarBtn: {
    height: "34px",
    padding: "0 10px",
    borderRadius: "3px",
  },
  calendarPopover: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    zIndex: 200,
  },
  timeSelector: {
    position: "relative",
    display: "flex",
    flexDirection: "row",
  },
  timeBtn: {
    borderRadius: "3px",
    gap: "8px",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    right: 0,
    backgroundColor: "white",
    border: "1px solid #bbb",
    borderRadius: "3px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 100,
    minWidth: "180px",
    overflow: "hidden",
  },
  dropdownItem: {
    padding: "8px 14px",
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.9rem",
    color: "#222",
    backgroundColor: "white",
  },
  dropdownItemActive: {
    backgroundColor: CARDINAL,
    color: "white",
  },
  btnIcon: {
    fontSize: "1rem",
  },
  btnArrow: {
    fontSize: "0.65rem",
    marginLeft: "2px",
  },
};

export default TopBar;