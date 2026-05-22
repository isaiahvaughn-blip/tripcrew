import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { P, S } from "../constants";

function SummaryTab({ trip, settlements, myName, expenses }) {
  const [members, setMembers] = useState([]);
  const [itinCount, setItinCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    supabase.from('members').select('*').eq('trip_id', trip.id).then(({ data }) => setMembers(data || []));
    supabase.from('itinerary').select('id').eq('trip_id', trip.id).then(({ data }) => setItinCount(data?.length || 0));
    supabase.from('photos').select('id').eq('trip_id', trip.id).then(({ data }) => setPhotoCount(data?.length || 0));
  }, [trip.id]);

  const total = expenses.reduce((a, e) => a + (e.amount || 0), 0);
  const myOwed = settlements.filter(s => s.from === myName).reduce((a, s) => a + s.amount, 0);
  const categoryTotals = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}><div style={S.tabTitle}>Summary</div></div>
      <div style={SS.statsGrid}>
        <div style={SS.statCard}><div style={SS.statVal}>${total.toLocaleString()}</div><div style={SS.statLbl}>total spent</div></div>
        <div style={SS.statCard}><div style={SS.statVal}>{members.length}</div><div style={SS.statLbl}>travelers</div></div>
        <div style={SS.statCard}><div style={{ ...SS.statVal, color: myOwed > 0 ? P.danger : P.success }}>{myOwed > 0 ? `-$${myOwed}` : "Even"}</div><div style={SS.statLbl}>your balance</div></div>
        <div style={SS.statCard}><div style={SS.statVal}>{itinCount}</div><div style={SS.statLbl}>stops</div></div>
      </div>
      <div style={SS.section}>
        <div style={SS.sectionLabel}>TRIP DETAILS</div>
        <div style={SS.detailCard}>
          <div style={SS.detailRow}><span style={SS.detailLbl}>Destination</span><span style={SS.detailVal}>{trip.location || "—"}</span></div>
          <div style={SS.detailRow}><span style={SS.detailLbl}>Dates</span><span style={SS.detailVal}>{trip.dates || "—"}</span></div>
          <div style={SS.detailRow}><span style={SS.detailLbl}>Travelers</span><span style={SS.detailVal}>{members.map(m => m.name).join(", ") || "—"}</span></div>
          <div style={{ ...SS.detailRow, borderBottom: "none" }}><span style={SS.detailLbl}>Memories</span><span style={SS.detailVal}>{photoCount} photo{photoCount !== 1 ? "s" : ""}</span></div>
        </div>
      </div>
      {Object.keys(categoryTotals).length > 0 && (
        <div style={SS.section}>
          <div style={SS.sectionLabel}>SPEND BREAKDOWN</div>
          <div style={SS.detailCard}>
            {Object.entries(categoryTotals).map(([cat, amt], i, arr) => {
              const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
              const meta = { Stay: P.success, Dining: "#e4a0b0", Drinks: P.orange, Activity: P.lightBlue, Shopping: "#d4a0e0", Travel: "#a090d0", Flight: P.lightBlue, Other: P.slateBlue };
              return (
                <div key={cat} style={{ ...SS.detailRow, ...(i === arr.length - 1 ? { borderBottom: "none" } : {}) }}>
                  <span style={SS.detailLbl}>{cat}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 60, height: 4, borderRadius: 4, background: P.surface3, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: meta[cat] || P.terracotta, borderRadius: 4 }} />
                    </div>
                    <span style={{ ...SS.detailVal, minWidth: 40, textAlign: "right" }}>${amt.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {settlements.length > 0 && (
        <div style={SS.section}>
          <div style={SS.sectionLabel}>BALANCES</div>
          <div style={SS.detailCard}>
            {settlements.map((s, i) => (
              <div key={i} style={{ ...SS.detailRow, ...(i === settlements.length - 1 ? { borderBottom: "none" } : {}) }}>
                <span style={SS.detailLbl}>{s.from} → {s.to}</span>
                <span style={{ ...SS.detailVal, color: s.from === myName ? P.danger : P.textSecondary }}>${s.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ height: 20 }} />
    </div>
  );
}

const SS = {
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 },
  statCard: { background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 16, padding: "18px 16px", textAlign: "center" },
  statVal: { fontSize: 24, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px", marginBottom: 4 },
  statLbl: { fontSize: 11, color: P.textMuted, letterSpacing: "0.5px" },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: 800, color: P.textMuted, letterSpacing: "2.5px", marginBottom: 10 },
  detailCard: { background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 16, overflow: "hidden" },
  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: `1px solid ${P.surface3}` },
  detailLbl: { fontSize: 13, color: P.textMuted },
  detailVal: { fontSize: 13, fontWeight: 700, color: P.textPrimary, maxWidth: 180, textAlign: "right" },
};


export default SummaryTab;
