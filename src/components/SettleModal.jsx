import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { P, S } from "../constants";
import { resolveName } from "../utils";

export default function SettleModal({ settlements: calculated, myName, myUserId, trip, profileMap: parentProfileMap = {}, onClose }) {
  const [rows,       setRows]       = useState([]);
  const [payHandles, setPayHandles] = useState({});
  const [copied,     setCopied]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [localProfileMap, setLocalProfileMap] = useState(parentProfileMap);

  // ── Calc total owed across all expenses ───────────────────────────────────
  const totalCalculated = calculated.reduce((a, c) => a + c.amount, 0);

  // ── Sum of received snapshots ─────────────────────────────────────────────
  const totalReceived = rows.filter(r => r.received).reduce((a, r) => a + (r.snapshot_amount || r.amount), 0);

  // ── Net pending = total calculated minus already-received snapshots ────────
  const netPending = Math.max(0, Math.round(totalCalculated - totalReceived));

  useEffect(() => {
    const init = async () => {
      // Fetch all persisted rows for this trip
      const { data: existing } = await supabase
        .from("settlements").select("*").eq("trip_id", trip.id)
        .order("created_at", { ascending: true });

      // Fetch payment handles + build profileMap
      const { data: tmRows } = await supabase
        .from("trip_members").select("user_id").eq("trip_id", trip.id);
      const userIds = (tmRows || []).map(r => r.user_id).filter(Boolean);

      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, venmo_handle, cashapp_handle, zelle_handle")
          .in("id", userIds);

        const handles = {};
        const localMap = { ...parentProfileMap };
        (profiles || []).forEach(p => {
          if (p.display_name) handles[p.display_name] = p;
          if (p.id && p.display_name) localMap[p.id] = p.display_name;
        });
        setPayHandles(handles);
        setLocalProfileMap(localMap);
      }

      // If no received rows exist yet — start fresh, insert calculated rows
      const receivedRows  = (existing || []).filter(r => r.received);
      const pendingRows   = (existing || []).filter(r => !r.received);

      // Always replace pending rows with fresh calculation
      if (pendingRows.length > 0) {
        await supabase.from("settlements")
          .delete().in("id", pendingRows.map(r => r.id));
      }

      // Insert new pending rows if there's a net amount to settle
      const newPendingRows = [];
      if (calculated.length > 0) {
        const { data: tmRows2 } = await supabase
          .from("trip_members").select("user_id").eq("trip_id", trip.id);
        const ids = (tmRows2 || []).map(r => r.user_id).filter(Boolean);
        const { data: profiles2 } = ids.length
          ? await supabase.from("profiles").select("id, display_name").in("id", ids)
          : { data: [] };
        const nameToId = {};
        (profiles2 || []).forEach(p => { if (p.display_name) nameToId[p.display_name] = p.id; });

        // Net pending amount per pair after subtracting received snapshots
        const receivedByPair = {};
        receivedRows.forEach(r => {
          const key = `${r.from_user_id || r.from_name}|${r.to_user_id || r.to_name}`;
          receivedByPair[key] = (receivedByPair[key] || 0) + (r.snapshot_amount || r.amount);
        });

        const toInsert = calculated
          .map(c => {
            const fromId = nameToId[c.from] || null;
            const toId   = nameToId[c.to]   || null;
            const key    = `${fromId || c.from}|${toId || c.to}`;
            const alreadyReceived = receivedByPair[key] || 0;
            const netAmount = Math.round(c.amount - alreadyReceived);
            if (netAmount <= 0) return null;
            return {
              trip_id:         trip.id,
              from_user_id:    fromId,
              to_user_id:      toId,
              from_name:       fromId ? null : c.from,
              to_name:         toId   ? null : c.to,
              amount:          netAmount,
              snapshot_amount: netAmount,
              received:        false,
            };
          })
          .filter(Boolean);

        if (toInsert.length > 0) {
          const { data: inserted } = await supabase
            .from("settlements").insert(toInsert).select();
          newPendingRows.push(...(inserted || []));
        }
      }

      // Combine: pending on top, received at bottom
      setRows([...newPendingRows, ...receivedRows]);
      setLoading(false);
    };
    init();
  }, [trip.id, calculated.map(s => `${s.from}|${s.to}|${s.amount}`).join(",")]);

  // ── Mark received (payee action) ──────────────────────────────────────────
  const markReceived = async (row) => {
    const { data } = await supabase.from("settlements")
      .update({ received: true, received_at: new Date().toISOString(), snapshot_amount: row.amount })
      .eq("id", row.id).select().single();
    if (data) {
      const updated = rows.map(r => r.id === data.id ? data : r);
      setRows([...updated.filter(r => !r.received), ...updated.filter(r => r.received)]);
      // Check if all settled → mark trip settled
      const allDone = calculated.every(c => {
        const fromId = Object.entries(localProfileMap).find(([_, v]) => v === c.from)?.[0];
        const toId   = Object.entries(localProfileMap).find(([_, v]) => v === c.to)?.[0];
        return updated.some(r => r.received &&
          (r.from_user_id === fromId || r.from_name === c.from) &&
          (r.to_user_id   === toId   || r.to_name   === c.to));
      });
      if (allDone) await supabase.from("trips").update({ settled: true }).eq("id", trip.id);
    }
  };

  // ── Unmark received ───────────────────────────────────────────────────────
  const unmarkReceived = async (row) => {
    const { data } = await supabase.from("settlements")
      .update({ received: false, received_at: null })
      .eq("id", row.id).select().single();
    if (data) {
      const updated = rows.map(r => r.id === data.id ? data : r);
      setRows([...updated.filter(r => !r.received), ...updated.filter(r => r.received)]);
      await supabase.from("trips").update({ settled: false }).eq("id", trip.id);
    }
  };

  // ── Zelle copy ────────────────────────────────────────────────────────────
  const copyZelle = (handle, key) => {
    navigator.clipboard.writeText(handle).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2000);
    });
  };

  // ── Resolve display names ─────────────────────────────────────────────────
  const resolvePair = (row) => ({
    fromName: row.from_user_id ? (localProfileMap[row.from_user_id] || row.from_name || row.from_user_id) : row.from_name,
    toName:   row.to_user_id   ? (localProfileMap[row.to_user_id]   || row.to_name   || row.to_user_id)   : row.to_name,
  });

  // ── Pay buttons ───────────────────────────────────────────────────────────
  const PayButtons = ({ toName, amount, rowId }) => {
    const p    = payHandles[toName] || {};
    const note = encodeURIComponent(trip?.name || "Trip");
    const zelleKey = `zelle-${rowId}`;
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <a href={p.venmo_handle
            ? `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(p.venmo_handle)}&amount=${amount}&note=${note}`
            : "https://venmo.com/"}
          target="_blank" rel="noopener noreferrer"
          style={{ ...S.payBtn, textDecoration: "none", ...(p.venmo_handle ? { borderColor: "#3D95CE50", color: "#3D95CE" } : {}) }}>
          {p.venmo_handle ? "💸 " : ""}Venmo
        </a>
        <a href={p.cashapp_handle
            ? `https://cash.app/$${encodeURIComponent(p.cashapp_handle)}/${amount}`
            : "https://cash.app/"}
          target="_blank" rel="noopener noreferrer"
          style={{ ...S.payBtn, textDecoration: "none", ...(p.cashapp_handle ? { borderColor: "#00D64F50", color: "#00D64F" } : {}) }}>
          {p.cashapp_handle ? "💸 " : ""}Cash App
        </a>
        <button onClick={() => p.zelle_handle ? copyZelle(p.zelle_handle, zelleKey) : window.open("https://www.zellepay.com/", "_blank")}
          style={{ ...S.payBtn, ...(p.zelle_handle ? { borderColor: "#6D1ED450", color: "#9B59D4" } : {}), ...(copied === zelleKey ? { borderColor: P.success + "60", color: P.success } : {}) }}>
          {copied === zelleKey ? "✓ Copied" : (p.zelle_handle ? "📋 Zelle" : "Zelle")}
        </button>
      </div>
    );
  };

  // ── Row renderer ──────────────────────────────────────────────────────────
  const renderRow = (row) => {
    const { fromName, toName } = resolvePair(row);
    const isPayer = fromName === myName;
    const isPayee = toName   === myName;

    return (
      <div key={row.id} style={{
        background:  row.received ? P.surface1 : P.surface2,
        borderRadius: 16,
        padding: "16px",
        marginBottom: 10,
        border: `1px solid ${row.received ? P.success + "30" : P.surface3}`,
        opacity: row.received ? 0.6 : 1,
        transition: "all 0.2s",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: row.received ? 0 : 6 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
              <span style={{ color: isPayer ? P.danger : P.orange }}>{fromName}</span>
              <span style={{ color: P.textMuted, fontSize: 13 }}> → </span>
              <span style={{ color: isPayee ? P.success : P.terracotta }}>{toName}</span>
            </div>
            <div style={{ fontSize: 13, color: P.textMuted }}>${row.amount}</div>
          </div>
          {row.received && (
            <div style={{ background: P.successBg, color: P.success, fontSize: 10, fontWeight: 800, letterSpacing: "1px", padding: "4px 10px", borderRadius: 8 }}>
              RECEIVED
            </div>
          )}
        </div>

        {/* Payer: pay buttons */}
        {isPayer && !row.received && (
          <PayButtons toName={toName} amount={row.amount} rowId={row.id} />
        )}

        {/* Payee: mark received */}
        {isPayee && !row.received && (
          <button onClick={() => markReceived(row)}
            style={{ ...S.markBtn, marginTop: 10, width: "100%", background: P.surface1, border: `1px solid ${P.terracotta}40`, color: P.terracotta }}>
            Mark as Received
          </button>
        )}

        {/* Payee: unmark option on received rows */}
        {isPayee && row.received && (
          <button onClick={() => unmarkReceived(row)}
            style={{ ...S.markBtn, marginTop: 8, width: "100%", fontSize: 11, color: P.textMuted, background: "transparent", border: "none" }}>
            tap to reopen
          </button>
        )}

        {/* Third party */}
        {!isPayer && !isPayee && !row.received && (
          <div style={{ fontSize: 12, color: P.textMuted, marginTop: 6 }}>Pending between {fromName} and {toName}</div>
        )}
      </div>
    );
  };

  const pendingRows  = rows.filter(r => !r.received);
  const receivedRows = rows.filter(r =>  r.received);

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
          ) : rows.length === 0 && calculated.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: P.textMuted, fontSize: 14 }}>Everyone's even — nothing to settle.</div>
          ) : (
            <>
              {pendingRows.length > 0 && (
                <div style={S.settleSection}>
                  <div style={S.fieldLbl}>PENDING</div>
                  {pendingRows.map(renderRow)}
                </div>
              )}
              {pendingRows.length === 0 && receivedRows.length > 0 && (
                <div style={{ textAlign: "center", padding: "16px 0 8px", color: P.success, fontSize: 14, fontWeight: 700 }}>
                  ✓ All settled up
                </div>
              )}
              {receivedRows.length > 0 && (
                <div style={S.settleSection}>
                  <div style={S.fieldLbl}>PREVIOUSLY SETTLED</div>
                  {receivedRows.map(renderRow)}
                </div>
              )}
              {!Object.values(payHandles).some(p => p.venmo_handle || p.cashapp_handle || p.zelle_handle) && pendingRows.some(r => resolvePair(r).fromName === myName) && (
                <div style={{ background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 12, padding: "12px 14px", fontSize: 12, color: P.textMuted, marginTop: 4 }}>
                  💡 Add payment handles in Settings for one-tap Venmo, Cash App & Zelle links.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
