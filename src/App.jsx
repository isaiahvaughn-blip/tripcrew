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
  const [user, setUser] = useState(null);
  const [view, setView] = useState("profile");
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [modal, setModal] = useState(null);
  const [itinRefresh, setItinRefresh] = useState(0);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Link pending invites when user logs in
  useEffect(() => {
    if (!user) return;
    const linkPendingInvites = async () => {
      const { data: pending } = await supabase
        .from('trip_members')
        .select('*')
        .eq('invited_email', user.email)
        .eq('status', 'pending')
        .is('user_id', null);
      if (!pending?.length) return;
      for (const invite of pending) {
        await supabase
          .from('trip_members')
          .update({ user_id: user.id, status: 'accepted' })
          .eq('id', invite.id);
      }
    };
    linkPendingInvites();
  }, [user]);

  if (!user) return <AuthScreen onAuth={setUser} />;

  const openTrip = (trip) => {
    setActiveTrip(trip);
    setActiveTab("itinerary");
    setView("trip");
  };

  return (
    <div style={S.root}>
      <div style={S.phone}>
        {view === "profile" && (
          <ProfileScreen onOpen={openTrip} user={user} profile={profile} onSignOut={async () => {
  await supabase.auth.signOut();
}} onSettings={() => setView("settings")} />
        )}
        {view === "settings" && (
          <SettingsScreen user={user} profile={profile} onBack={() => setView("profile")} onProfileUpdate={(updated) => setProfile(updated)} />
        )}
        {view === "trip" && activeTrip && (
          <TripShell
  trip={activeTrip}
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  onBack={() => setView("profile")}
  onModal={setModal}
  itinRefresh={itinRefresh}
  modal={modal}
  setModal={setModal}
  user={user}
  profile={profile}
  onItinRefresh={() => setItinRefresh(r => r + 1)}
/>
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

function ProfileScreen({ onOpen, user, onSignOut, onSettings, profile }) {
  const [trips, setTrips] = useState([]);
const [showNewTrip, setShowNewTrip] = useState(false);
useEffect(() => {
  const fetchTrips = async () => {
    // Get trip IDs the user belongs to
    const { data: memberRows } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('user_id', user.id);
    
    if (!memberRows?.length) { setTrips([]); return; }
    
    const tripIds = memberRows.map(r => r.trip_id);
    
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setTrips(data);
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
const [editingTrip, setEditingTrip] = useState(null);
const handleDeleteTrip = async (trip) => {
    if (!window.confirm(`Delete "${trip.name}"? You can restore it from settings.`)) return;
    const { error } = await supabase
      .from('trips')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', trip.id);
    if (error) { console.error(error); return; }
    setTrips(prev => prev.filter(t => t.id !== trip.id));
  };
  return (
    <div style={S.screen}>
      <div style={S.profileHero}>
        <div style={S.profileAvatar}>
          {(profile?.display_name || ME.name).slice(0, 2).toUpperCase()}
        </div>
        <div style={S.profileName}>{profile?.display_name || ME.name}</div>
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
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSave={(updated) => {
            setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
            setEditingTrip(null);
          }}
        />
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
        <button
          style={{ background: "transparent", border: "1px solid #1e293b", color: "#475569", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          onClick={onSettings}
        >
          ⚙️ Settings
        </button>
        <button
          style={{ background: "transparent", border: "1px solid #1e293b", color: "#475569", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          onClick={onSignOut}
        >
          Sign out
        </button>
      </div>
      <div style={{ padding: "0 20px 40px" }}>
        <div style={S.sectionRow}>
          <div style={S.sectionLabel}>YOUR TRIPS</div>
          <button style={S.newBtn} onClick={() => setShowNewTrip(true)}>+ New</button>
          {showNewTrip && (
            <NewTripModal
              onClose={() => setShowNewTrip(false)}
              userId={user.id}
              onSave={(trip) => {
                setTrips(prev => [trip, ...prev]);
                setShowNewTrip(false);
              }}
            />
          )}
        </div>
        {trips.map((t, i) => (
          <TripCard key={t.id} trip={t} idx={i} onOpen={onOpen} onDelete={handleDeleteTrip} onEdit={setEditingTrip} />
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip, idx, onOpen, onDelete, onEdit }) {
  const members = trip.members || [];
  const tag = trip.tag || "#4ade80";
  const bg = trip.bg || "linear-gradient(135deg, #0d2b1e 0%, #1a4a32 100%)";

  return (
    <div
      style={{ ...S.tripCard, background: bg, animationDelay: `${idx * 80}ms`, position: "relative" }}
      onClick={() => onOpen(trip)}
    >
      <button
        style={{ position: "absolute", top: 12, right: 44, background: "#ffffff10", border: "none", color: "#94a3b8", borderRadius: 8, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", zIndex: 10 }}
        onClick={(e) => { e.stopPropagation(); onEdit(trip); }}
      >
        ✎
      </button>
      <button
        style={{ position: "absolute", top: 12, right: 12, background: "#ffffff10", border: "none", color: "#94a3b8", borderRadius: 8, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", zIndex: 10 }}
        onClick={(e) => { e.stopPropagation(); onDelete(trip); }}
      >
        ✕
      </button>
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

function TripShell({ trip, activeTab, setActiveTab, onBack, onModal, itinRefresh, modal, setModal, user, profile, onItinRefresh }) {
  
  const tabs = [
    { id: "itinerary", label: "Itinerary", icon: (active, color) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? color : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )},
    { id: "expenses", label: "Expenses", icon: (active, color) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? color : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    )},
    { id: "uploads", label: "Uploads", icon: (active, color) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? color : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    )},
    { id: "members", label: "Members", icon: (active, color) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? color : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )},
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
      <div style={{ ...S.tabContent, position: "relative" }}>
        {activeTab === "itinerary" && <ItineraryTab trip={trip} onModal={onModal} refreshKey={itinRefresh} />}
        {activeTab === "expenses" && <ExpensesTab trip={trip} onModal={onModal} expRefresh={itinRefresh} />}
        {activeTab === "uploads" && <UploadsTab />}
        {activeTab === "members" && <MembersTab trip={trip} />}
        {modal === "addExpense" && (
          <AddExpenseModal trip={trip} user={user} profile={profile} onClose={() => setModal(null)} onAdd={onItinRefresh} />
        )}
        {modal === "addItinerary" && (
          <AddItinModal trip={trip} onClose={() => setModal(null)} onAdd={() => { setModal(null); onItinRefresh(); setTimeout(onItinRefresh, 100); }} />
        )}
        {modal === "settle" && (
          <SettleModal settlements={SETTLEMENTS} onClose={() => setModal(null)} />
        )}
        {modal === "share" && (
          <ShareModal trip={trip} onClose={() => setModal(null)} />
        )}
      </div>
      
      {/* Bottom Tab Bar */}
      <div style={S.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{ ...S.tabBtn, ...(activeTab === tab.id ? S.tabBtnActive : {}) }}
            onClick={() => { setActiveTab(tab.id); setModal(null); }}
          >
            {tab.icon(activeTab === tab.id, trip.tag)}
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

function ItineraryTab({ trip, onModal, refreshKey }) {
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    const { error } = await supabase.from('itinerary').delete().eq('id', item.id);
    if (!error) setItems(prev => prev.filter(i => i.id !== item.id));
  };

  useEffect(() => {
    const fetchItinerary = async () => {
      const { data, error } = await supabase
        .from('itinerary')
        .select('*')
        .eq('trip_id', trip.id)
        .order('day', { ascending: true })
      if (error) console.error(error)
      else setItems(data)
    }
    fetchItinerary()
  }, [trip.id, refreshKey])

  const days = [...new Set(items.map(i => i.day))];
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
          {items.filter(i => i.day === day).map(item => {
            const meta = ITINERARY_COLORS[item.type];
            return (
              <div key={item.id} style={{ ...S.iRow, background: meta.bg, borderColor: meta.border }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={S.iTime}>{item.time}</div>
                  <button
                    style={{ background: "#1e3a5f", border: "none", color: "#60a5fa", fontSize: 11, cursor: "pointer", padding: "3px 6px", borderRadius: 6, marginTop: 4 }}
                    onClick={() => setEditingItem(item)}
                  >✎</button>
                  <button
                    style={{ background: "#450a0a", border: "none", color: "#f87171", fontSize: 11, cursor: "pointer", padding: "3px 6px", borderRadius: 6, marginTop: 6 }}
                    onClick={() => handleDeleteItem(item)}
                  >✕</button>
                </div>
                <div style={S.iLine}>
                  <div style={{ ...S.iDot, background: meta.accent }} />
                  <div style={S.iConnector} />
                </div>
                <div style={S.iBody}>
                  <div style={S.iTitle}>
                    <span style={S.iEmoji}>{item.icon}</span>
                    {item.title}
                  </div>
                  <div style={{ ...S.iDetail, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{item.detail}</span>
                  {(item.type === "stay" || item.type === "restaurant") && (
                    
                    <a  
                    href={`https://maps.google.com/?q=${encodeURIComponent(item.title + " " + item.detail)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#60a5fa", fontSize: 10, fontWeight: 700, textDecoration: "none", flexShrink: 0, marginLeft: 8 }}
                    >
                      📍 Maps
                    </a>
                  )}
                </div>
                  <div style={{ ...S.iType, color: meta.accent }}>{item.type}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ height: 20 }} />
      {editingItem && (
        <EditItinModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

// ─── EXPENSES TAB ─────────────────────────────────────────────────────────────

function ExpensesTab({ trip, onModal, expRefresh }) {
  const [filter, setFilter] = useState("All");
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const cats = ["All", "Stay", "Food", "Activity", "Transport"];

  useEffect(() => {
    const fetchExpenses = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: false })
      if (error) console.error(error)
      else setExpenses(data)
    }
    fetchExpenses()
  }, [trip.id, expRefresh])

  const filtered = filter === "All" ? expenses : expenses.filter(e => e.category === filter);
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const myOwed = 0;
const handleDeleteExpense = async (exp) => {
    if (!window.confirm(`Delete "${exp.title}"?`)) return;
    const { error } = await supabase.from('expenses').delete().eq('id', exp.id);
    if (!error) setExpenses(prev => prev.filter(e => e.id !== exp.id));
  };
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
          <div style={S.expSumVal}>{(trip.members || []).length}</div>
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
        const splitWith = exp.split_with || exp.splitWith || [];
        const perPerson = splitWith.length ? (exp.amount / splitWith.length).toFixed(0) : 0;
        return (
          <div key={exp.id} style={{ ...S.expRow, position: "relative" }}
            onContextMenu={(e) => { e.preventDefault(); }}
          >
            <div style={{ ...S.expIcon, background: meta.bg, color: meta.color }}>
              {exp.category[0]}
            </div>
            <div style={S.expBody}>
              <div style={S.expTitle}>{exp.title}</div>
              <div style={S.expMeta}>
                {exp.date} · <span style={{ color: "#e2e8f0" }}>{exp.paid_by || exp.paidBy}</span> paid · ${perPerson}/person
              </div>
            </div>
            <div style={S.expRight}>
              <div style={S.expAmt}>${exp.amount}</div>
              {exp.receipt && <div style={S.receiptBadge}>📎</div>}
            </div>
            <button
              style={{ background: "#1e293b", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", marginLeft: 4, flexShrink: 0 }}
              onClick={() => setEditingExpense(exp)}
            >
              ✎
            </button>
            <button
              style={{ background: "#450a0a", border: "none", color: "#f87171", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", marginLeft: 4, flexShrink: 0 }}
              onClick={() => handleDeleteExpense(exp)}
            >
              ✕
            </button>
          </div>
        );
      })}
      <div style={{ height: 20 }} />
      {editingExpense && (
        <AddExpenseModal
          trip={trip}
          user={null}
          profile={null}
          existingExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onAdd={() => { setEditingExpense(null); }}
        />
      )}
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
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
const [newName, setNewName] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('trip_id', trip.id)
      if (error) console.error(error)
      else setMembers(data)
    }
    fetchMembers()
  }, [trip.id])

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Members</div>
        <button style={S.actionBtn} onClick={() => setShowInvite(true)}>+ Invite</button>
      </div>
      {showInvite && (
  <div style={{ background: "#13131e", borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid #1e293b" }}>
    <div style={S.fieldLbl}>INVITE BY EMAIL</div>
    <input
      style={S.input}
      placeholder="friend@email.com"
      value={newName}
      onChange={e => setNewName(e.target.value)}
      type="email"
    />
    <div style={{ fontSize: 11, color: "#475569", marginTop: 6, marginBottom: 10 }}>
      They'll see this trip when they sign in to tripcrew.
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <button style={S.secondaryBtn} onClick={() => setShowInvite(false)}>Cancel</button>
      <button style={{ ...S.primaryBtn, background: "#22c55e", color: "#000" }} onClick={async () => {
        if (!newName) return;
        const email = newName.trim().toLowerCase();
        // Check if user exists
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', (await supabase.from('profiles').select('id').eq('id', email)).data?.[0]?.id)
          .single();
        // Look up user by email via auth
        const { data: existingMembers } = await supabase
          .from('trip_members')
          .select('*, profiles(display_name)')
          .eq('trip_id', trip.id);
        // Insert into trip_members with email, matched later when they sign up
        const { data, error } = await supabase
          .from('trip_members')
          .insert([{ 
            trip_id: trip.id, 
            invited_email: email,
            role: 'member',
            status: 'pending'
          }])
          .select()
        if (error) { console.error(error); return; }
        // Also add to members table for display name
        const { data: memberData } = await supabase
          .from('members')
          .insert([{ trip_id: trip.id, name: email.split('@')[0] }])
          .select()
        if (memberData) setMembers(prev => [...prev, memberData[0]]);
        setNewName("");
        setShowInvite(false);
      }}>Invite</button>
    </div>
  </div>
)}

      {members.map((m, i) => {
        const paid = 0;
const owes = 0;
const owed = 0;
        return (
  <div key={m.id} style={S.memberRow}>
    <div style={{ ...S.memberAvatar, background: colors[i % colors.length] + "25", color: colors[i % colors.length] }}>
      {m.name[0]}
    </div>
    <div style={S.memberInfo}>
      <div style={S.memberName}>{m.name} {m.name === "Isaiah" ? <span style={S.youTag}>you</span> : ""}</div>
      <div style={S.memberMeta}>Member</div>
    </div>
    <div style={S.memberRight}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={S.evenBadge}>even</div>
        <button
          style={{ background: "#450a0a", border: "none", color: "#f87171", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          onClick={async () => {
            if (!window.confirm(`Remove ${m.name}?`)) return;
            const { error } = await supabase.from('members').delete().eq('id', m.id);
            if (!error) setMembers(prev => prev.filter(mb => mb.id !== m.id));
          }}
        >
          ✕
        </button>
      </div>
    </div>
  </div>
);
      })}

      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
// ─── MODALS ───────────────────────────────────────────────────────────────────

function AddExpenseModal({ onClose, trip, onAdd, user, profile, existingExpense }) {
  const [members, setMembers] = useState([]);
  const [step, setStep] = useState(1);
  const [exp, setExp] = useState({
    title: existingExpense?.title || "",
    amount: existingExpense?.amount || "",
    category: existingExpense?.category || "Food",
    paidBy: existingExpense?.paid_by || "",
    splitWith: existingExpense?.split_with || []
  });

  useEffect(() => {
    supabase
      .from('members')
      .select('name')
      .eq('trip_id', trip.id)
      .then(({ data }) => {
        const memberNames = data ? data.map(m => m.name) : [];
        const userDisplay = profile?.display_name || user?.email?.split('@')[0] || 'Me';
        const names = [userDisplay, ...memberNames.filter(n => n !== userDisplay)];
        setMembers(names);
        if (!existingExpense) {
          setExp(e => ({ ...e, paidBy: userDisplay, splitWith: names }));
        }
      });
  }, [trip.id]);

  const perPerson = exp.amount && exp.splitWith.length
    ? (parseFloat(exp.amount) / exp.splitWith.length).toFixed(2) : null;

  const toggleMember = (m) => {
    setExp(e => ({
      ...e,
      splitWith: e.splitWith.includes(m) ? e.splitWith.filter(x => x !== m) : [...e.splitWith, m]
    }));
  };

  const handleSubmit = async () => {
    if (existingExpense) {
      const { error } = await supabase
        .from('expenses')
        .update({
          title: exp.title,
          category: exp.category,
          amount: parseFloat(exp.amount),
          paid_by: exp.paidBy,
          split_with: exp.splitWith,
        })
        .eq('id', existingExpense.id);
      if (error) { console.error(error); return; }
    } else {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          trip_id: trip?.id,
          title: exp.title,
          category: exp.category,
          amount: parseFloat(exp.amount),
          paid_by: exp.paidBy,
          split_with: exp.splitWith,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          receipt: false
        }]);
      if (error) { console.error(error); return; }
    }
    if (onAdd) onAdd();
    onClose();
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
        <div style={S.stepRow}>
          {[1,2,3].map(s => (
            <div key={s} style={{ ...S.stepDot, ...(s <= step ? S.stepDotActive : {}) }} />
          ))}
        </div>

        {step === 1 && (
          <div style={S.sheetBody}>
            <div style={S.orDiv}>
              <span style={S.orText}>
                <span style={{ color: "#4ade80", cursor: "pointer", fontWeight: 700 }}>📷 Scan receipt</span>
                {" "}to auto-fill
              </span>
            </div>
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
                    style={{ ...S.catBtn, ...(exp.category === c ? { background: CATEGORY_META[c].bg, color: CATEGORY_META[c].color, borderColor: CATEGORY_META[c].color } : { borderColor: "#1e293b", background: "#13131e", color: "#64748b" }) }}>
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
            <button style={S.primaryBtn} onClick={() => members.length <= 1 ? setStep(3) : setStep(2)}>
              {members.length <= 1 ? "Review" : "Next → Split"}
            </button>
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
              <button style={{ ...S.primaryBtn, background: "#22c55e", color: "#000" }} onClick={handleSubmit}>
                {existingExpense ? "✓ Save Changes" : "✓ Add Expense"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddItinModal({ onClose, trip, onAdd }) {
  const [form, setForm] = useState({ type: "activity", title: "", detail: "", day: "", time: "", icon: "🎯", visibility: "group" });
  const types = ["flight", "stay", "activity", "restaurant", "transport"];
  const meta = ITINERARY_COLORS[form.type];

  const handleAdd = async () => {
    if (!form.title) return;
    const { data, error } = await supabase
      .from('itinerary')
      .insert([{
        trip_id: trip.id,
        day: form.day,
        time: form.time,
        type: form.type,
        title: form.title,
        detail: form.detail,
        icon: form.icon,
        visibility: form.visibility,
      }])
      .select()
    if (error) { console.error(error); return; }
    onAdd(data[0]);
    onClose();
  };

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
                const m = ITINERARY_COLORS[t];
                return (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ ...S.catBtn, textTransform: "capitalize", ...(form.type === t ? { background: m.bg, color: m.accent, borderColor: m.accent + "80" } : { borderColor: "#1e293b", background: "#13131e", color: "#64748b" }) }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>TITLE</div>
            <input style={S.input} placeholder="e.g. Fairmont Lake Louise"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DETAILS / CONFIRMATION #</div>
            <input style={S.input} placeholder="Confirmation code, address, notes..."
              value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>DATE</div>
              <input style={{ ...S.input, colorScheme: "dark", width: "100%", boxSizing: "border-box" }} type="date"
                value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} />
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>TIME</div>
              <input style={{ ...S.input, colorScheme: "dark", width: "100%", boxSizing: "border-box" }} type="time"
                value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <button
            style={{ ...S.primaryBtn, background: meta.accent, color: "#000", marginTop: 8 }}
            onClick={handleAdd}
          >
            Add to Itinerary
          </button>
        </div>
      </div>
    </div>
  );
}

function EditItinModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    type: item.type || "activity",
    title: item.title || "",
    detail: item.detail || "",
    day: item.day || "",
    time: item.time || "",
    icon: item.icon || "🎯",
  });
  const types = ["flight", "stay", "activity", "restaurant", "transport"];
  const meta = ITINERARY_COLORS[form.type];
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.title) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('itinerary')
      .update(form)
      .eq('id', item.id)
      .select()
      .single();
    if (error) { console.error(error); setLoading(false); return; }
    onSave(data);
  };

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Edit Item</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          <div style={S.field}>
            <div style={S.fieldLbl}>TYPE</div>
            <div style={S.catRow}>
              {types.map(t => {
                const m = ITINERARY_COLORS[t];
                return (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ ...S.catBtn, textTransform: "capitalize", ...(form.type === t ? { background: m.bg, color: m.accent, borderColor: m.accent + "80" } : { borderColor: "#1e293b", background: "#13131e", color: "#64748b" }) }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>TITLE</div>
            <input style={S.input} value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DETAILS / CONFIRMATION #</div>
            <input style={S.input} value={form.detail}
              onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>DATE</div>
              <input style={{ ...S.input, colorScheme: "dark", width: "100%", boxSizing: "border-box" }} type="date"
                value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} />
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>TIME</div>
              <input style={{ ...S.input, colorScheme: "dark", width: "100%", boxSizing: "border-box" }} type="time"
                value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <button
            style={{ ...S.primaryBtn, background: loading ? "#1e293b" : meta.accent, color: "#000", marginTop: 8 }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
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

function NewTripModal({ onClose, onSave, userId }) {
  const [form, setForm] = useState({
    name: "", location: "", dates: "", emoji: "✈️",
    bg: "linear-gradient(135deg, #0d2b1e 0%, #1a4a32 100%)",
    tag: "#4ade80"
  });
  const [loading, setLoading] = useState(false);

  const emojis = ["✈️","🏔️","🚴","🏖️","🗾","🎿","🚗","⛵","🏕️","🎭"];

  const handleSave = async () => {
    if (!form.name) return;
    setLoading(true);
    const { _startDate, _endDate, ...formData } = form;
    const { data, error } = await supabase
  .from('trips')
  .insert([{ ...formData, total_spent: 0, settled: false, solo: false, user_id: userId }])
  .select()
    if (error) { console.error(error); setLoading(false); return; }
    onSave(data[0]);
  };

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>New Trip</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          <div style={S.field}>
            <div style={S.fieldLbl}>TRIP NAME</div>
            <input style={S.input} placeholder="e.g. Tokyo 2025"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>LOCATION</div>
            <input style={S.input} placeholder="e.g. Japan"
              value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DATES</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input style={{ ...S.input, colorScheme: "dark", flex: 1 }} type="date"
                onChange={e => setForm(f => {
                  const start = e.target.value;
                  const end = f._endDate || "";
                  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return { ...f, _startDate: start, dates: start && end ? `${fmt(start)} – ${fmt(end)}` : f.dates };
                })} />
              <span style={{ color: "#475569", fontSize: 13 }}>→</span>
              <input style={{ ...S.input, colorScheme: "dark", flex: 1 }} type="date"
                onChange={e => setForm(f => {
                  const end = e.target.value;
                  const start = f._startDate || "";
                  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return { ...f, _endDate: end, dates: start && end ? `${fmt(start)} – ${fmt(end)}` : f.dates };
                })} />
            </div>
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>EMOJI</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {emojis.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{ fontSize: 24, background: form.emoji === e ? "#1e293b" : "transparent",
                    border: form.emoji === e ? "1px solid #4ade80" : "1px solid transparent",
                    borderRadius: 10, padding: 6, cursor: "pointer" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button
            style={{ ...S.primaryBtn, background: loading ? "#1e293b" : "#22c55e", color: "#000", marginTop: 8 }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Create Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOG IN SCREEN  ────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setLoading(true);
    setError("");
    const { data, error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    onAuth(data.user);
  };

  return (
    <div style={S.root}>
      <div style={S.phone}>
        <div style={{ padding: "60px 28px 0", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🧭</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-1.2px", marginBottom: 6 }}>tripcrew</div>
          <div style={{ fontSize: 13, color: "#475569", marginBottom: 40 }}>for trips, nights out, and everything in between</div>
        </div>
        <div style={{ padding: "0 28px" }}>
          <div style={S.field}>
            <div style={S.fieldLbl}>EMAIL</div>
            <input style={S.input} type="email" placeholder="you@email.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>PASSWORD</div>
            <input style={S.input} type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>{error}</div>}
          <button
            style={{ ...S.primaryBtn, background: loading ? "#1e293b" : "#22c55e", color: "#000", marginBottom: 12 }}
            onClick={handle}
            disabled={loading}
          >
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
            <span style={{ color: "#334155", fontSize: 12, padding: "0 12px" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
          </div>
          <button
            style={{ ...S.primaryBtn, background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin
                }
              });
              if (error) console.error(error);
            }}
          >
            <img src="https://www.google.com/favicon.ico" style={{ width: 16, height: 16 }} />
            Continue with Google
          </button>
          <div style={{ textAlign: "center", fontSize: 13, color: "#475569" }}>
            {mode === "login" ? "No account? " : "Have an account? "}
            <span style={{ color: "#4ade80", cursor: "pointer", fontWeight: 700 }}
              onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
function SettingsScreen({ user, profile, onBack, onProfileUpdate }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletedTrips, setDeletedTrips] = useState([]);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .then(({ data }) => setDeletedTrips(data || []));
  }, [user.id]);

  const handleSaveName = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id)
      .select()
      .single();
    if (!error) {
      onProfileUpdate(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleRestore = async (trip) => {
    setRestoring(trip.id);
    const { error } = await supabase
      .from('trips')
      .update({ deleted_at: null })
      .eq('id', trip.id);
    if (!error) {
      setDeletedTrips(prev => prev.filter(t => t.id !== trip.id));
    }
    setRestoring(null);
  };

  const handlePermanentDelete = async (trip) => {
    if (!window.confirm(`Permanently delete "${trip.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('trips').delete().eq('id', trip.id);
    if (!error) setDeletedTrips(prev => prev.filter(t => t.id !== trip.id));
  };

  return (
    <div style={S.screen}>
      <div style={{ padding: "48px 24px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button style={S.backBtn} onClick={onBack}>←</button>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.8px" }}>Settings</div>
      </div>

      <div style={{ padding: "0 24px 40px" }}>

        {/* Display Name */}
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>PROFILE</div>
          <div style={S.settingsCard}>
            <div style={S.fieldLbl}>DISPLAY NAME</div>
            <input
              style={S.input}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
            <button
              style={{ ...S.primaryBtn, background: saved ? "#14532d" : saving ? "#1e293b" : "#22c55e", color: saved ? "#4ade80" : "#000", marginTop: 12 }}
              onClick={handleSaveName}
              disabled={saving}
            >
              {saved ? "✓ Saved" : saving ? "Saving..." : "Save Name"}
            </button>
          </div>
        </div>

        {/* Recently Deleted */}
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>RECENTLY DELETED</div>
          {deletedTrips.length === 0 ? (
            <div style={{ fontSize: 13, color: "#334155", padding: "16px 0" }}>No recently deleted trips.</div>
          ) : (
            deletedTrips.map(trip => (
              <div key={trip.id} style={S.settingsCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{trip.emoji} {trip.name}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{trip.location} · deleted {new Date(trip.deleted_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ background: "#14532d", border: "none", color: "#4ade80", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      onClick={() => handleRestore(trip)}
                      disabled={restoring === trip.id}
                    >
                      {restoring === trip.id ? "..." : "Restore"}
                    </button>
                    <button
                      style={{ background: "#450a0a", border: "none", color: "#f87171", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      onClick={() => handlePermanentDelete(trip)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Placeholder sections */}
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>NOTIFICATIONS</div>
          <div style={{ ...S.settingsCard, opacity: 0.4 }}>
            <div style={{ fontSize: 13, color: "#475569" }}>Coming soon</div>
          </div>
        </div>

        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>CONNECTED ACCOUNTS</div>
          <div style={{ ...S.settingsCard, opacity: 0.4 }}>
            <div style={{ fontSize: 13, color: "#475569" }}>Coming soon</div>
          </div>
        </div>

      </div>
    </div>
  );
}

function EditTripModal({ trip, onClose, onSave }) {
  const [form, setForm] = useState({
    name: trip.name || "",
    location: trip.location || "",
    dates: trip.dates || "",
    emoji: trip.emoji || "✈️",
  });
  const [loading, setLoading] = useState(false);
  const emojis = ["✈️","🏔️","🚴","🏖️","🗾","🎿","🚗","⛵","🏕️","🎭"];

  const handleSave = async () => {
    if (!form.name) return;
    setLoading(true);
    const { _startDate, _endDate, ...formData } = form;
    const { data, error } = await supabase
      .from('trips')
      .update(formData)
      .eq('id', trip.id)
      .select()
      .single();
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
            <input style={S.input} placeholder="e.g. Tokyo 2025"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>LOCATION</div>
            <input style={S.input} placeholder="e.g. Japan"
              value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DATES</div>
            <input style={S.input} placeholder="e.g. Jun 1–10, 2025"
              value={form.dates} onChange={e => setForm(f => ({ ...f, dates: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>EMOJI</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {emojis.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{ fontSize: 24, background: form.emoji === e ? "#1e293b" : "transparent",
                    border: form.emoji === e ? "1px solid #4ade80" : "1px solid transparent",
                    borderRadius: 10, padding: 6, cursor: "pointer" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button
            style={{ ...S.primaryBtn, background: loading ? "#1e293b" : "#22c55e", color: "#000", marginTop: 8 }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
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
    height: 750,
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
    position: "relative",
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
  tripShell: { flex: 1, display: "flex", flexDirection: "column", height: "100%", position: "relative" },
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
  tabContent: { flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", minHeight: 0 },
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
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", zIndex: 100 },
  sheet: { background: "#12121c", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "72%", overflowY: "auto", paddingBottom: 20, boxShadow: "0 -20px 60px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,255,255,0.06)" },
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
  settingsSection: { marginBottom: 28 },
settingsSectionLabel: { fontSize: 10, fontWeight: 800, color: "#334155", letterSpacing: "2.5px", marginBottom: 12 },
settingsCard: { background: "#13131e", border: "1px solid #1e1e2e", borderRadius: 16, padding: "16px" },
};
