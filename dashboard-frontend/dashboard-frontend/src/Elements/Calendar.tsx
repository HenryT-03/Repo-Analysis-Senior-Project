import React, { useState } from "react";

const CARDINAL = "#822433";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type DateRange = { start: Date | null; end: Date | null };

type Props = {
  onApply: (range: DateRange, label: string) => void;
  onClose: () => void;
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isBetween(d: Date, start: Date, end: Date) {
  const t = d.getTime();
  return t > start.getTime() && t < end.getTime();
}

function formatDate(d: Date) {
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const CalendarMonth: React.FC<{
  year: number;
  month: number;
  range: DateRange;
  hovered: Date | null;
  onDateClick: (d: Date) => void;
  onDateHover: (d: Date | null) => void;
}> = ({ year, month, range, hovered, onDateClick, onDateHover }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const effectiveEnd =
    range.start && !range.end && hovered
      ? hovered > range.start ? hovered : range.start
      : range.end;
  const effectiveStart =
    range.start && !range.end && hovered
      ? hovered < range.start ? hovered : range.start
      : range.start;

  return (
    <div style={calStyles.monthWrapper}>
      <div style={calStyles.monthLabel}>
        {MONTHS[month]} {year}
      </div>
      <div style={calStyles.dayHeaders}>
        {DAYS.map((d) => (
          <div key={d} style={calStyles.dayHeader}>{d}</div>
        ))}
      </div>
      <div style={calStyles.grid}>
        {cells.map((date, i) => {
          if (!date) return <div key={i} style={calStyles.cell} />;

          const isStart = range.start && sameDay(date, range.start);
          const isEnd = effectiveEnd && sameDay(date, effectiveEnd);
          const inRange =
            effectiveStart && effectiveEnd
              ? isBetween(date, effectiveStart, effectiveEnd)
              : false;

          let cellStyle = { ...calStyles.cell };
          let innerStyle: React.CSSProperties = { ...calStyles.cellInner };

          if (isStart || isEnd) {
            innerStyle = { ...innerStyle, backgroundColor: CARDINAL, color: "white", borderRadius: "50%" };
          } else if (inRange) {
            cellStyle = { ...cellStyle, backgroundColor: "rgba(139,0,0,0.12)" };
            innerStyle = { ...innerStyle, color: "#222" };
          }

          return (
            <div
              key={i}
              style={cellStyle}
              onClick={() => onDateClick(date)}
              onMouseEnter={() => onDateHover(date)}
              onMouseLeave={() => onDateHover(null)}
            >
              <div style={innerStyle}>{date.getDate()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Calendar: React.FC<Props> = ({ onApply, onClose }) => {
  const today = new Date();
  const [leftYear, setLeftYear] = useState(today.getFullYear());
  const [leftMonth, setLeftMonth] = useState(today.getMonth());
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [hovered, setHovered] = useState<Date | null>(null);
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  const handlePrev = () => {
    if (leftMonth === 0) { setLeftMonth(11); setLeftYear(y => y - 1); }
    else setLeftMonth(m => m - 1);
  };
  const handleNext = () => {
    if (leftMonth === 11) { setLeftMonth(0); setLeftYear(y => y + 1); }
    else setLeftMonth(m => m + 1);
  };

  const handleDateClick = (d: Date) => {
    if (!range.start || (range.start && range.end)) {
      setRange({ start: d, end: null });
    } else {
      if (d < range.start) {
        setRange({ start: d, end: range.start });
      } else if (sameDay(d, range.start)) {
        setRange({ start: d, end: d });
      } else {
        setRange({ start: range.start, end: d });
      }
    }
  };

  const handleApply = () => {
    if (!range.start) return;
    const end = range.end ?? range.start;
    const label = sameDay(range.start, end)
      ? formatDate(range.start)
      : `${formatDate(range.start)} – ${formatDate(end)}`;
    onApply({ start: range.start, end }, label);
  };

  const canApply = !!range.start;

  const rangeLabel = range.start
    ? range.end
      ? `${formatDate(range.start)} – ${formatDate(range.end)}`
      : `${formatDate(range.start)} – …`
    : "Select start date";

  return (
    <div style={calStyles.panel}>
      <div style={calStyles.navRow}>
        <button style={calStyles.navBtn} onClick={handlePrev}>&#8249;</button>
        <span style={calStyles.navLabel}>
          {MONTHS[leftMonth]} {leftYear} – {MONTHS[rightMonth]} {rightYear}
        </span>
        <button style={calStyles.navBtn} onClick={handleNext}>&#8250;</button>
      </div>
      <div style={calStyles.calendarsRow}>
        <CalendarMonth
          year={leftYear} month={leftMonth}
          range={range} hovered={hovered}
          onDateClick={handleDateClick}
          onDateHover={setHovered}
        />
        <div style={calStyles.divider} />
        <CalendarMonth
          year={rightYear} month={rightMonth}
          range={range} hovered={hovered}
          onDateClick={handleDateClick}
          onDateHover={setHovered}
        />
      </div>
      <div style={calStyles.footer}>
        <span style={calStyles.rangeLabel}>{rangeLabel}</span>
        <div style={calStyles.footerBtns}>
          <button style={calStyles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            style={{ ...calStyles.applyBtn, opacity: canApply ? 1 : 0.45, cursor: canApply ? "pointer" : "default" }}
            onClick={handleApply}
            disabled={!canApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

const calStyles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: "white",
    border: "1px solid #bbb",
    borderRadius: "4px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
    padding: "12px",
    minWidth: "520px",
    fontFamily: "'Courier New', Courier, monospace",
    zIndex: 200,
  },
  navRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  navBtn: {
    background: "none",
    border: "1px solid #ccc",
    borderRadius: "3px",
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "1.2rem",
    padding: "2px 10px",
    color: CARDINAL,
    lineHeight: 1,
  },
  navLabel: {
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#222",
  },
  calendarsRow: {
    display: "flex",
    gap: "0",
    alignItems: "flex-start",
  },
  divider: {
    width: "1px",
    backgroundColor: "#e0e0e0",
    margin: "0 12px",
    alignSelf: "stretch",
  },
  monthWrapper: {
    flex: 1,
  },
  monthLabel: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "0.85rem",
    marginBottom: "6px",
    color: "#444",
  },
  dayHeaders: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: "2px",
  },
  dayHeader: {
    textAlign: "center",
    fontSize: "0.75rem",
    color: "#888",
    padding: "2px 0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "1px",
  },
  cell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    borderRadius: "2px",
    height: "30px",
  },
  cellInner: {
    width: "26px",
    height: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    color: "#222",
    borderRadius: "50%",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid #eee",
    gap: "12px",
  },
  rangeLabel: {
    fontSize: "0.82rem",
    color: "#555",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  footerBtns: {
    display: "flex",
    gap: "8px",
  },
  cancelBtn: {
    padding: "5px 14px",
    border: "1px solid #bbb",
    borderRadius: "3px",
    background: "white",
    color: "#444",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  applyBtn: {
    padding: "5px 14px",
    border: "none",
    borderRadius: "3px",
    backgroundColor: CARDINAL,
    color: "white",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.85rem",
  },
};

export default Calendar;
