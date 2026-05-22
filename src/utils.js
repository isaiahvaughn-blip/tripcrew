import { VIBES, METRIC_DEFS } from "./constants";

// ─── RESOLVE MEMBER IDS TO DISPLAY NAMES ─────────────────────────────────────
// profileMap: { uuid: displayName }
// entry: uuid string or plain display name (for guests)
export function resolveName(entry, profileMap) {
  if (!entry) return "";
  return profileMap[entry] || entry;
}

// ─── CALC SETTLEMENTS (works on resolved display names) ───────────────────────
export function calcSettlements(expenses, profileMap = {}) {
  const balances = {};
  expenses.forEach(exp => {
    const paidBy    = resolveName(exp.paid_by, profileMap);
    const splitWith = (exp.split_with || []).map(e => resolveName(e, profileMap));
    if (!splitWith.length) return;
    const share = exp.amount / splitWith.length;
    if (!balances[paidBy]) balances[paidBy] = 0;
    balances[paidBy] += exp.amount;
    splitWith.forEach(person => {
      if (!balances[person]) balances[person] = 0;
      balances[person] -= share;
    });
  });
  const settlements = [];
  const debtors   = Object.entries(balances).filter(([_, v]) => v < -0.01).map(([k, v]) => ({ name: k, amount: v }));
  const creditors = Object.entries(balances).filter(([_, v]) => v >  0.01).map(([k, v]) => ({ name: k, amount: v }));
  debtors.forEach(debtor => {
    let remaining = Math.abs(debtor.amount);
    creditors.forEach(creditor => {
      if (remaining < 0.01 || creditor.amount < 0.01) return;
      const payment = Math.min(remaining, creditor.amount);
      settlements.push({ from: debtor.name, to: creditor.name, amount: Math.round(payment) });
      remaining -= payment;
      creditor.amount -= payment;
    });
  });
  return settlements;
}

export function computeMetric(key, { trips, itinItems, expenses, photos, members }) {
  switch (key) {
    case "trips":       return trips.length;
    case "cities":      return new Set(trips.map(t => (t.city || t.location || "").split(",")[0].trim().toLowerCase()).filter(Boolean)).size;
    case "thisyear":    return trips.filter(t => new Date(t.created_at).getFullYear() === new Date().getFullYear()).length;
    case "nights": {
      let n = 0;
      trips.forEach(t => {
        if (t.start_date && t.end_date && t.start_date !== t.end_date) {
          const diff = (new Date(t.end_date) - new Date(t.start_date)) / 86400000;
          if (diff > 0) n += diff;
        }
      });
      return Math.round(n);
    }
    case "people":      return new Set(members.map(m => m.name)).size;
    case "countries":   return new Set(trips.map(t => { const parts = (t.location || "").split(","); return parts[parts.length - 1].trim().toLowerCase(); }).filter(Boolean)).size;
    case "restaurants": return itinItems.filter(i => i.type === "restaurant").length;
    case "activities":  return itinItems.filter(i => i.type === "activity").length;
    case "stays":       return itinItems.filter(i => i.type === "stay").length;
    case "stops":       return itinItems.length;
    case "memories":    return photos.length;
    case "spent":       return "$" + expenses.reduce((a, e) => a + (e.amount || 0), 0).toLocaleString();
    case "expenses":    return expenses.length;
    default: {
      if (key.startsWith("v_")) {
        const vibeKey = key.slice(2);
        return trips.filter(t => {
          const vibe = VIBES.find(v => v.key === vibeKey);
          return vibe && t.emoji === vibe.emoji;
        }).length;
      }
      return 0;
    }
  }
}

export function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}${ampm}`;
}

export function formatDates(start, end) {
  if (!start) return "";
  const s = new Date(start + "T12:00:00");
  if (!end || start === end)
    return s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const e = new Date(end + "T12:00:00");
  const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  if (sameMonth)
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${e.getDate()}, ${e.getFullYear()}`;
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${e.getFullYear()}`;
}

export function formatDayLabel(dateStr) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d)) return dateStr;
  const day  = d.toLocaleDateString("en-US", { weekday: "long" });
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return `${day} · ${date}`;
}

export function renderAvatarContent(profile, user) {
  const av = profile?.avatar;
  if (av?.startsWith("emoji:"))    return { text: av.slice(6),                            fontSize: 32 };
  if (av?.startsWith("name:"))     return { text: av.slice(5).slice(0, 3).toUpperCase(),  fontSize: 18 };
  if (av?.startsWith("initials:")) return { text: av.slice(9).slice(0, 3).toUpperCase(),  fontSize: 20 };
  return { text: (profile?.display_name || user?.email || "?").slice(0, 2).toUpperCase(), fontSize: 26 };
}
