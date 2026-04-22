import { supabase } from './supabase'
import { useState, useEffect } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const ME = {
  name: "Isaiah",
  initials: "IJ",
  tripsCount: 14,
  countriesCount: 9,
  since: "2019",
};

const TRIPS = [
  {
    id: 1,
    name: "Banff & Jasper",
    dates: "Aug 3–10, 2025",
    location: "Alberta, Canada",
    members: ["Isaiah", "Marcus", "Priya", "Derek", "Sofia"],
    bg: "linear-gradient(135deg, #0d2b1e 0%, #1a4a32 100%)",
    tag: "#4ade80",
    emoji: "🏔️",
    totalSpent: 3840,
    settled: false,
    solo: false,
  },
  {
    id: 2,
    name: "Portland → Bend",
    dates: "Mar 14–16, 2025",
    location: "Oregon, USA",
    members: ["Isaiah", "Marcus", "Derek"],
    bg: "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)",
    tag: "#c084fc",
    emoji: "🚴",
    totalSpent: 960,
    settled: true,
    solo: false,
  },
  {
    id: 3,
    name: "Tokyo Solo",
    dates: "Nov 8–18, 2024",
    location: "Japan",
    members: ["Isaiah"],
    bg: "linear-gradient(135deg, #1a0a0a 0%, #3a1515 100%)",
    tag: "#f87171",
    emoji: "🗾",
    totalSpent: 2200,
    settled: true,
    solo: true,
  },
];

const ITINERARY = [
  { id: 1, day: "Aug 3", time: "6:00 AM", type: "flight", title: "YVR → YYC", detail: "Air Canada AC 302 · Conf: XK92JA", icon: "✈️", status: "confirmed" },
  { id: 2, day: "Aug 3", time: "2:00 PM", type: "stay", title: "Fairmont Lake Louise", detail: "Check-in · 5 nights · Conf: FL-889234", icon: "🏨", status: "confirmed" },
  { id: 3, day: "Aug 4", time: "9:00 AM", type: "activity", title: "Lake Louise Morning Hike", detail: "Plain of Six Glaciers Trail · ~4hrs", icon: "🥾", status: "confirmed" },
  { id: 4, day: "Aug 5", time: "8:00 AM", type: "transport", title: "Icefields Parkway Drive", detail: "Lake Louise → Jasper · ~3.5hrs", icon: "🚗", status: "confirmed" },
  { id: 5, day: "Aug 5", time: "12:30 PM", type: "restaurant", title: "Lunch at Sunwapta Falls", detail: "Sunwapta Falls Resort Restaurant", icon: "🍽️", status: "confirmed" },
  { id: 6, day: "Aug 5", time: "3:00 PM", type: "activity", title: "Icefields Parkway Tour", detail: "Glacier Adventure · Booking #ICE-4821", icon: "🧊", status: "confirmed" },
  { id: 7, day: "Aug 6", time: "7:00 AM", type: "activity", title: "Sunrise Hike — Whistlers", detail: "Meeting Marcus & Derek at trailhead", icon: "🌅", status: "confirmed" },
  { id: 8, day: "Aug 7", time: "7:00 PM", type: "restaurant", title: "Dinner — Coco's Café", detail: "Res for 5 · Jasper Ave · Conf: R-7721", icon: "🍷", status: "confirmed" },
  { id: 9, day: "Aug 8", time: "10:00 AM", type: "activity", title: "Jasper SkyTram", detail: "5 tickets · Booking #JST-0044", icon: "🚡", status: "confirmed" },
  { id: 10, day: "Aug 10", time: "11:00 AM", type: "flight", title: "YYC → PDX", detail: "Air Canada AC 561 · Conf: MN44TX", icon: "✈️", status: "confirmed" },
];

const EXPENSES = [
  { id: 1, title: "Fairmont Lake Louise", category: "Stay", amount: 1240, paidBy: "Marcus", splitWith: ["Isaiah", "Marcus", "Priya", "Derek", "Sofia"], date: "Aug 3", receipt: false },
  { id: 2, title: "Groceries & Snacks", category: "Food", amount: 186, paidBy: "Isaiah", splitWith: ["Isaiah", "Marcus", "Priya", "Derek", "Sofia"], date: "Aug 4", receipt: false },
  { id: 3, title: "Icefields Parkway Tour", category: "Activity", amount: 320, paidBy: "Sofia", splitWith: ["Isaiah", "Marcus", "Priya", "Derek", "Sofia"], date: "Aug 5", receipt: true },
  { id: 4, title: "Dinner at Coco's", category: "Food", amount: 218, paidBy: "Priya", splitWith: ["Isaiah", "Marcus", "Priya"], date: "Aug 7", receipt: true },
  { id: 5, title: "Rental Car", category: "Transport", amount: 640, paidBy: "Derek", splitWith: ["Isaiah", "Marcus", "Priya", "Derek", "Sofia"], date: "Aug 3", receipt: false },
  { id: 6, title: "Jasper Brewing Co", category: "Food", amount: 145, paidBy: "Isaiah", splitWith: ["Isaiah", "Marcus", "Derek"], date: "Aug 7", receipt: false },
  { id: 7, title: "SkyTram Tickets", category: "Activity", amount: 275, paidBy: "Marcus", splitWith: ["Isaiah", "Marcus", "Priya", "Derek", "Sofia"], date: "Aug 8", receipt: true },
  { id: 8, title: "Gas", category: "Transport", amount: 96, paidBy: "Isaiah", splitWith: ["Isaiah", "Marcus", "Priya", "Derek", "Sofia"], date: "Aug 4", receipt: false },
];

const PHOTOS = [
  { id: 1, uploader: "Sofia", caption: "First morning at the lake", date: "Aug 3", color: "#1a3a2a", emoji: "🏔️", wide: true, sensitive: false },
  { id: 2, uploader: "Marcus", caption: "The SkyTram crew", date: "Aug 8", color: "#1e1535", emoji: "🚡", wide: false, sensitive: false },
  { id: 3, uploader: "Isaiah", caption: "Icefields stop", date: "Aug 5", color: "#1a2535", emoji: "🧊", wide: false, sensitive: false },
  { id: 4, uploader: "Priya", caption: "Dinner vibes", date: "Aug 7", color: "#251520", emoji: "🍷", wide: false, sensitive: true },
  { id: 5, uploader: "Derek", caption: "Sunrise on Whistlers", date: "Aug 6", color: "#1e2a1a", emoji: "🌅", wide: true, sensitive: false },
  { id: 6, uploader: "Marcus", caption: "Columbia Icefield walk", date: "Aug 5", color: "#151a25", emoji: "❄️", wide: false, sensitive: false },
];

const SETTLEMENTS = [
  { from: "Isaiah", to: "Marcus", amount: 168 },
  { from: "Isaiah", to: "Derek", amount: 84 },
  { from: "Priya", to: "Marcus", amount: 92 },
  { from: "Sofia", to: "Marcus", amount: 140 },
  { from: "Sofia", to: "Derek", amount: 56 },
];

const ITINERARY_COLORS = {
  flight: { bg: "#0f2744", accent: "#60a5fa", border: "#1e3a5f" },
  stay: { bg: "#1a2c0f", accent: "#86efac", border: "#2d4a1e" },
  activity: { bg: "#2a1505", accent: "#fb923c", border: "#4a2a0f" },
  restaurant: { bg: "#250f1a", accent: "#f472b6", border: "#4a1e35" },
  transport: { bg: "#1a1505", accent: "#fbbf24", border: "#3a2a0f" },
};

const CATEGORY_META = {
  Stay: { color: "#86efac", bg: "#14532d" },
  Food: { color: "#34d399", bg: "#065f46" },
  Activity: { color: "#fb923c", bg: "#7c2d12" },
  Transport: { color: "#fbbf24", bg: "#713f12" },
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("profile"); // profile | trip
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [modal, setModal] = useState(null); // null | "addExpense" | "addItinerary" | "settle" | "share"

  const openTrip = (trip) => {
    setActiveTrip(trip);
    setActiveTab("itinerary");
    setView("trip");
  };

  return (
    <div style={S.root}>
      <div style={S.phone}>
        {view === "profile" && (
          <ProfileScreen onOpen={openTrip} />
        )}
        {view === "trip" && activeTrip && (
          <TripShell
            trip={activeTrip}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onBack={() => setView("profile")}
            onModal={setModal}
          />
        )}
        {modal === "addExpense" && (
          <AddExpenseModal members={activeTrip?.members || []} onClose={() => setModal(null)} />
        )}
        {modal === "addItinerary" && (
          <AddItineraryModal onClose={() => setModal(null)} />
        )}
        {modal === "settle" && (
          <SettleModal settlements={SETTLEMENTS} onClose={() => setModal(null)} />
        )}
        {modal === "share" && (
          <ShareModal trip={activeTrip} onClose={() => setModal(null)} />
        )}
      </div>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

function ProfileScreen({ onOpen }) {
  const [trips, setTrips] = useState([]);

useEffect(() => {
  const fetchTrips = async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setTrips(data)
  }
  fetchTrips()
}, [])
  const handleNewTrip = async () => {
  const { data, error } = await supabase
    .from('trips')
    .insert([{
      name: 'New Trip',
      location: 'Somewhere',
      dates: 'TBD',
      emoji: '✈️',
      bg: 'linear-gradient(135deg, #0d2b1e 0%, #1a4a32 100%)',
      tag: '#4ade80',
      total_spent: 0,
      settled: false,
      solo: false
    }])
    .select()
  if (error) console.error(error)
  else console.log('Trip created:', data)
}
  return (
    <div style={S.screen}>
      <div style={S.profileHero}>
        <div style={S.profileAvatar}>{ME.initials}</div>
        <div style={S.profileName}>{ME.name}</div>
        <div style={S.profileSub}>tripcrew member since {ME.since}</div>
        <div style={S.profileStats}>
          <div style={S.statItem}>
            <div style={S.statNum}>{ME.tripsCount}</div>
            <div style={S.statLbl}>trips</div>
          </div>
          <div style={S.statDiv} />
          <div style={S.statItem}>
            <div style={S.statNum}>{ME.countriesCount}</div>
            <div style={S.statLbl}>countries</div>
          </div>
          <div style={S.statDiv} />
          <div style={S.statItem}>
            <div style={S.statNum}>3</div>
            <div style={S.statLbl}>this year</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 40px" }}>
        <div style={S.sectionRow}>
          <div style={S.sectionLabel}>YOUR TRIPS</div>
          <button style={S.newBtn} onClick={handleNewTrip}>+ New</button>
        </div>
        {trips.map((t, i) => (
          <TripCard key={t.id} trip={t} idx={i} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip, idx, onOpen }) {
  const members = trip.members || [];
  const tag = trip.tag || "#4ade80";
  const bg = trip.bg || "linear-gradient(135deg, #0d2b1e 0%, #1a4a32 100%)";

  return (
    <div
      style={{ ...S.tripCard, background: bg, animationDelay: `${idx * 80}ms` }}
      onClick={() => onOpen(trip)}
    >
      <div style={S.tcTop}>
        <span style={S.tcEmoji}>{trip.emoji || "✈️"}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {trip.solo && <span style={S.soloBadge}>SOLO</span>}
          {trip.settled && <span style={S.settledBadge}>SETTLED</span>}
        </div>
      </div>
      <div style={S.tcName}>{trip.name}</div>
      <div style={S.tcLocation}>{trip.location} · {trip.dates}</div>
      <div style={S.tcBottom}>
        <div style={S.tcMembers}>
          {members.slice(0, 4).map((m, i) => (
            <div key={i} style={{ ...S.mDot, background: tag + "30", color: tag, borderColor: bg, marginLeft: i > 0 ? -7 : 0 }}>
              {m[0]}
            </div>
          ))}
          {members.length > 4 && (
            <div style={{ ...S.mDot, background: "#ffffff10", color: "#94a3b8", borderColor: bg, marginLeft: -7 }}>
              +{members.length - 4}
            </div>
          )}
        </div>
        <div style={{ ...S.tcTotal, color: tag }}>${(trip.total_spent || 0).toLocaleString()}</div>
      </div>
    </div>
  );
}
// ─── TRIP SHELL ───────────────────────────────────────────────────────────────

function TripShell({ trip, activeTab, setActiveTab, onBack, onModal }) {
  const tabs = [
    { id: "itinerary", label: "Itinerary", icon: "🗓" },
    { id: "expenses", label: "Expenses", icon: "💸" },
    { id: "uploads", label: "Uploads", icon: "📸" },
    { id: "members", label: "Members", icon: "👥" },
  ];

  return (
    <div style={S.tripShell}>
      {/* Header */}
      <div style={{ ...S.tripHeader, background: trip.bg }}>
        <button style={S.backBtn} onClick={onBack}>←</button>
        <div style={S.thMid}>
          <div style={S.thEmoji}>{trip.emoji}</div>
          <div>
            <div style={S.thName}>{trip.name}</div>
            <div style={S.thSub}>{trip.location} · {trip.dates}</div>
          </div>
        </div>
        <button style={{ ...S.shareHeaderBtn, color: trip.tag }} onClick={() => onModal("share")}>
          ↗ Share
        </button>
      </div>

      {/* Tab Content */}
      <div style={S.tabContent}>
        {activeTab === "itinerary" && <ItineraryTab trip={trip} onModal={onModal} />}
        {activeTab === "expenses" && <ExpensesTab trip={trip} onModal={onModal} />}
        {activeTab === "uploads" && <UploadsTab />}
        {activeTab === "members" && <MembersTab trip={trip} />}
      </div>

      {/* Bottom Tab Bar */}
      <div style={S.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{ ...S.tabBtn, ...(activeTab === tab.id ? S.tabBtnActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={S.tabIcon}>{tab.icon}</span>
            <span style={{ ...S.tabLabel, ...(activeTab === tab.id ? { color: trip.tag } : {}) }}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div style={{ ...S.tabDot, background: trip.tag }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ITINERARY TAB ────────────────────────────────────────────────────────────

function ItineraryTab({ trip, onModal }) {
  const days = [...new Set(ITINERARY.map(i => i.day))];

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Itinerary</div>
        <button style={{ ...S.actionBtn, borderColor: trip.tag + "60", color: trip.tag }} onClick={() => onModal("addItinerary")}>
          + Add
        </button>
      </div>

      {days.map(day => (
        <div key={day} style={S.dayBlock}>
          <div style={S.dayLabel}>{day}</div>
          {ITINERARY.filter(i => i.day === day).map(item => {
            const meta = ITINERARY_COLORS[item.type];
            return (
              <div key={item.id} style={{ ...S.iRow, background: meta.bg, borderColor: meta.border }}>
                <div style={S.iTime}>{item.time}</div>
                <div style={S.iLine}>
                  <div style={{ ...S.iDot, background: meta.accent }} />
                  <div style={S.iConnector} />
                </div>
                <div style={S.iBody}>
                  <div style={S.iTitle}>
                    <span style={S.iEmoji}>{item.icon}</span>
                    {item.title}
                  </div>
                  <div style={S.iDetail}>{item.detail}</div>
                  <div style={{ ...S.iType, color: meta.accent }}>{item.type}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── EXPENSES TAB ─────────────────────────────────────────────────────────────

function ExpensesTab({ trip, onModal }) {
  const [filter, setFilter] = useState("All");
  const [showSettle, setShowSettle] = useState(false);
  const cats = ["All", "Stay", "Food", "Activity", "Transport"];
  const filtered = filter === "All" ? EXPENSES : EXPENSES.filter(e => e.category === filter);
  const total = EXPENSES.reduce((a, e) => a + e.amount, 0);
  const myOwed = SETTLEMENTS.filter(s => s.from === "Isaiah").reduce((a, s) => a + s.amount, 0);

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Expenses</div>
        <button style={{ ...S.actionBtn, borderColor: trip.tag + "60", color: trip.tag }} onClick={() => onModal("addExpense")}>
          + Add
        </button>
      </div>

      {/* Summary strip */}
      <div style={S.expSummary}>
        <div style={S.expSumItem}>
          <div style={S.expSumVal}>${total.toLocaleString()}</div>
          <div style={S.expSumLbl}>total spent</div>
        </div>
        <div style={S.expSumDiv} />
        <div style={S.expSumItem}>
          <div style={S.expSumVal}>{trip.members.length}</div>
          <div style={S.expSumLbl}>travelers</div>
        </div>
        <div style={S.expSumDiv} />
        <div style={S.expSumItem}>
          <div style={{ ...S.expSumVal, color: "#f87171" }}>${myOwed}</div>
          <div style={S.expSumLbl}>you owe</div>
        </div>
      </div>

      {/* Settle CTA */}
      <button style={S.settleCta} onClick={() => onModal("settle")}>
        <span>⚖️ Settle Up — {SETTLEMENTS.filter(s => s.from === "Isaiah").length} transfers pending</span>
        <span style={S.settleArrow}>→</span>
      </button>

      {/* Filters */}
      <div style={S.filterRow}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{ ...S.chip, ...(filter === c ? { ...S.chipActive, borderColor: trip.tag, color: trip.tag, background: trip.tag + "15" } : {}) }}>
            {c}
          </button>
        ))}
      </div>

      {/* Expense list */}
      {filtered.map(exp => {
        const meta = CATEGORY_META[exp.category];
        const perPerson = (exp.amount / exp.splitWith.length).toFixed(0);
        return (
          <div key={exp.id} style={S.expRow}>
            <div style={{ ...S.expIcon, background: meta.bg, color: meta.color }}>
              {exp.category[0]}
            </div>
            <div style={S.expBody}>
              <div style={S.expTitle}>{exp.title}</div>
              <div style={S.expMeta}>
                {exp.date} · <span style={{ color: "#e2e8f0" }}>{exp.paidBy}</span> paid · ${perPerson}/person
              </div>
            </div>
            <div style={S.expRight}>
              <div style={S.expAmt}>${exp.amount}</div>
              {exp.receipt && <div style={S.receiptBadge}>📎</div>}
            </div>
          </div>
        );
      })}
      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── UPLOADS TAB ──────────────────────────────────────────────────────────────

function UploadsTab() {
  const [photos, setPhotos] = useState(PHOTOS);

  const toggleSensitive = (id) => {
    setPhotos(p => p.map(ph => ph.id === id ? { ...ph, sensitive: !ph.sensitive } : ph));
  };

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Memories</div>
        <button style={S.actionBtn}>+ Upload</button>
      </div>

      <div style={S.sensitiveNote}>
        🔒 Mark photos as sensitive to exclude them from Wrapped and shared exports.
      </div>

      <div style={S.photoGrid}>
        {photos.map(ph => (
          <div key={ph.id} style={{ ...S.photoCard, ...(ph.wide ? S.photoWide : {}), background: ph.color, opacity: ph.sensitive ? 0.5 : 1 }}>
            <div style={S.photoEmoji}>{ph.emoji}</div>
            {ph.sensitive && <div style={S.sensitiveLock}>🔒</div>}
            <div style={S.photoOverlay}>
              <div style={S.photoCaption}>{ph.caption}</div>
              <div style={S.photoMeta}>{ph.uploader} · {ph.date}</div>
              <button
                style={{ ...S.sensitiveBtn, ...(ph.sensitive ? S.sensitiveBtnOn : {}) }}
                onClick={() => toggleSensitive(ph.id)}
              >
                {ph.sensitive ? "Sensitive" : "Mark sensitive"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={S.uploadDrop}>
        <div style={S.uploadIcon}>📎</div>
        <div style={S.uploadText}>Drop anything here</div>
        <div style={S.uploadSub}>Photos, videos, receipts, links, PDFs</div>
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── MEMBERS TAB ──────────────────────────────────────────────────────────────

function MembersTab({ trip }) {
  const colors = ["#4ade80", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa"];
  const myPaid = EXPENSES.filter(e => e.paidBy === "Isaiah").reduce((a, e) => a + e.amount, 0);

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Members</div>
        <button style={S.actionBtn}>+ Invite</button>
      </div>

      {trip.members.map((m, i) => {
        const paid = EXPENSES.filter(e => e.paidBy === m).reduce((a, e) => a + e.amount, 0);
        const owes = SETTLEMENTS.filter(s => s.from === m).reduce((a, s) => a + s.amount, 0);
        const owed = SETTLEMENTS.filter(s => s.to === m).reduce((a, s) => a + s.amount, 0);
        return (
          <div key={m} style={S.memberRow}>
            <div style={{ ...S.memberAvatar, background: colors[i % colors.length] + "25", color: colors[i % colors.length] }}>
              {m[0]}
            </div>
            <div style={S.memberInfo}>
              <div style={S.memberName}>{m} {m === "Isaiah" ? <span style={S.youTag}>you</span> : ""}</div>
              <div style={S.memberMeta}>Paid ${paid.toLocaleString()}</div>
            </div>
            <div style={S.memberRight}>
              {owes > 0 && <div style={S.owesBadge}>owes ${owes}</div>}
              {owed > 0 && <div style={S.owedBadge}>owed ${owed}</div>}
              {owes === 0 && owed === 0 && <div style={S.evenBadge}>even</div>}
            </div>
          </div>
        );
      })}

      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────

function AddExpenseModal({ members, onClose }) {
  const [step, setStep] = useState(1); // 1: details, 2: split, 3: confirm
  const [exp, setExp] = useState({ title: "", amount: "", category: "Food", paidBy: "Isaiah", splitWith: [...members] });

  const perPerson = exp.amount && exp.splitWith.length
    ? (parseFloat(exp.amount) / exp.splitWith.length).toFixed(2) : null;

  const toggleMember = (m) => {
    setExp(e => ({
      ...e,
      splitWith: e.splitWith.includes(m) ? e.splitWith.filter(x => x !== m) : [...e.splitWith, m]
    }));
  };

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>
            {step === 1 ? "What was it?" : step === 2 ? "Who's splitting?" : "Confirm"}
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={S.stepRow}>
          {[1,2,3].map(s => (
            <div key={s} style={{ ...S.stepDot, ...(s <= step ? S.stepDotActive : {}) }} />
          ))}
        </div>

        {step === 1 && (
          <div style={S.sheetBody}>
            {/* Receipt scan prompt */}
            <div style={S.receiptScan}>
              <span style={{ fontSize: 20 }}>📷</span>
              <div>
                <div style={S.scanTitle}>Scan a receipt</div>
                <div style={S.scanSub}>Auto-fill amount & merchant</div>
              </div>
              <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 700 }}>Try it</span>
            </div>

            <div style={S.orDiv}><span style={S.orText}>or enter manually</span></div>

            <div style={S.field}>
              <div style={S.fieldLbl}>DESCRIPTION</div>
              <input style={S.input} placeholder="e.g. Dinner at Coco's"
                value={exp.title} onChange={e => setExp(n => ({ ...n, title: e.target.value }))} />
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>AMOUNT</div>
              <div style={S.amountWrap}>
                <span style={S.dollarSign}>$</span>
                <input style={{ ...S.input, paddingLeft: 28, fontSize: 24, fontWeight: 800, letterSpacing: "-1px" }}
                  type="number" placeholder="0.00"
                  value={exp.amount} onChange={e => setExp(n => ({ ...n, amount: e.target.value }))} />
              </div>
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>CATEGORY</div>
              <div style={S.catRow}>
                {["Food","Stay","Activity","Transport"].map(c => (
                  <button key={c} onClick={() => setExp(n => ({ ...n, category: c }))}
                    style={{ ...S.catBtn, ...(exp.category === c ? { background: CATEGORY_META[c].bg, color: CATEGORY_META[c].color, borderColor: CATEGORY_META[c].color } : {}) }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>PAID BY</div>
              <div style={S.paidRow}>
                {members.map(m => (
                  <button key={m} onClick={() => setExp(n => ({ ...n, paidBy: m }))}
                    style={{ ...S.paidBtn, ...(exp.paidBy === m ? S.paidBtnActive : {}) }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button style={S.primaryBtn} onClick={() => setStep(2)}>Next → Split</button>
          </div>
        )}

        {step === 2 && (
          <div style={S.sheetBody}>
            <div style={S.splitInfo}>
              <div style={S.splitAmt}>${exp.amount || "0"}</div>
              <div style={S.splitLbl}>splitting {exp.splitWith.length} ways</div>
              {perPerson && <div style={S.perPerson}>${perPerson} per person</div>}
            </div>
            <div style={S.splitGrid}>
              {members.map(m => (
                <button key={m} onClick={() => toggleMember(m)}
                  style={{ ...S.splitMember, ...(exp.splitWith.includes(m) ? S.splitMemberOn : {}) }}>
                  <div style={{ ...S.splitAvatar, ...(exp.splitWith.includes(m) ? { background: "#14532d", color: "#4ade80" } : {}) }}>
                    {m[0]}
                  </div>
                  <div style={S.splitName}>{m}</div>
                  {exp.splitWith.includes(m) && <div style={S.splitCheck}>✓</div>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.secondaryBtn} onClick={() => setStep(1)}>← Back</button>
              <button style={S.primaryBtn} onClick={() => setStep(3)}>Review</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={S.sheetBody}>
            <div style={S.confirmCard}>
              <div style={S.confirmRow}><span style={S.confirmLbl}>What</span><span style={S.confirmVal}>{exp.title || "—"}</span></div>
              <div style={S.confirmRow}><span style={S.confirmLbl}>Amount</span><span style={S.confirmVal}>${exp.amount}</span></div>
              <div style={S.confirmRow}><span style={S.confirmLbl}>Category</span><span style={S.confirmVal}>{exp.category}</span></div>
              <div style={S.confirmRow}><span style={S.confirmLbl}>Paid by</span><span style={S.confirmVal}>{exp.paidBy}</span></div>
              <div style={S.confirmRow}><span style={S.confirmLbl}>Split</span><span style={S.confirmVal}>{exp.splitWith.length} people · ${perPerson}/ea</span></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.secondaryBtn} onClick={() => setStep(2)}>← Edit</button>
              <button style={{ ...S.primaryBtn, background: "#22c55e", color: "#000" }} onClick={onClose}>
                ✓ Add Expense
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddItineraryModal({ onClose }) {
  const [form, setForm] = useState({ type: "activity", title: "", detail: "", day: "", time: "" });
  const types = ["flight", "stay", "activity", "restaurant", "transport"];

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Add to Itinerary</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          <div style={S.field}>
            <div style={S.fieldLbl}>TYPE</div>
            <div style={S.catRow}>
              {types.map(t => {
                const meta = ITINERARY_COLORS[t];
                return (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ ...S.catBtn, textTransform: "capitalize", ...(form.type === t ? { background: meta.bg, color: meta.accent, borderColor: meta.accent } : {}) }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>TITLE</div>
            <input style={S.input} placeholder="e.g. Dinner at Coco's"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DETAILS / CONFIRMATION #</div>
            <input style={S.input} placeholder="Confirmation code, address, notes..."
              value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>DATE</div>
              <input style={S.input} placeholder="Aug 5"
                value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} />
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>TIME</div>
              <input style={S.input} placeholder="7:00 PM"
                value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <button style={{ ...S.primaryBtn, background: "#60a5fa", color: "#000" }} onClick={onClose}>
            Add to Itinerary
          </button>
        </div>
      </div>
    </div>
  );
}

function SettleModal({ settlements, onClose }) {
  const [marked, setMarked] = useState([]);
  const toggle = (i) => setMarked(m => m.includes(i) ? m.filter(x => x !== i) : [...m, i]);
  const mine = settlements.filter(s => s.from === "Isaiah");
  const others = settlements.filter(s => s.from !== "Isaiah");

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Settle Up</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          <div style={S.settleSection}>
            <div style={S.fieldLbl}>YOU OWE</div>
            {mine.map((s, i) => (
              <div key={i} style={{ ...S.settleRow, opacity: marked.includes(`m${i}`) ? 0.4 : 1 }}>
                <div>
                  <div style={S.settlePeople}><span style={{ color: "#f87171" }}>You</span> → <span style={{ color: "#4ade80" }}>{s.to}</span></div>
                  <div style={S.settleAmt}>${s.amount}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={S.payBtn}>Venmo</button>
                  <button style={S.payBtn}>Zelle</button>
                  <button onClick={() => toggle(`m${i}`)} style={{ ...S.markBtn, ...(marked.includes(`m${i}`) ? S.markBtnDone : {}) }}>
                    {marked.includes(`m${i}`) ? "✓" : "Mark"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={S.settleSection}>
            <div style={S.fieldLbl}>OTHERS OWE</div>
            {others.map((s, i) => (
              <div key={i} style={{ ...S.settleRow, opacity: marked.includes(`o${i}`) ? 0.4 : 1 }}>
                <div>
                  <div style={S.settlePeople}><span style={{ color: "#fb923c" }}>{s.from}</span> → <span style={{ color: "#4ade80" }}>{s.to}</span></div>
                  <div style={S.settleAmt}>${s.amount}</div>
                </div>
                <button onClick={() => toggle(`o${i}`)} style={{ ...S.markBtn, ...(marked.includes(`o${i}`) ? S.markBtnDone : {}) }}>
                  {marked.includes(`o${i}`) ? "✓ Done" : "Confirm"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ trip, onClose }) {
  const [copied, setCopied] = useState(false);
  const options = [
    { icon: "🗓", label: "Full Itinerary", sub: "All stops, times & confirmations", color: "#60a5fa" },
    { icon: "📍", label: "Places & Recs", sub: "Restaurants, activities & stays only", color: "#4ade80" },
    { icon: "📋", label: "Trip Summary", sub: "Overview with spend & members", color: "#fb923c" },
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
          <div style={S.shareSubtitle}>Choose what to share from <strong style={{ color: "#f1f5f9" }}>{trip?.name}</strong></div>
          {options.map(opt => (
            <div key={opt.label} style={S.shareOption}>
              <span style={{ fontSize: 22 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ ...S.shareOptTitle, color: opt.color }}>{opt.label}</div>
                <div style={S.shareOptSub}>{opt.sub}</div>
              </div>
              <button style={{ ...S.copyBtn, borderColor: opt.color + "50", color: opt.color }}>
                Copy link
              </button>
            </div>
          ))}
          <div style={S.shareNote}>
            🔒 Sensitive photos and private notes are always excluded from shared exports.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const S = {
  root: {
    minHeight: "100vh",
    background: "#060609",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "32px 16px",
    fontFamily: "'Syne', 'DM Sans', 'Helvetica Neue', sans-serif",
  },
  phone: {
    width: 430,
    maxWidth: "100%",
    background: "#0c0c14",
    borderRadius: 36,
    overflow: "hidden",
    boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
    minHeight: 750,
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  screen: {
    flex: 1,
    overflowY: "auto",
  },

  // Profile
  profileHero: {
    padding: "48px 24px 28px",
    textAlign: "center",
    background: "linear-gradient(180deg, #111122 0%, #0c0c14 100%)",
    borderBottom: "1px solid #1a1a2a",
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4ade80, #22d3ee)",
    color: "#000",
    fontSize: 22,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
    letterSpacing: "-1px",
  },
  profileName: {
    fontSize: 26,
    fontWeight: 900,
    color: "#f8fafc",
    letterSpacing: "-1.2px",
    marginBottom: 4,
  },
  profileSub: {
    fontSize: 12,
    color: "#475569",
    letterSpacing: "1px",
    marginBottom: 20,
  },
  profileStats: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 0,
    background: "#13131e",
    borderRadius: 16,
    padding: "14px 0",
    border: "1px solid #1a1a2a",
  },
  statItem: { flex: 1, textAlign: "center" },
  statNum: { fontSize: 22, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-1px" },
  statLbl: { fontSize: 10, color: "#475569", letterSpacing: "1px", marginTop: 2 },
  statDiv: { width: 1, height: 30, background: "#1e1e2e" },

  sectionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, marginTop: 28 },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "2.5px" },
  newBtn: { background: "#22c55e", color: "#000", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer" },

  tripCard: {
    borderRadius: 22,
    padding: "20px",
    marginBottom: 12,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  tcTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  tcEmoji: { fontSize: 30 },
  soloBadge: { background: "#1e293b", color: "#64748b", fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", padding: "3px 8px", borderRadius: 8 },
  settledBadge: { background: "#14532d", color: "#4ade80", fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", padding: "3px 8px", borderRadius: 8 },
  tcName: { fontSize: 22, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.8px", marginBottom: 4 },
  tcLocation: { fontSize: 12, color: "#94a3b8", marginBottom: 16 },
  tcBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tcMembers: { display: "flex" },
  mDot: { width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, border: "2px solid" },
  tcTotal: { fontSize: 20, fontWeight: 900, letterSpacing: "-1px" },

  // Trip Shell
  tripShell: { flex: 1, display: "flex", flexDirection: "column", height: 750 },
  tripHeader: {
    padding: "24px 20px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { background: "#ffffff12", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  thMid: { flex: 1, display: "flex", alignItems: "center", gap: 10 },
  thEmoji: { fontSize: 26 },
  thName: { fontSize: 17, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.5px" },
  thSub: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  shareHeaderBtn: { background: "transparent", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: "0.3px", flexShrink: 0 },
  tabContent: { flex: 1, overflow: "hidden" },
  tabScroll: { height: "100%", overflowY: "auto", padding: "0 18px" },
  tabTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, paddingBottom: 16 },
  tabTitle: { fontSize: 20, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.8px" },
  actionBtn: { background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },

  // Tab bar
  tabBar: {
    display: "flex",
    background: "#0f0f1a",
    borderTop: "1px solid #1a1a28",
    padding: "10px 0 12px",
    flexShrink: 0,
  },
  tabBtn: { flex: 1, background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", position: "relative" },
  tabBtnActive: {},
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.3px" },
  tabDot: { width: 4, height: 4, borderRadius: "50%", position: "absolute", bottom: -4 },

  // Itinerary
  dayBlock: { marginBottom: 20 },
  dayLabel: { fontSize: 11, fontWeight: 800, color: "#334155", letterSpacing: "2px", marginBottom: 8 },
  iRow: {
    display: "flex",
    gap: 10,
    padding: "12px",
    borderRadius: 14,
    border: "1px solid",
    marginBottom: 8,
  },
  iTime: { fontSize: 11, color: "#64748b", width: 44, flexShrink: 0, paddingTop: 2, fontWeight: 600 },
  iLine: { display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 },
  iDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 3 },
  iConnector: { flex: 1, width: 1, background: "#1e293b", marginTop: 4 },
  iBody: { flex: 1 },
  iTitle: { fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 },
  iEmoji: { fontSize: 14 },
  iDetail: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  iType: { fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" },

  // Expenses
  expSummary: { display: "flex", background: "#13131e", borderRadius: 16, marginBottom: 12, border: "1px solid #1a1a2a" },
  expSumItem: { flex: 1, padding: "14px 0", textAlign: "center" },
  expSumDiv: { width: 1, background: "#1e1e2e", margin: "10px 0" },
  expSumVal: { fontSize: 18, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.8px" },
  expSumLbl: { fontSize: 10, color: "#475569", marginTop: 2, letterSpacing: "0.5px" },
  settleCta: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "#1a1a2e", border: "1px solid #2d2d4a", borderRadius: 14, padding: "12px 16px", color: "#a78bfa", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 14, boxSizing: "border-box" },
  settleArrow: { fontSize: 16 },
  filterRow: { display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 2 },
  chip: { background: "#13131e", border: "1px solid #1e1e2e", color: "#475569", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  chipActive: {},
  expRow: { display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid #13131e" },
  expIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 },
  expBody: { flex: 1 },
  expTitle: { fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 },
  expMeta: { fontSize: 12, color: "#475569" },
  expRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  expAmt: { fontSize: 15, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.5px" },
  receiptBadge: { fontSize: 12 },

  // Uploads
  sensitiveNote: { background: "#1a1a10", border: "1px solid #2a2a1a", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#a3a380", marginBottom: 14 },
  photoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  photoCard: { borderRadius: 16, height: 130, display: "flex", alignItems: "flex-end", position: "relative", overflow: "hidden", cursor: "pointer", transition: "opacity 0.2s" },
  photoWide: { gridColumn: "span 2", height: 160 },
  photoEmoji: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -65%)", fontSize: 36 },
  sensitiveLock: { position: "absolute", top: 8, right: 8, fontSize: 14 },
  photoOverlay: { background: "linear-gradient(transparent, rgba(0,0,0,0.8))", width: "100%", padding: "20px 10px 10px" },
  photoCaption: { fontSize: 12, fontWeight: 700, color: "#f1f5f9" },
  photoMeta: { fontSize: 10, color: "#94a3b8", marginTop: 1, marginBottom: 5 },
  sensitiveBtn: { background: "#1e293b", border: "none", color: "#64748b", borderRadius: 10, padding: "3px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" },
  sensitiveBtnOn: { background: "#451a03", color: "#fb923c" },
  uploadDrop: { border: "1.5px dashed #1e293b", borderRadius: 16, padding: "22px", textAlign: "center", cursor: "pointer" },
  uploadIcon: { fontSize: 22, marginBottom: 6 },
  uploadText: { fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 3 },
  uploadSub: { fontSize: 12, color: "#2d3748" },

  // Members
  memberRow: { display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid #13131e" },
  memberAvatar: { width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, flexShrink: 0 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: 700, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 6 },
  youTag: { background: "#1e3a5f", color: "#60a5fa", fontSize: 9, fontWeight: 800, borderRadius: 6, padding: "2px 6px", letterSpacing: "1px" },
  memberMeta: { fontSize: 12, color: "#475569", marginTop: 2 },
  memberRight: {},
  owesBadge: { background: "#450a0a", color: "#f87171", fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "4px 8px" },
  owedBadge: { background: "#14532d", color: "#4ade80", fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "4px 8px" },
  evenBadge: { background: "#1e293b", color: "#64748b", fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "4px 8px" },

  // Modals
  overlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", zIndex: 100, backdropFilter: "blur(6px)" },
  sheet: { background: "#12121c", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "88%", overflowY: "auto", paddingBottom: 20 },
  sheetHandle: { width: 36, height: 4, background: "#2d2d4a", borderRadius: 10, margin: "12px auto 0" },
  sheetHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px" },
  sheetTitle: { fontSize: 18, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.5px" },
  closeBtn: { background: "#1e293b", border: "none", color: "#94a3b8", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" },
  sheetBody: { padding: "4px 20px 20px" },
  stepRow: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 },
  stepDot: { width: 6, height: 6, borderRadius: "50%", background: "#1e293b" },
  stepDotActive: { background: "#4ade80" },

  receiptScan: { display: "flex", alignItems: "center", gap: 12, background: "#1a2a1a", border: "1px solid #2d4a2d", borderRadius: 14, padding: "14px", marginBottom: 12, cursor: "pointer" },
  scanTitle: { fontSize: 14, fontWeight: 700, color: "#e2e8f0" },
  scanSub: { fontSize: 11, color: "#64748b" },
  orDiv: { display: "flex", alignItems: "center", marginBottom: 14 },
  orText: { fontSize: 11, color: "#334155", margin: "0 auto", letterSpacing: "0.5px" },

  field: { marginBottom: 16 },
  fieldLbl: { fontSize: 9, fontWeight: 800, color: "#334155", letterSpacing: "2.5px", marginBottom: 8 },
  input: { background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 12, padding: "12px 14px", color: "#f1f5f9", fontSize: 15, width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  amountWrap: { position: "relative" },
  dollarSign: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 15, fontWeight: 700 },
  catRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  catBtn: { background: "#13131e", border: "1px solid #1e293b", color: "#64748b", borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  paidRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  paidBtn: { background: "#13131e", border: "1px solid #1e293b", color: "#64748b", borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  paidBtnActive: { background: "#1e3a5f", border: "1px solid #3b82f6", color: "#60a5fa" },

  splitInfo: { textAlign: "center", padding: "16px 0 20px", borderBottom: "1px solid #1a1a28", marginBottom: 16 },
  splitAmt: { fontSize: 40, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-2px" },
  splitLbl: { fontSize: 12, color: "#475569", marginTop: 4 },
  perPerson: { fontSize: 14, color: "#4ade80", fontWeight: 700, marginTop: 6 },
  splitGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 },
  splitMember: { background: "#13131e", border: "1px solid #1e293b", borderRadius: 14, padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" },
  splitMemberOn: { border: "1px solid #22c55e", background: "#0f1f0f" },
  splitAvatar: { width: 36, height: 36, borderRadius: "50%", background: "#1e293b", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 },
  splitName: { fontSize: 11, color: "#94a3b8", fontWeight: 600 },
  splitCheck: { position: "absolute", top: 6, right: 6, fontSize: 9, color: "#4ade80", fontWeight: 800 },

  confirmCard: { background: "#13131e", borderRadius: 16, padding: "16px", marginBottom: 20, border: "1px solid #1e1e2e" },
  confirmRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1a28" },
  confirmLbl: { fontSize: 12, color: "#475569" },
  confirmVal: { fontSize: 13, fontWeight: 700, color: "#e2e8f0" },

  primaryBtn: { background: "#1e293b", color: "#f1f5f9", border: "none", borderRadius: 14, padding: "14px", width: "100%", fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: "-0.3px" },
  secondaryBtn: { background: "#13131e", color: "#64748b", border: "1px solid #1e293b", borderRadius: 14, padding: "14px", flex: 1, fontSize: 14, fontWeight: 700, cursor: "pointer" },

  // Settle modal
  settleSection: { marginBottom: 20 },
  settleRow: { background: "#13131e", borderRadius: 14, padding: "14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "opacity 0.2s", border: "1px solid #1a1a2a" },
  settlePeople: { fontSize: 15, fontWeight: 700, marginBottom: 3 },
  settleAmt: { fontSize: 12, color: "#475569" },
  payBtn: { background: "#13131e", border: "1px solid #2d3748", color: "#94a3b8", borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  markBtn: { background: "#1e293b", border: "none", color: "#64748b", borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  markBtnDone: { background: "#14532d", color: "#4ade80" },

  // Share modal
  shareSubtitle: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  shareOption: { display: "flex", alignItems: "center", gap: 12, background: "#13131e", border: "1px solid #1e1e2e", borderRadius: 16, padding: "14px", marginBottom: 10 },
  shareOptTitle: { fontSize: 14, fontWeight: 800, marginBottom: 2 },
  shareOptSub: { fontSize: 12, color: "#475569" },
  copyBtn: { background: "transparent", border: "1px solid", borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  shareNote: { background: "#131310", border: "1px solid #2a2a1a", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#8a8a60", marginTop: 6 },
};
