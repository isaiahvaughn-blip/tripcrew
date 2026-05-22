import { useState } from "react";
import { supabase } from "../supabase";
import { P, S, TRIP_ICON_LIST } from "../constants";

export default function EditTripModal({ trip, onClose, onSave }) {
  const [form, setForm] = useState({
    name: trip.name || "", location: trip.location || "", dates: trip.dates || "",
    emoji: trip.emoji || "✈️", city: trip.city || "", country: trip.country || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name) return;
    setLoading(true);
    const { data, error } = await supabase.from("trips").update(form).eq("id", trip.id).select().single();
    if (error) { console.error(error); setLoading(false); return; }
    onSave(data);
  };

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Edit Trip</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          <div style={S.field}>
            <div style={S.fieldLbl}>TRIP NAME</div>
            <input style={S.input} placeholder="e.g. Tokyo 2025" value={form.name} maxLength={30} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>CITY</div>
              <input style={S.input} placeholder="e.g. Tokyo" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>COUNTRY</div>
              <input style={S.input} placeholder="e.g. Japan" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DATES</div>
            <input style={S.input} placeholder="e.g. Jun 1–10, 2025" value={form.dates} onChange={e => setForm(f => ({ ...f, dates: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>ICON</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TRIP_ICON_LIST.map(({ key, Icon, label }) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, emoji: key }))}
                  style={{ background: form.emoji === key ? P.surface2 : "transparent", border: form.emoji === key ? `1px solid ${P.terracotta}` : `1px solid ${P.surface3}`, borderRadius: 12, padding: "8px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 56 }}>
                  <Icon size={20} color={form.emoji === key ? P.terracotta : P.textMuted} strokeWidth={1.5} />
                  <span style={{ fontSize: 9, color: form.emoji === key ? P.terracotta : P.textMuted, fontWeight: 700, letterSpacing: "0.5px" }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <button style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, marginTop: 8 }} onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
