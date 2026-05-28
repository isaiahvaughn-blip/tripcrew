import { Calendar, Clock } from "lucide-react";
import { P } from "../constants";
import { formatTime12 } from "../utils";

const today = new Date().toISOString().split("T")[0];
const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);

export default function DateTimePicker({ day, time, onDayChange, onTimeChange, hideTime = false, minDate = null, hideLabel = false }) {
  const formatDayDisplay = (d) => {
    if (!d) return null;
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDayChange = (val) => {
    // Clamp to minDate — prevents iOS native picker ignoring min attribute
    if (minDate && val && val < minDate) return;
    onDayChange(val);
  };

  const desktopInputStyle = {
    background: "transparent", border: "none",
    borderBottom: `1px solid ${P.surface3}`,
    color: P.terracotta, fontSize: 16, fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    cursor: "pointer", colorScheme: "dark",
    width: "100%", textAlign: "center", padding: "4px 0",
  };

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>

      {/* DATE */}
      <div style={{ flex: hideTime ? 2 : 1, textAlign: "center" }}>
        {!hideLabel && (
          <div style={{ fontSize: 11, fontWeight: 800, color: P.textMuted, letterSpacing: "1.5px", marginBottom: 10 }}>DATE</div>
        )}
        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: 56 }}>
            <input
              type="date"
              value={day || today}
              min={minDate || undefined}
              onChange={e => handleDayChange(e.target.value)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 2 }}
            />
            {day ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: P.terracotta, fontFamily: "'DM Sans', sans-serif" }}>{formatDayDisplay(day)}</span>
                <button onClick={e => { e.stopPropagation(); onDayChange(""); }}
                  style={{ background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 16, padding: 0, zIndex: 3, position: "relative" }}>✕</button>
              </div>
            ) : (
              <Calendar size={40} color={P.slateBlue} strokeWidth={1.5} />
            )}
          </div>
        ) : (
          <input
            type="date"
            value={day || today}
            min={minDate || undefined}
            onChange={e => handleDayChange(e.target.value)}
            style={desktopInputStyle}
          />
        )}
      </div>

      {/* TIME — hidden when hideTime=true */}
      {!hideTime && (
        <div style={{ flex: 1, textAlign: "center" }}>
          {!hideLabel && (
            <div style={{ fontSize: 11, fontWeight: 800, color: P.textMuted, letterSpacing: "1.5px", marginBottom: 10 }}>
              TIME <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </div>
          )}
          {isMobile ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: 56 }}>
              <input
                type="time"
                value={time || ""}
                onChange={e => onTimeChange(e.target.value)}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 2 }}
              />
              {time ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: P.terracotta, fontFamily: "'DM Sans', sans-serif" }}>{formatTime12(time)}</span>
                  <button onClick={e => { e.stopPropagation(); onTimeChange(""); }}
                    style={{ background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 16, padding: 0, zIndex: 3, position: "relative" }}>✕</button>
                </div>
              ) : (
                <Clock size={40} color={P.slateBlue} strokeWidth={1.5} />
              )}
            </div>
          ) : (
            <input
              type="time"
              value={time || ""}
              onChange={e => onTimeChange(e.target.value)}
              style={desktopInputStyle}
            />
          )}
        </div>
      )}

    </div>
  );
}
