import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { MapPin, Zap, Trash2 } from "lucide-react";
import { P, S, ITINERARY_COLORS, ITIN_TYPE_ICONS, TYPE_PLACEHOLDERS } from "../constants";
import { formatDayLabel, formatTime12 } from "../utils";
import ConfirmModal from "./ConfirmModal";
import DateTimePicker from "./DateTimePicker";

// ─── ADD ITIN MODAL ───────────────────────────────────────────────────────────

export function AddItinModal({ onClose, trip, onAdd }) {
  const [type, setType] = useState("flight");
  const [day,  setDay]  = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [addReturn, setAddReturn] = useState(false);
  const [returnDay,  setReturnDay]  = useState("");
  const [returnTime, setReturnTime] = useState("");
  const titleRef  = useRef(null);
  const detailRef = useRef(null);
  const returnDetailRef = useRef(null);

  const handleAdd = async () => {
    const title  = titleRef.current?.value || "";
    const detail = detailRef.current?.value || "";
    if (!title || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("itinerary")
        .insert([{ trip_id: trip.id, day, time, type, title, detail, icon: "🎯", visibility: "group" }]).select();
      if (error) { console.error(error); setLoading(false); return; }

      if (addReturn && ["flight","transport"].includes(type)) {
        const returnDetail = returnDetailRef.current?.value || "";
        const { data: rd, error: re } = await supabase.from("itinerary")
          .insert([{ trip_id: trip.id, day: returnDay, time: returnTime, type, title: `Return: ${title}`, detail: returnDetail, icon: "🎯", visibility: "group" }]).select();
        if (!re && rd) onAdd(rd[0]);
      }

      onAdd(data[0]);
      onClose();
    } catch (e) { console.error(e); setLoading(false); }
  };

  const isFlightOrTransport = ["flight","transport"].includes(type);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: P.phoneBg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px 8px", flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", fontFamily: "'Syne', sans-serif" }}>Add to Itinerary</div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ flex: 1, padding: "0 22px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>

          {/* TYPE — fixed height, no reflow */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              {Object.keys(ITINERARY_COLORS).map(t => {
                const m = ITINERARY_COLORS[t];
                const TIcon = ITIN_TYPE_ICONS[t];
                const selected = type === t;
                return (
                  <button key={t} onClick={() => { setType(t); setAddReturn(false); }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 10px", borderRadius: 14, cursor: "pointer", background: selected ? P.surface2 : P.surface1, border: selected ? `1px solid ${m.accent}` : `1px solid ${P.surface3}`, minHeight: 52, minWidth: 58, flexShrink: 0 }}>
                    <TIcon size={18} color={selected ? m.accent : P.textMuted} strokeWidth={1.5} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: selected ? m.accent : P.textMuted, textTransform: "capitalize", letterSpacing: "0.3px" }}>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ONE WAY / ROUND TRIP toggle */}
          {isFlightOrTransport && (
            <div style={{ display: "flex", background: P.surface2, borderRadius: 12, padding: 3, border: `1px solid ${P.surface3}`, flexShrink: 0 }}>
              {[["One way", false], ["Round trip", true]].map(([label, val]) => (
                <button key={label} onClick={() => setAddReturn(val)}
                  style={{ flex: 1, padding: "7px 0", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: addReturn === val ? P.surface3 : "transparent", color: addReturn === val ? P.textPrimary : P.textMuted, transition: "all 0.15s" }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* TITLE */}
          <div style={{ textAlign: "center", paddingBottom: 8, borderBottom: `1px solid ${P.surface3}`, flexShrink: 0 }}>
            <input ref={titleRef} placeholder={TYPE_PLACEHOLDERS[type] || "e.g. Add a title"}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 24, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", width: "100%", textAlign: "center", fontFamily: "'Syne', sans-serif", padding: "8px 0" }} />
          </div>

          {/* DETAILS — split side by side for round trip */}
          {isFlightOrTransport && addReturn ? (
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <input ref={detailRef} style={{ ...S.input, fontSize: 13, padding: "10px 12px", flex: 1 }} placeholder="Conf. #, Terminal, Notes" />
              <input ref={returnDetailRef} style={{ ...S.input, fontSize: 13, padding: "10px 12px", flex: 1 }} placeholder="Conf. #, Terminal, Notes" />
            </div>
          ) : (
            <input ref={detailRef} style={{ ...S.input, fontSize: 14, padding: "11px 16px", flexShrink: 0 }} placeholder="Confirmation #, address, notes..." />
          )}

          {/* OUTBOUND DATE TIME — label inline left */}
          <div style={{ flexShrink: 0 }}>
            <DateTimePicker
              day={day} time={time} onDayChange={setDay} onTimeChange={setTime}
              prefixLabel={isFlightOrTransport && addReturn ? "OUTBOUND" : null}
            />
          </div>

          {/* RETURN DATE TIME */}
          {isFlightOrTransport && addReturn && (
            <div style={{ flexShrink: 0 }}>
              <DateTimePicker
                day={returnDay} time={returnTime} onDayChange={setReturnDay} onTimeChange={setReturnTime}
                minDate={day}
                prefixLabel="RETURN"
                prefixColor={P.lightBlue}
              />
            </div>
          )}

        </div>

        {/* BUTTON */}
        <div style={{ paddingTop: 10, paddingBottom: 16, flexShrink: 0 }}>
          <button
            style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff" }}
            onClick={handleAdd} disabled={loading}>
            {loading ? "Adding..." : addReturn ? "Add Both Flights" : "Add to Itinerary"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT ITIN MODAL ──────────────────────────────────────────────────────────

export function EditItinModal({ item, onClose, onSave }) {
  const [type, setType] = useState(item.type || "activity");
  const [day,  setDay]  = useState(item.day  || "");
  const [time, setTime] = useState(item.time || "");
  const titleRef  = useRef(null);
  const detailRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const title  = titleRef.current?.value || item.title;
    const detail = detailRef.current?.value || item.detail || "";
    if (!title) return;
    setLoading(true);
    const { data, error } = await supabase.from("itinerary")
      .update({ type, title, detail, day, time, icon: item.icon })
      .eq("id", item.id).select().single();
    if (error) { console.error(error); setLoading(false); return; }
    onSave(data);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: P.phoneBg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", fontFamily: "'Syne', sans-serif" }}>Edit Item</div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ flex: 1, padding: "0 22px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>

          {/* TYPE */}
          <div>
            <div style={S.fieldLbl}>TYPE</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              {Object.keys(ITINERARY_COLORS).map(t => {
                const m = ITINERARY_COLORS[t];
                const TIcon = ITIN_TYPE_ICONS[t];
                const selected = type === t;
                return (
                  <button key={t} onClick={() => setType(t)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 10px", borderRadius: 14, cursor: "pointer", background: selected ? P.surface2 : P.surface1, border: selected ? `1px solid ${m.accent}` : `1px solid ${P.surface3}`, minHeight: 58, minWidth: 62, flexShrink: 0 }}>
                    <TIcon size={20} color={selected ? m.accent : P.textMuted} strokeWidth={1.5} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: selected ? m.accent : P.textMuted, textTransform: "capitalize", letterSpacing: "0.3px" }}>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TITLE */}
          <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: `1px solid ${P.surface3}` }}>
            <div style={S.fieldLbl}>TITLE</div>
            <input ref={titleRef} defaultValue={item.title} placeholder={TYPE_PLACEHOLDERS[type] || "e.g. Add a title"}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", width: "100%", textAlign: "center", fontFamily: "'Syne', sans-serif", padding: "4px 0" }} />
          </div>

          {/* DETAILS */}
          <div>
            <div style={S.fieldLbl}>DETAILS / CONFIRMATION #</div>
            <input ref={detailRef} defaultValue={item.detail || ""} style={{ ...S.input, fontSize: 15, padding: "12px 16px" }} placeholder="Confirmation code, address, notes..." />
          </div>

          {/* DATE TIME */}
          <DateTimePicker day={day} time={time} onDayChange={setDay} onTimeChange={setTime} />

        </div>

        {/* BUTTONS */}
        <div style={{ paddingTop: 12, paddingBottom: 16, flexShrink: 0, display: "flex", gap: 10 }}>
          <button style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", flex: 1 }}
            onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={async () => {
              const { error } = await supabase.from("itinerary").delete().eq("id", item.id);
              if (!error) onSave({ ...item, _deleted: true });
            }}
            style={{ background: "transparent", border: `1px solid ${P.danger}40`, borderRadius: 14, padding: "0 22px", color: P.danger, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ITINERARY TAB ────────────────────────────────────────────────────────────

const SI = {
  dayLabel: { fontSize: 12, fontWeight: 800, color: P.slateBlue, letterSpacing: "0.5px", marginBottom: 10, marginTop: 4, fontFamily: "'DM Sans', sans-serif" },
  selectHint: { fontSize: 12, color: P.textMuted, textAlign: "center", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" },
  item: { display: "flex", alignItems: "flex-start", gap: 14, background: P.surface1, borderRadius: 14, borderLeft: "3px solid transparent", padding: "14px 14px 14px 16px", marginBottom: 10, cursor: "pointer", border: `1px solid ${P.surface3}`, borderLeftWidth: 3, userSelect: "none", transition: "background 0.15s" },
  itemSelected: { background: P.surface2, borderColor: P.terracotta + "40" },
  timeCol: { flexShrink: 0, width: 52, paddingTop: 2 },
  time: { fontSize: 14, color: P.textSecondary, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  content: { flex: 1, minWidth: 0 },
  titleRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "nowrap" },
  title: { fontSize: 16, fontWeight: 700, color: P.textPrimary, letterSpacing: "-0.3px", fontFamily: "'Syne', sans-serif", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  mapsLink: { color: P.lightBlue, fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 2 },
  detail: { fontSize: 13, color: P.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 },
  checkbox: { width: 22, height: 22, borderRadius: "50%", border: `2px solid ${P.surface3}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  checkboxOn: { background: P.terracotta, border: `2px solid ${P.terracotta}` },
  emptyState: { textAlign: "center", padding: "48px 24px", background: P.surface1, borderRadius: 18, border: `1px dashed ${P.surface3}`, marginTop: 8 },
  emptyTitle: { fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: P.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 13, color: P.slateBlue, fontFamily: "'DM Sans', sans-serif" },
};

export default function ItineraryTab({ trip, onModal, refreshKey }) {
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  const handleItemTap = item => { setEditingItem(item); };

  useEffect(() => {
    const fetchItinerary = async () => {
      const { data, error } = await supabase.from("itinerary").select("*")
        .eq("trip_id", trip.id).order("day", { ascending: true }).order("time", { ascending: true });
      if (error) console.error(error); else setItems(data);
    };
    fetchItinerary();
    const sub = supabase.channel(`itinerary:${trip.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "itinerary" }, fetchItinerary).subscribe();
    return () => sub.unsubscribe();
  }, [trip.id, refreshKey]);

  const days = [...new Set(items.map(i => i.day))];

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Itinerary</div>
        <button style={S.newBtn} onClick={() => onModal("addItinerary")}>+ Add</button>
      </div>
      {items.length === 0 && (
        <div style={SI.emptyState}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
          <div style={SI.emptyTitle}>No stops yet</div>
          <div style={SI.emptySub}>Tap + Add to start building your itinerary</div>
        </div>
      )}
      {days.map(day => (
        <div key={day} style={S.dayBlock}>
          <div style={SI.dayLabel}>{formatDayLabel(day)}</div>
          {items.filter(i => i.day === day).map(item => {
            const meta = ITINERARY_COLORS[item.type] || ITINERARY_COLORS.activity;
            const hasEmojiIcon = item.icon && item.icon.length <= 4 && item.icon !== "🎯";
            const TypeIcon = ITIN_TYPE_ICONS[item.type] || Zap;
            const hasLocation = !["flight", "transport"].includes(item.type);
            return (
              <div key={item.id}
                style={{ ...SI.item, borderLeftColor: meta.accent }}
                onClick={() => handleItemTap(item)}>
                <div style={SI.timeCol}><span style={SI.time}>{formatTime12(item.time) || "—"}</span></div>
                <div style={SI.content}>
                  <div style={SI.titleRow}>
                    {hasEmojiIcon ? <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span> : <TypeIcon size={16} color={meta.accent} strokeWidth={2} style={{ flexShrink: 0 }} />}
                    <span style={SI.title}>{item.title}</span>
                    {hasLocation && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(item.title + " " + (item.detail || ""))}`}
                        target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={SI.mapsLink}>
                        <MapPin size={11} /> Maps
                      </a>
                    )}
                  </div>
                  {item.detail && <div style={SI.detail}>{item.detail}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ height: 20 }} />
      {editingItem && (
        <EditItinModal item={editingItem} onClose={() => setEditingItem(null)}
          onSave={updated => {
            if (updated._deleted) {
              setItems(prev => prev.filter(i => i.id !== updated.id));
            } else {
              setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
            }
            setEditingItem(null);
          }} />
      )}
    </div>
  );
}
