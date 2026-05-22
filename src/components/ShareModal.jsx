import { P, S } from "../constants";

export default function ShareModal({ trip, onClose }) {
  const options = [
    { icon: "🗓", label: "Full Itinerary",  sub: "All stops, times & confirmations",  color: P.lightBlue },
    { icon: "📍", label: "Places & Recs",   sub: "Restaurants, activities & stays only", color: P.terracotta },
    { icon: "📋", label: "Trip Summary",    sub: "Overview with spend & members",      color: P.orange },
  ];
  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Share Trip</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          <div style={S.shareSubtitle}>Choose what to share from <strong style={{ color: P.textPrimary }}>{trip?.name}</strong></div>
          {options.map(opt => (
            <div key={opt.label} style={S.shareOption}>
              <span style={{ fontSize: 24 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ ...S.shareOptTitle, color: opt.color }}>{opt.label}</div>
                <div style={S.shareOptSub}>{opt.sub}</div>
              </div>
              <button style={{ ...S.copyBtn, borderColor: opt.color + "50", color: opt.color }}>Copy link</button>
            </div>
          ))}
          <div style={S.shareNote}>🔒 Sensitive photos and private notes are always excluded from shared exports.</div>
        </div>
      </div>
    </div>
  );
}
