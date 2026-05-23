import { Calendar, Clock } from "lucide-react";
import { P, S } from "../constants";
import { formatTime12 } from "../utils";

export default function DateTimePicker({ day, time, onDayChange, onTimeChange }) {
  const formatDayDisplay = (d) => {
    if (!d) return null;
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>

      {/* DATE */}
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={S.fieldLbl}>DATE</div>
        <div style={{ minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {day ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: P.terracotta }}>{formatDayDisplay(day)}</span>
              <button onClick={() => onDayChange("")}
                style={{ background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
            </div>
          ) : (
            <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <input type="date" onChange={e => onDayChange(e.target.value)}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 2 }} />
              <Calendar size={26} color={P.slateBlue} strokeWidth={1.5} />
              <span style={{ fontSize: 11, color: P.textMuted, fontWeight: 700, letterSpacing: "0.5px" }}>DATE</span>
            </div>
          )}
        </div>
      </div>

      {/* TIME */}
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={S.fieldLbl}>TIME <span style={{ color: P.textMuted, fontWeight: 400, letterSpacing: 0, textTransform: "none", fontSize: 10 }}>(optional)</span></div>
        <div style={{ minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {time ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: P.terracotta }}>{formatTime12(time)}</span>
              <button onClick={() => onTimeChange("")}
                style={{ background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
            </div>
          ) : (
            <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <input type="time" onChange={e => onTimeChange(e.target.value)}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 2 }} />
              <Clock size={26} color={P.slateBlue} strokeWidth={1.5} />
              <span style={{ fontSize: 11, color: P.textMuted, fontWeight: 700, letterSpacing: "0.5px" }}>TIME</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}