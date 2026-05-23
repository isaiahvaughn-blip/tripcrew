import { Calendar, Clock } from "lucide-react";
import { P } from "../constants";
import { formatTime12 } from "../utils";

export default function DateTimePicker({ day, time, onDayChange, onTimeChange }) {
  const formatDayDisplay = (d) => {
    if (!d) return null;
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>

      {/* DATE BUTTON */}
      <div style={{ flex: 1, position: "relative" }}>
        <input
          type="date"
          value={day}
          onChange={e => onDayChange(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2, width: "100%", height: "100%" }}
        />
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: day ? P.terracotta + "18" : P.surface2,
          border: `1px solid ${day ? P.terracotta + "60" : P.surface3}`,
          borderRadius: 12, padding: "10px 14px", cursor: "pointer"
        }}>
          <Calendar size={15} color={day ? P.terracotta : P.textMuted} strokeWidth={2} />
          <span style={{ fontSize: 14, fontWeight: day ? 700 : 400, color: day ? P.terracotta : P.textMuted, flex: 1 }}>
            {formatDayDisplay(day) || "Date"}
          </span>
          {day && (
            <button onClick={e => { e.stopPropagation(); onDayChange(""); }}
              style={{ background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 12, padding: 0, zIndex: 3, position: "relative" }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TIME BUTTON */}
      <div style={{ flex: 1, position: "relative" }}>
        <input
          type="time"
          value={time}
          onChange={e => onTimeChange(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2, width: "100%", height: "100%" }}
        />
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: time ? P.terracotta + "18" : P.surface2,
          border: `1px solid ${time ? P.terracotta + "60" : P.surface3}`,
          borderRadius: 12, padding: "10px 14px", cursor: "pointer"
        }}>
          <Clock size={15} color={time ? P.terracotta : P.textMuted} strokeWidth={2} />
          <span style={{ fontSize: 14, fontWeight: time ? 700 : 400, color: time ? P.terracotta : P.textMuted, flex: 1 }}>
            {formatTime12(time) || "Time (opt)"}
          </span>
          {time && (
            <button onClick={e => { e.stopPropagation(); onTimeChange(""); }}
              style={{ background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 12, padding: 0, zIndex: 3, position: "relative" }}>
              ✕
            </button>
          )}
        </div>
      </div>

    </div>
  );
}