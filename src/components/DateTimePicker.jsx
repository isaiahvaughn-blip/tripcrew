import { P, S } from "../constants";

export default function DateTimePicker({ day, time, onDayChange, onTimeChange }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
      <div style={{ flex: 1 }}>
        <div style={S.fieldLbl}>DATE</div>
        <div style={{ position: "relative" }}>
          <input
            type="date"
            value={day}
            onChange={e => onDayChange(e.target.value)}
            style={{ ...S.input, colorScheme: "dark", color: day ? P.terracotta : P.textMuted, fontWeight: day ? 700 : 400, fontSize: 14, paddingRight: day ? 36 : 16, cursor: "pointer" }}
          />
          {day && (
            <button onClick={() => onDayChange("")}
              style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0, zIndex: 2 }}>
              ✕
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={S.fieldLbl}>TIME <span style={{ color: P.textMuted, fontWeight: 600, letterSpacing: 0, textTransform: "none" }}>(opt)</span></div>
        <div style={{ position: "relative" }}>
          <input
            type="time"
            value={time}
            onChange={e => onTimeChange(e.target.value)}
            style={{ ...S.input, colorScheme: "dark", color: time ? P.terracotta : P.textMuted, fontWeight: time ? 700 : 400, fontSize: 14, paddingRight: time ? 36 : 16, cursor: "pointer" }}
          />
          {time && (
            <button onClick={() => onTimeChange("")}
              style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0, zIndex: 2 }}>
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
