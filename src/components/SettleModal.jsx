import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { P, S } from "../constants";

export default function SettleModal({ settlements, myName, trip, onClose }) {
  const [marked, setMarked] = useState([]);
  const [payHandles, setPayHandles] = useState({});
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const fetchHandles = async () => {
      const { data: tmRows } = await supabase
        .from("trip_members").select("user_id, invited_email").eq("trip_id", trip.id);
      const userIds = (tmRows || []).map(r => r.user_id).filter(Boolean);
      if (!userIds.length) return;
      const { data: profiles } = await supabase
        .from("profiles").select("id, display_name, venmo_handle, cashapp_handle, zelle_handle").in("id", userIds);
      const map = {};
      (profiles || []).forEach(p => { if (p.display_name) map[p.display_name] = p; });
      setPayHandles(map);
    };
    fetchHandles();
  }, [trip.id]);

  const toggle = i => setMarked(m => m.includes(i) ? m.filter(x => x !== i) : [...m, i]);
  const mine   = settlements.filter(s => s.from === myName);
  const others = settlements.filter(s => s.from !== myName);

  const copyZelle = (handle, key) => {
    navigator.clipboard.writeText(handle).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2000);
    });
  };

  const PayButtons = ({ toName, amount, settlementKey }) => {
    const p    = payHandles[toName] || {};
    const note = encodeURIComponent(trip?.name || "Trip");
    const zelleKey = `zelle-${settlementKey}`;
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <a href={p.venmo_handle
            ? `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(p.venmo_handle)}&amount=${amount}&note=${note}`
            : "https://venmo.com/"}
          target={p.venmo_handle ? undefined : "_blank"} rel="noopener noreferrer"
          style={{ ...S.payBtn, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, ...(p.venmo_handle ? { borderColor: "#3D95CE50", color: "#3D95CE" } : {}) }}>
          {p.venmo_handle ? "💸 " : ""}Venmo
        </a>
        <a href={p.cashapp_handle
            ? `https://cash.app/$${encodeURIComponent(p.cashapp_handle)}/${amount}`
            : "https://cash.app/"}
          target="_blank" rel="noopener noreferrer"
          style={{ ...S.payBtn, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, ...(p.cashapp_handle ? { borderColor: "#00D64F50", color: "#00D64F" } : {}) }}>
          {p.cashapp_handle ? "💸 " : ""}Cash App
        </a>
        <button
          onClick={() => p.zelle_handle ? copyZelle(p.zelle_handle, zelleKey) : window.open("https://www.zellepay.com/", "_blank")}
          style={{ ...S.payBtn, ...(p.zelle_handle ? { borderColor: "#6D1ED450", color: "#9B59D4" } : {}), ...(copied === zelleKey ? { borderColor: P.success + "60", color: P.success } : {}) }}>
          {copied === zelleKey ? "✓ Copied" : (p.zelle_handle ? "📋 Zelle" : "Zelle")}
        </button>
      </div>
    );
  };

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Settle Up</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          {mine.length > 0 && (
            <div style={S.settleSection}>
              <div style={S.fieldLbl}>YOU OWE</div>
              {mine.map((s, i) => (
                <div key={i} style={{ ...S.settleRow, opacity: marked.includes(`m${i}`) ? 0.4 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={S.settlePeople}><span style={{ color: P.danger }}>You</span> → <span style={{ color: P.terracotta }}>{s.to}</span></div>
                      <div style={S.settleAmt}>${s.amount}</div>
                    </div>
                    <button onClick={() => toggle(`m${i}`)} style={{ ...S.markBtn, ...(marked.includes(`m${i}`) ? S.markBtnDone : {}) }}>
                      {marked.includes(`m${i}`) ? "✓" : "Mark"}
                    </button>
                  </div>
                  <PayButtons toName={s.to} amount={s.amount} settlementKey={`m${i}`} />
                </div>
              ))}
            </div>
          )}
          {others.length > 0 && (
            <div style={S.settleSection}>
              <div style={S.fieldLbl}>OTHERS OWE</div>
              {others.map((s, i) => (
                <div key={i} style={{ ...S.settleRow, opacity: marked.includes(`o${i}`) ? 0.4 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={S.settlePeople}><span style={{ color: P.orange }}>{s.from}</span> → <span style={{ color: P.terracotta }}>{s.to}</span></div>
                      <div style={S.settleAmt}>${s.amount}</div>
                    </div>
                    <button onClick={() => toggle(`o${i}`)} style={{ ...S.markBtn, ...(marked.includes(`o${i}`) ? S.markBtnDone : {}) }}>
                      {marked.includes(`o${i}`) ? "✓ Done" : "Confirm"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {Object.keys(payHandles).length === 0 && mine.length > 0 && (
            <div style={{ background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 12, padding: "12px 14px", fontSize: 12, color: P.textMuted }}>
              💡 Payment buttons work better when members add their handles in Settings → Payment Handles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
