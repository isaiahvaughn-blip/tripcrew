import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { DollarSign } from "lucide-react";
import { P, S, CATS, CATEGORY_META, CAT_ICONS } from "../constants";
import { resolveName } from "../utils";
import ConfirmModal from "./ConfirmModal";

const EXPENSE_PLACEHOLDERS = {
  Dining:   "e.g. Nobu, dinner for 4",
  Drinks:   "e.g. Teardrop bar tab",
  Stay:     "e.g. Fairmont 2 nights",
  Activity: "e.g. Museum of Fine Arts",
  Shopping: "e.g. Zara haul",
  Travel:   "e.g. Dollar Car Rental",
  Flight:   "e.g. PDX to LAX round trip",
  Other:    "e.g. what was it?",
};

// ─── ADD / EDIT EXPENSE MODAL ─────────────────────────────────────────────────

export function AddExpenseModal({ onClose, trip, onAdd, user, profile, existingExpense, profileMap = {} }) {
  const [members, setMembers] = useState([]); // [{ id: uuid|name, label: displayName }]
  const [step, setStep] = useState(1);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState(false);
  const [exp, setExp] = useState({
    title:     existingExpense?.title    || "",
    amount:    existingExpense?.amount   || "",
    category:  existingExpense?.category || "Dining",
    paidBy:    "",  // uuid or guest name
    splitWith: [], // uuids or guest names
  });

  useEffect(() => {
    const fetchMembers = async () => {
      // Get trip_members with user_ids
      const { data: tmRows } = await supabase
        .from("trip_members").select("user_id, invited_email").eq("trip_id", trip.id);

      // Get member display names (guests without accounts)
      const { data: memberRows } = await supabase
        .from("members").select("name").eq("trip_id", trip.id);

      const list = [];
      const seen = new Set();

      // Registered users first
      const userIds = (tmRows || []).map(r => r.user_id).filter(Boolean);
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles").select("id, display_name").in("id", userIds);
        (profiles || []).forEach(p => {
          if (p.display_name && !seen.has(p.id)) {
            seen.add(p.id);
            list.push({ id: p.id, label: p.display_name });
          }
        });
      }

      // Guests (members table only) — skip anyone already in list as registered user
      const registeredNames = new Set(list.map(l => l.label.toLowerCase()));
      (memberRows || []).forEach(m => {
        if (!m.name) return;
        if (m.name.includes("@")) return;
        if (/^[a-z]+\.[a-z]+\d+$/i.test(m.name)) return;
        if (registeredNames.has(m.name.toLowerCase())) return; // already added as registered
        if (seen.has(m.name)) return;
        seen.add(m.name);
        list.push({ id: m.name, label: m.name });
      });

      setMembers(list);

      // Set defaults
      if (!existingExpense) {
        const myEntry = list.find(l => l.label === (profile?.display_name || ""));
        const myId = myEntry?.id || list[0]?.id || "";
        setExp(e => ({ ...e, paidBy: myId, splitWith: list.map(l => l.id) }));
      } else {
        // For existing expenses, filter split_with to only include IDs that exist in current members list
        // This cleans up any stale UUIDs or ghost members
        const validIds = new Set(list.map(l => l.id));
        const cleanSplitWith = (existingExpense.split_with || []).filter(id => validIds.has(id));
        setExp(e => ({
          ...e,
          paidBy:    existingExpense.paid_by || list[0]?.id || "",
          splitWith: cleanSplitWith,
        }));
      }
    };
    fetchMembers();
  }, [trip.id]);

  const perPerson = exp.amount && exp.splitWith.length
    ? (parseFloat(exp.amount) / exp.splitWith.length).toFixed(2) : null;

  const toggleMember = id => setExp(e => ({
    ...e, splitWith: e.splitWith.includes(id)
      ? e.splitWith.filter(x => x !== id)
      : [...e.splitWith, id],
  }));

  const labelFor = id => members.find(m => m.id === id)?.label || resolveName(id, profileMap) || id;

  const handleSubmit = async () => {
    if (existingExpense) {
      const { error } = await supabase.from("expenses").update({
        title: exp.title, category: exp.category,
        amount: parseFloat(exp.amount),
        paid_by: exp.paidBy,
        split_with: exp.splitWith,
      }).eq("id", existingExpense.id);
      if (error) { console.error(error); return; }
    } else {
      const { error } = await supabase.from("expenses").insert([{
        trip_id: trip?.id, title: exp.title, category: exp.category,
        amount: parseFloat(exp.amount),
        paid_by: exp.paidBy,
        split_with: exp.splitWith,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        receipt: false,
      }]);
      if (error) { console.error(error); return; }
    }
    if (onAdd) onAdd();
    onClose();
  };

  const stepTitles = ["", "What was it?", "Who's splitting?", "Looks good?"];

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: P.phoneBg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 22px 4px", flexShrink: 0 }}>
        <div style={S.sheetTitle}>{stepTitles[step]}</div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8, flexShrink: 0 }}>
        {[1,2,3].map(s => <div key={s} style={{ ...S.stepDot, ...(s <= step ? S.stepDotActive : {}) }} />)}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 22px", justifyContent: "space-between", minHeight: 0 }}>
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ marginBottom: 6 }}>
              <div style={S.fieldLbl}>CATEGORY</div>
              <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
                {CATS.map(c => {
                  const m = CATEGORY_META[c];
                  const CIcon = CAT_ICONS[c];
                  const selected = exp.category === c;
                  return (
                    <button key={c} onClick={() => setExp(n => ({ ...n, category: c }))}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 8px", borderRadius: 12, cursor: "pointer", minHeight: 46, minWidth: 52, flexShrink: 0, background: selected ? m.bg : P.surface1, border: selected ? `1px solid ${m.color}` : `1px solid ${P.surface3}` }}>
                      <CIcon size={14} color={selected ? m.color : P.textMuted} strokeWidth={1.5} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: selected ? m.color : P.textMuted, textTransform: "capitalize", letterSpacing: "0.3px" }}>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "2px 0 4px", borderBottom: `1px solid ${P.surface3}`, marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: P.textMuted, letterSpacing: "2px" }}>AMOUNT</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: P.textMuted }}>$</span>
                <input type="number" placeholder="0" value={exp.amount} onChange={e => setExp(n => ({ ...n, amount: e.target.value }))}
                  style={{ background: "transparent", border: "none", outline: "none", fontSize: 32, fontWeight: 900, color: P.textPrimary, letterSpacing: "-1px", width: 130, textAlign: "center", fontFamily: "'Syne', sans-serif" }} />
              </div>
              {perPerson && <div style={{ fontSize: 11, color: P.slateBlue }}>${perPerson}/person</div>}
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={S.fieldLbl}>DESCRIPTION</div>
              <input style={{ ...S.input, padding: "10px 16px" }} placeholder={EXPENSE_PLACEHOLDERS[exp.category] || "e.g. what was it?"} value={exp.title} onChange={e => setExp(n => ({ ...n, title: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={S.fieldLbl}>PAID BY</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {members.map(m => (
                  <button key={m.id} onClick={() => setExp(n => ({ ...n, paidBy: m.id }))}
                    style={{ ...S.paidBtn, ...(exp.paidBy === m.id ? S.paidBtnActive : {}) }}>{m.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ paddingBottom: 16, flexShrink: 0, display: "flex", gap: 10 }}>
            {existingExpense && (
              <button style={{ background: P.dangerBg, border: `1px solid ${P.danger}40`, color: P.danger, borderRadius: 16, padding: "16px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                onClick={() => setConfirmDeleteExpense(true)}>
                🗑
              </button>
            )}
            <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, flex: 1 }}
              onClick={() => { if (!exp.amount || parseFloat(exp.amount) <= 0) return; members.length <= 1 ? setStep(3) : setStep(2); }}>
              {members.length <= 1 ? "Review →" : "Next → Split"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 22px", justifyContent: "space-between", minHeight: 0 }}>
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ textAlign: "center", padding: "8px 0 14px", borderBottom: `1px solid ${P.surface3}`, marginBottom: 12 }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: P.textPrimary, letterSpacing: "-2px" }}>${exp.amount || "0"}</div>
              <div style={{ fontSize: 13, color: P.textMuted, marginTop: 4 }}>splitting {exp.splitWith.length} ways</div>
              {perPerson && <div style={{ fontSize: 15, color: P.terracotta, fontWeight: 700, marginTop: 4 }}>${perPerson}/person</div>}
            </div>
            <div style={S.splitGrid}>
              {members.map(m => (
                <button key={m.id} onClick={() => toggleMember(m.id)}
                  style={{ ...S.splitMember, ...(exp.splitWith.includes(m.id) ? S.splitMemberOn : {}) }}>
                  <div style={{ ...S.splitAvatar, ...(exp.splitWith.includes(m.id) ? { background: P.successBg, color: P.success } : {}) }}>{m.label[0]}</div>
                  <div style={S.splitName}>{m.label}</div>
                  {exp.splitWith.includes(m.id) && <div style={S.splitCheck}>✓</div>}
                </button>
              ))}
            </div>
          </div>
          <div style={{ paddingBottom: 16, flexShrink: 0, display: "flex", gap: 10 }}>
            {existingExpense && (
              <button style={{ background: P.dangerBg, border: `1px solid ${P.danger}40`, color: P.danger, borderRadius: 16, padding: "16px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                onClick={() => setConfirmDeleteExpense(true)}>
                🗑
              </button>
            )}
            <button style={{ ...S.secondaryBtn, flex: 1 }} onClick={() => setStep(1)}>← Back</button>
            <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, flex: 1 }} onClick={() => setStep(3)}>Review →</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 22px", justifyContent: "space-between", minHeight: 0 }}>
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ background: P.surface2, borderRadius: 16, overflow: "hidden", border: `1px solid ${P.surface3}`, marginBottom: 12 }}>
              {[
                { label: "What",     val: exp.title || "—" },
                { label: "Amount",   val: `$${exp.amount}` },
                { label: "Category", val: exp.category },
                { label: "Paid by",  val: labelFor(exp.paidBy) },
                { label: "Split",    val: `${exp.splitWith.length} people · $${perPerson}/ea` },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${P.surface3}` : "none" }}>
                  <span style={{ fontSize: 13, color: P.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: P.textPrimary }}>{row.val}</span>
                </div>
              ))}
            </div>
            {existingExpense && (
              <button style={{ ...S.primaryBtn, background: "transparent", color: P.danger, border: `1px solid ${P.danger}40` }}
                onClick={() => setConfirmDeleteExpense(true)}>
                Delete Expense
              </button>
            )}
          </div>
          <div style={{ paddingBottom: 16, flexShrink: 0, display: "flex", gap: 10 }}>
            <button style={S.secondaryBtn} onClick={() => setStep(existingExpense ? 1 : 2)}>← Edit</button>
            <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={handleSubmit}>
              {existingExpense ? "✓ Save Changes" : "✓ Add Expense"}
            </button>
          </div>
        </div>
      )}
      {confirmDeleteExpense && (
        <ConfirmModal
          message="Delete this expense?"
          onConfirm={async () => {
            await supabase.from("expenses").delete().eq("id", existingExpense.id);
            if (onAdd) onAdd(); onClose();
          }}
          onCancel={() => setConfirmDeleteExpense(false)}
          confirmLabel="Delete"
          danger
        />
      )}
    </div>
  );
}

// ─── EXPENSES TAB ─────────────────────────────────────────────────────────────

export default function ExpensesTab({ trip, onModal, profile, user, expenses, settlements, myName, profileMap = {}, onEditExpense }) {
  const [filter, setFilter] = useState("All");
  const [memberCount, setMemberCount] = useState(0);
  const cats = ["All", ...CATS];

  useEffect(() => {
    supabase.from("members").select("id").eq("trip_id", trip.id)
      .then(({ data }) => setMemberCount(data?.length || 0));
  }, [trip.id]);

  const filtered  = filter === "All" ? expenses : expenses.filter(e => e.category === filter);
  const total     = expenses.reduce((a, e) => a + e.amount, 0);
  const myOwed    = settlements.filter(s => s.from === myName).reduce((a, s) => a + s.amount, 0);
  const myOwedTo  = settlements.filter(s => s.to   === myName).reduce((a, s) => a + s.amount, 0);

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Expenses</div>
        <div style={{ display: "flex", gap: 8 }}>
          {settlements.length > 0 && (
            <button style={{ ...S.actionBtn, borderColor: P.lightBlue + "60", color: P.lightBlue }}
              onClick={() => onModal("settle")}>⚖️ Settle Up</button>
          )}
          <button style={S.newBtn} onClick={() => onModal("addExpense")}>+ Add</button>
        </div>
      </div>
      <div style={S.expSummary}>
        <div style={S.expSumItem}>
          <div style={S.expSumVal}>${total.toLocaleString()}</div>
          <div style={S.expSumLbl}>total spent</div>
        </div>
        <div style={S.expSumDiv} />
        <div style={S.expSumItem}>
          <div style={S.expSumVal}>{memberCount}</div>
          <div style={S.expSumLbl}>travelers</div>
        </div>
        <div style={S.expSumDiv} />
        <div style={S.expSumItem}>
          {myOwed > 0
            ? <><div style={{ ...S.expSumVal, color: P.danger }}>${myOwed}</div><div style={S.expSumLbl}>you owe</div></>
            : myOwedTo > 0
            ? <><div style={{ ...S.expSumVal, color: P.success }}>${myOwedTo}</div><div style={S.expSumLbl}>you're owed</div></>
            : <><div style={{ ...S.expSumVal, color: P.success }}>Even</div><div style={S.expSumLbl}>you owe</div></>
          }
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {cats.map(c => {
          const meta = CATEGORY_META[c];
          const CIcon = CAT_ICONS[c] || DollarSign;
          const selected = filter === c;
          return (
            <button key={c} onClick={() => setFilter(c)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 10px", borderRadius: 12, cursor: "pointer", minHeight: 50, minWidth: 56, flexShrink: 0, background: selected ? (c === "All" ? P.terracotta + "18" : meta?.bg || P.surface2) : P.surface1, border: selected ? `1px solid ${c === "All" ? P.terracotta : meta?.color || P.terracotta}` : `1px solid ${P.surface3}` }}>
              {c === "All"
                ? <DollarSign size={15} color={selected ? P.terracotta : P.textMuted} strokeWidth={1.5} />
                : <CIcon size={15} color={selected ? meta?.color : P.textMuted} strokeWidth={1.5} />}
              <span style={{ fontSize: 9, fontWeight: 700, color: selected ? (c === "All" ? P.terracotta : meta?.color) : P.textMuted, textTransform: "capitalize", letterSpacing: "0.3px" }}>{c}</span>
            </button>
          );
        })}
      </div>
      {filtered.map(exp => {
        const meta      = CATEGORY_META[exp.category];
        const splitWith = exp.split_with || [];
        const perPerson = splitWith.length ? (exp.amount / splitWith.length).toFixed(0) : exp.amount;
        const CatIcon   = CAT_ICONS[exp.category] || DollarSign;
        const paidByName = resolveName(exp.paid_by, profileMap);
        return (
          <div key={exp.id}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 8, background: P.surface1, borderRadius: 14, borderLeft: `3px solid ${meta?.color || P.terracotta}`, cursor: "pointer" }}
            onClick={() => onEditExpense(exp)}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: meta?.bg || P.surface2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CatIcon size={16} color={meta?.color || P.terracotta} strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: P.textPrimary, marginBottom: 2 }}>{exp.title}</div>
              <div style={{ fontSize: 12, color: P.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                {paidByName} · ${perPerson}/person{splitWith.length > 1 ? ` · ${splitWith.length} people` : ""}
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", flexShrink: 0 }}>${exp.amount}</div>
          </div>
        );
      })}
      <div style={{ height: 20 }} />
    </div>
  );
}
