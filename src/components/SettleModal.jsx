import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { P, S } from "../constants";
import { resolveName } from "../utils";

export default function SettleModal({ settlements: calculated, myName, myUserId, trip, profileMap = {}, onClose }) {
  const [rows,    setRows]    = useState([]);
  const [payHandles, setPayHandles] = useState({});
  const [copied,  setCopied]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Fetch persisted rows
      const { data: existing } = await supabase
        .from("settlements").select("*").eq("trip_id", trip.id);

      // Build a map of existing received rows keyed by from+to+amount
      const receivedKeys = new Set(
        (existing || [])
          .filter(r => r.received)
          .map(r => `${r.from_user_id || r.from_name}|${r.to_user_id || r.to_name}|${r.amount}`)
      );

      // Delete all existing rows and reinsert from fresh calculation
      // but preserve received=true where amount still matches
      if ((existing || []).length > 0) {
        await supabase.from("settlements").delete().eq("trip_id", trip.id);
      }

      if (calculated.length > 0) {
        // Look up user IDs for from/to names
        const { data: tmRows } = await supabase
          .from("trip_members").select("user_id").eq("trip_id", trip.id);
        const userIds = (tmRows || []).map(r => r.user_id).filter(Boolean);
        const { data: profiles } = userIds.length
          ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
          : { data: [] };

        // Build name→id map
        const nameToId = {};
        (profiles || []).forEach(p => { if (p.display_name) nameToId[p.display_name] = p.id; });

        // Build payHandles map
        const { data: fullProfiles } = userIds.length
          ? await supabase.from("profiles").select("id, display_name, venmo_handle, cashapp_handle, zelle_handle").in("id", userIds)
          : { data: [] };
        const handles = {};
        (fullProfiles || []).forEach(p => { if (p.display_name) handles[p.display_name] = p; });
        setPayHandles(handles);

        const toInsert = calculated.map(c => {
          const fromId = nameToId[c.from] || null;
          const toId   = nameToId[c.to]   || null;
          const key    = `${fromId || c.from}|${toId || c.to}|${c.amount}`;
          return {
            trip_id:      trip.id,
            from_user_id: fromId,
            to_user_id:   toId,
            from_name:    fromId ? null : c.from,
            to_name:      toId   ? null : c.to,
            amount:       c.amount,
            received:     receivedKeys.has(key),
            received_at:  receivedKeys.has(key) ? (existing.find(r => `${r.from_user_id || r.from_name}|${r.to_user_id || r.to_name}|${r.amount}` === key)?.received_at || null) : null,
          };
        });

        const { data: inserted } = await supabase
          .from("settlements").insert(toInsert).select();
        setRows(inserted || []);
      } else {
        setRows([]);
      }

      setLoading(false);
    };
    init();
  }, [trip.id, calculated.length]);

  const toggleReceived = async (row) => {
    const newVal = !row.received;
    const { data } = await supabase.from("settlements")
      .update({ received: newVal, received_at: newVal ? new Date().toISOString() : null })
      .eq("id", row.id).select().single();
    if (data) setRows(prev => prev.map(r => r.id === data.id ? data : r));
  };

  const copyZelle = (handle, key) => {
    navigator.clipboard.writeText(handle).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2000);
    });
  };

  const resolvePair = (row) => ({
    fromName: row.from_user_id ? (profileMap[row.from_user_id] || row.from_name || row.from_user_id) : row.from_name,
    toName:   row.to_user_id   ? (profileMap[row.to_user_id]   || row.to_name   || row.to_user_id)   : row.to_name,
  });

  const PayButtons = ({ toName, amount, rowId }) => {
    const p    = payHandles[toName] || {};
    const note = encodeURIComponent(trip?.name || "Trip");
    const zelleKey = `zelle-${rowId}`;
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        <a href={p.venmo_handle
            ? `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(p.venmo_handle)}&amount=${amount}&note=${note}`
            : "https://venmo.com/"}
          target="_blank" rel="noopener noreferrer"
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
          onClick={() => p.zelle_handle
            ? copyZelle(p.zelle_handle, zelleKey)
            : window.open("https://www.zellepay.com/", "_blank")}
          style={{ ...S.payBtn, ...(p.zelle_handle ? { borderColor: "#6D1ED450", color: "#9B59D4" } : {}), ...(copied === zelleKey ? { borderColor: P.success + "60", color: P.success } : {}) }}>
          {copied === zelleKey ? "✓ Copied" : (p.zelle_handle ? "📋 Zelle" : "Zelle")}
        </button>
      </div>
    );
  };

  const renderRow = (row) => {
    const { fromName, toName } = resolvePair(row);
    const isPayer = fromName === myName;
    const isPayee = toName   === myName;

    return (
      <div key={row.id} style={{
        ...S.settleRow,
        opacity: row.received ? 0.5 : 1,
        borderColor: row.received ? P.success + "40" : P.surface3,
        background:  row.received ? P.successBg : P.surface2,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={S.settlePeople}>
              <span style={{ color: isPayer ? P.danger : P.orange }}>{fromName}</span>
              <span style={{ color: P.textMuted, fontSize: 13 }}> → </span>
              <span style={{ color: isPayee ? P.success : P.terracotta }}>{toName}</span>
            </div>
            <div style={S.settleAmt}>${row.amount}</div>
          </div>
          {row.received && (
            <div style={{ background: P.successBg, color: P.success, fontSize: 10, fontWeight: 800, letterSpacing: "1px", padding: "4px 10px", borderRadius: 8, border: `1px solid ${P.success}30` }}>
              RECEIVED
            </div>
          )}
        </div>

        {/* Payer: show pay buttons */}
        {isPayer && !row.received && (
          <PayButtons toName={toName} amount={row.amount} rowId={row.id} />
        )}

        {/* Payee: mark received / unmark */}
        {isPayee && (
          <button onClick={() => toggleReceived(row)}
            style={{ ...S.markBtn, marginTop: 10, width: "100%",
              ...(row.received
                ? { ...S.markBtnDone, border: `1px solid ${P.success}40` }
                : { background: P.surface1, border: `1px solid ${P.terracotta}40`, color: P.terracotta })
            }}>
            {row.received ? "✓ Received — tap to unmark" : "Mark as Received"}
          </button>
        )}

        {/* Third party */}
        {!isPayer && !isPayee && !row.received && (
          <div style={{ fontSize: 12, color: P.textMuted, marginTop: 6 }}>Pending between {fromName} and {toName}</div>
        )}
      </div>
    );
  };

  const pending  = rows.filter(r => !r.received);
  const received = rows.filter(r =>  r.received);

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Settle Up</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: P.textMuted, fontSize: 14 }}>Loading...</div>
          ) : rows.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: P.textMuted, fontSize: 14 }}>Everyone's even — nothing to settle.</div>
          ) : (
            <>
              {pending.length > 0 && (
                <div style={S.settleSection}>
                  <div style={S.fieldLbl}>PENDING</div>
                  {pending.map(renderRow)}
                </div>
              )}
              {received.length > 0 && (
                <div style={S.settleSection}>
                  <div style={S.fieldLbl}>RECEIVED</div>
                  {received.map(renderRow)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
