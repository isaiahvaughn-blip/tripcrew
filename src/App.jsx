import { supabase } from './supabase'
import { useState, useEffect, useRef } from "react";
import {
  Plane, Mountain, Bike, Umbrella, Map, Snowflake, Car, Anchor, Tent, Theater,
  UtensilsCrossed, Hotel, Zap, Train, Calendar, DollarSign, Image, Users,
  MapPin, ChevronRight, Mic, MicOff, Sparkles, Loader,
  Coffee, Wine, Music, ShoppingBag, Dumbbell, PartyPopper, House, Sunset, Sailboat, Camera
} from "lucide-react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const ITINERARY_COLORS = {
  flight:     { bg: "#0f2744", accent: "#60a5fa", border: "#1e3a5f" },
  stay:       { bg: "#1a2c0f", accent: "#86efac", border: "#2d4a1e" },
  activity:   { bg: "#2a1505", accent: "#fb923c", border: "#4a2a0f" },
  restaurant: { bg: "#250f1a", accent: "#f472b6", border: "#4a1e35" },
  transport:  { bg: "#1a1505", accent: "#fbbf24", border: "#3a2a0f" },
};

const CATEGORY_META = {
  Stay:      { color: "#86efac", bg: "#14532d" },
  Food:      { color: "#34d399", bg: "#065f46" },
  Activity:  { color: "#fb923c", bg: "#7c2d12" },
  Transport: { color: "#fbbf24", bg: "#713f12" },
};

const PHOTOS = [
  { id: 1, uploader: "Sofia",  caption: "First morning at the lake", date: "Aug 3", color: "#1a3a2a", emoji: "🏔️", wide: true,  sensitive: false },
  { id: 2, uploader: "Marcus", caption: "The SkyTram crew",          date: "Aug 8", color: "#1e1535", emoji: "🚡", wide: false, sensitive: false },
  { id: 3, uploader: "Isaiah", caption: "Icefields stop",            date: "Aug 5", color: "#1a2535", emoji: "🧊", wide: false, sensitive: false },
  { id: 4, uploader: "Priya",  caption: "Dinner vibes",              date: "Aug 7", color: "#251520", emoji: "🍷", wide: false, sensitive: true  },
  { id: 5, uploader: "Derek",  caption: "Sunrise on Whistlers",      date: "Aug 6", color: "#1e2a1a", emoji: "🌅", wide: true,  sensitive: false },
  { id: 6, uploader: "Marcus", caption: "Columbia Icefield walk",    date: "Aug 5", color: "#151a25", emoji: "❄️", wide: false, sensitive: false },
];

const TRIP_ICONS = {
  "✈️": Plane, "🏔️": Mountain, "🚴": Bike, "🏖️": Umbrella,
  "🗾": Map, "🎿": Snowflake, "🚗": Car, "⛵": Anchor,
  "🏕️": Tent, "🎭": Theater, "☕": Coffee, "🍷": Wine,
  "🎵": Music, "🛍️": ShoppingBag, "💪": Dumbbell, "🎉": PartyPopper,
  "🏠": House, "🌅": Sunset, "📸": Camera, "🍽️": UtensilsCrossed,
};
const TRIP_ICON_LIST = [
  { key: "✈️", Icon: Plane,          label: "Flight" },
  { key: "🏔️", Icon: Mountain,       label: "Adventure" },
  { key: "🚴", Icon: Bike,           label: "Cycling" },
  { key: "🏖️", Icon: Umbrella,       label: "Beach" },
  { key: "🗾", Icon: Map,            label: "Explore" },
  { key: "🎿", Icon: Snowflake,      label: "Snow" },
  { key: "🚗", Icon: Car,            label: "Road trip" },
  { key: "⛵", Icon: Anchor,         label: "Sailing" },
  { key: "🏕️", Icon: Tent,          label: "Camping" },
  { key: "🎭", Icon: Theater,        label: "Culture" },
  { key: "☕", Icon: Coffee,         label: "Coffee" },
  { key: "🍷", Icon: Wine,           label: "Drinks" },
  { key: "🎵", Icon: Music,          label: "Concert" },
  { key: "🛍️", Icon: ShoppingBag,   label: "Shopping" },
  { key: "💪", Icon: Dumbbell,       label: "Active" },
  { key: "🎉", Icon: PartyPopper,    label: "Celebrate" },
  { key: "🏠", Icon: House,          label: "Staycation" },
  { key: "🌅", Icon: Sunset,         label: "Getaway" },
  { key: "📸", Icon: Camera,         label: "Photo trip" },
  { key: "🍽️", Icon: UtensilsCrossed, label: "Dinner" },
];
const ITIN_TYPE_ICONS = {
  flight: Plane, stay: Hotel, activity: Zap,
  restaurant: UtensilsCrossed, transport: Train,
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

  useEffect(() => {
    if (!user) return;
    const linkPendingInvites = async () => {
      const { data: pending } = await supabase
        .from('trip_members').select('*')
        .eq('invited_email', user.email).eq('status', 'pending');
      if (!pending?.length) return;
      for (const invite of pending) {
        await supabase.from('trip_members')
          .update({ user_id: user.id, status: 'accepted' }).eq('id', invite.id);
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
          <ProfileScreen onOpen={openTrip} user={user} profile={profile}
            onSignOut={async () => { await supabase.auth.signOut(); }}
            onSettings={() => setView("settings")} />
        )}
        {view === "settings" && (
          <SettingsScreen user={user} profile={profile} onBack={() => setView("profile")}
            onProfileUpdate={(updated) => setProfile(updated)} />
        )}
        {view === "trip" && activeTrip && (
          <TripShell
            trip={activeTrip} activeTab={activeTab} setActiveTab={setActiveTab}
            onBack={() => setView("profile")} onModal={setModal}
            itinRefresh={itinRefresh} modal={modal} setModal={setModal}
            user={user} profile={profile}
            onItinRefresh={() => setItinRefresh(r => r + 1)}
          />
        )}
      </div>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

function ProfileScreen({ onOpen, user, onSignOut, onSettings, profile }) {
  const [trips, setTrips] = useState([]);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      const { data: memberRows } = await supabase
        .from('trip_members').select('trip_id').eq('user_id', user.id);
      if (!memberRows?.length) { setTrips([]); return; }
      const tripIds = memberRows.map(r => r.trip_id);
      const { data, error } = await supabase
        .from('trips').select('*').in('id', tripIds)
        .is('deleted_at', null).order('created_at', { ascending: false });
      if (error) console.error(error);
      else setTrips(data);
    };
    fetchTrips();
  }, []);

  const handleDeleteTrip = async (trip) => {
    if (!window.confirm(`Delete "${trip.name}"? You can restore it from settings.`)) return;
    const { error } = await supabase.from('trips')
      .update({ deleted_at: new Date().toISOString() }).eq('id', trip.id);
    if (error) { console.error(error); return; }
    setTrips(prev => prev.filter(t => t.id !== trip.id));
  };

  return (
    <div style={S.screen}>
      <div style={S.profileHero}>
        <div style={S.profileAvatar}>
          {(profile?.display_name || user.email).slice(0, 2).toUpperCase()}
        </div>
        <div style={S.profileName}>{profile?.display_name || user.email}</div>
        <div style={S.profileSub}>
          member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : "—"}
        </div>
        <div style={S.profileStats}>
          <div style={S.statItem}>
            <div style={S.statNum}>{trips.length}</div>
            <div style={S.statLbl}>trips</div>
          </div>
          <div style={S.statDiv} />
          <div style={S.statItem}>
            <div style={S.statNum}>{new Set(trips.map(t => t.city || t.location?.split(',')[0]).filter(Boolean)).size}</div>
            <div style={S.statLbl}>cities</div>
          </div>
          <div style={S.statDiv} />
          <div style={S.statItem}>
            <div style={S.statNum}>
              {trips.filter(t => new Date(t.created_at).getFullYear() === new Date().getFullYear()).length}
            </div>
            <div style={S.statLbl}>this year</div>
          </div>
        </div>
      </div>

      {editingTrip && (
        <EditTripModal trip={editingTrip} onClose={() => setEditingTrip(null)}
          onSave={(updated) => {
            setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
            setEditingTrip(null);
          }} />
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
        <button style={S.ghostBtn} onClick={onSettings}>⚙️ Settings</button>
        <button style={S.ghostBtn} onClick={onSignOut}>Sign out</button>
      </div>

      <div style={{ padding: "0 22px 40px" }}>
        <div style={S.sectionRow}>
          <div style={S.sectionLabel}>YOUR TRIPS</div>
          <button style={S.newBtn} onClick={() => setShowNewTrip(true)}>+ New</button>
        </div>
        {showNewTrip && (
          <NewTripModal onClose={() => setShowNewTrip(false)} userId={user.id}
            onSave={(trip) => { setTrips(prev => [trip, ...prev]); setShowNewTrip(false); }} />
        )}
        {trips.map((t, i) => (
          <TripCard key={t.id} trip={t} idx={i} onOpen={onOpen}
            onDelete={handleDeleteTrip} onEdit={setEditingTrip} />
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip, idx, onOpen, onDelete, onEdit }) {
  const tag = trip.tag || "#4ade80";
  const bg = trip.bg || "linear-gradient(135deg, #0d2b1e 0%, #1a4a32 100%)";
  const IconComp = TRIP_ICONS[trip.emoji] || Plane;

  return (
    <div style={{ ...S.tripCard, background: bg }} onClick={() => onOpen(trip)}>
      <button style={S.tcEditBtn} onClick={(e) => { e.stopPropagation(); onEdit(trip); }}>✎</button>
      <button style={S.tcDeleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(trip); }}>✕</button>
      <div style={S.tcTop}>
        <div style={{ ...S.tcIconWrap, background: tag + "20", border: `1px solid ${tag}30` }}>
          <IconComp size={26} color={tag} strokeWidth={1.5} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {trip.solo && <span style={S.soloBadge}>SOLO</span>}
          {trip.settled && <span style={S.settledBadge}>SETTLED</span>}
        </div>
      </div>
      <div style={S.tcName}>{trip.name}</div>
      <div style={S.tcLocation}>{trip.location} · {trip.dates}</div>
      <div style={S.tcBottom}>
        <div style={{ ...S.tcTotal, color: tag }}>${(trip.total_spent || 0).toLocaleString()}</div>
        <div style={{ ...S.tcViewBtn, color: tag, borderColor: tag + "40" }}>
          View <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}

// ─── TRIP SHELL ───────────────────────────────────────────────────────────────

function TripShell({ trip, activeTab, setActiveTab, onBack, onModal, itinRefresh, modal, setModal, user, profile, onItinRefresh }) {
  const [settlements, setSettlements] = useState([]);
  const myName = profile?.display_name || user?.email?.split('@')[0] || 'Me';
  const IconComp = TRIP_ICONS[trip.emoji] || Plane;

  const tabs = [
    { id: "itinerary", label: "Itinerary", Icon: Calendar },
    { id: "expenses",  label: "Expenses",  Icon: DollarSign },
    { id: "uploads",   label: "Uploads",   Icon: Image },
    { id: "members",   label: "Members",   Icon: Users },
  ];

  return (
    <div style={S.tripShell}>
      <div style={{ ...S.tripHeader, background: trip.bg }}>
        <button style={S.backBtn} onClick={onBack}>←</button>
        <div style={S.thMid}>
          <div style={{ ...S.thIconWrap, background: (trip.tag || "#4ade80") + "20" }}>
            <IconComp size={22} color={trip.tag || "#4ade80"} strokeWidth={1.5} />
          </div>
          <div>
            <div style={S.thName}>{trip.name}</div>
            <div style={S.thSub}>{trip.location} · {trip.dates}</div>
          </div>
        </div>
        <button style={{ ...S.shareHeaderBtn, color: trip.tag }} onClick={() => onModal("share")}>
          ↗ Share
        </button>
      </div>

      <div style={{ ...S.tabContent, position: "relative" }}>
        {activeTab === "itinerary" && <ItineraryTab trip={trip} onModal={onModal} refreshKey={itinRefresh} />}
        {activeTab === "expenses"  && <ExpensesTab  trip={trip} onModal={onModal} expRefresh={itinRefresh} profile={profile} user={user} onSettlementsChange={setSettlements} />}
        {activeTab === "uploads"   && <UploadsTab />}
        {activeTab === "members"   && <MembersTab trip={trip} profile={profile} />}
        {modal === "addExpense"    && <AddExpenseModal trip={trip} user={user} profile={profile} onClose={() => setModal(null)} onAdd={onItinRefresh} />}
        {modal === "addItinerary"  && <AddItinModal trip={trip} onClose={() => setModal(null)} onAdd={() => { setModal(null); onItinRefresh(); setTimeout(onItinRefresh, 100); }} />}
        {modal === "settle"        && <SettleModal settlements={settlements} myName={myName} onClose={() => setModal(null)} />}
        {modal === "share"         && <ShareModal trip={trip} onClose={() => setModal(null)} />}
      </div>

      <div style={S.tabBar}>
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} style={S.tabBtn} onClick={() => { setActiveTab(id); setModal(null); }}>
            <Icon size={24} color={activeTab === id ? (trip.tag || "#4ade80") : "#475569"} strokeWidth={activeTab === id ? 2 : 1.5} />
            <span style={{ ...S.tabLabel, ...(activeTab === id ? { color: trip.tag || "#4ade80" } : {}) }}>
              {label}
            </span>
            {activeTab === id && <div style={{ ...S.tabDot, background: trip.tag }} />}
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
      const { data, error } = await supabase.from('itinerary').select('*')
        .eq('trip_id', trip.id).order('day', { ascending: true });
      if (error) console.error(error);
      else setItems(data);
    };
    fetchItinerary();
    const subscription = supabase.channel(`itinerary:${trip.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary' }, () => fetchItinerary())
      .subscribe();
    return () => subscription.unsubscribe();
  }, [trip.id, refreshKey]);

  const days = [...new Set(items.map(i => i.day))];

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Itinerary</div>
        <button style={{ ...S.actionBtn, borderColor: trip.tag + "60", color: trip.tag }}
          onClick={() => onModal("addItinerary")}>+ Add</button>
      </div>
      {days.map(day => (
        <div key={day} style={S.dayBlock}>
          <div style={S.dayLabel}>{day}</div>
          {items.filter(i => i.day === day).map(item => {
            const meta = ITINERARY_COLORS[item.type];
            const TypeIcon = ITIN_TYPE_ICONS[item.type] || Zap;
            return (
              <div key={item.id} style={{ ...S.iRow, background: meta.bg, borderColor: meta.border }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={S.iTime}>{item.time}</div>
                  <button style={{ ...S.iActionBtn, background: "#1e3a5f", color: "#60a5fa" }}
                    onClick={() => setEditingItem(item)}>✎</button>
                  <button style={{ ...S.iActionBtn, background: "#450a0a", color: "#f87171" }}
                    onClick={() => handleDeleteItem(item)}>✕</button>
                </div>
                <div style={S.iLine}>
                  <div style={{ ...S.iDot, background: meta.accent }} />
                  <div style={S.iConnector} />
                </div>
                <div style={S.iBody}>
                  <div style={S.iTitle}>
                    <TypeIcon size={14} color={meta.accent} strokeWidth={2} />
                    {item.title}
                  </div>
                  <div style={{ ...S.iDetail, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{item.detail}</span>
                    {(item.type === "stay" || item.type === "restaurant") && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(item.title + " " + item.detail)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0, marginLeft: 8, display: "flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={11} /> Maps
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
        <EditItinModal item={editingItem} onClose={() => setEditingItem(null)}
          onSave={(updated) => { setItems(prev => prev.map(i => i.id === updated.id ? updated : i)); setEditingItem(null); }} />
      )}
    </div>
  );
}

// ─── EXPENSES TAB ─────────────────────────────────────────────────────────────

function ExpensesTab({ trip, onModal, expRefresh, profile, user, onSettlementsChange }) {
  const [filter, setFilter] = useState("All");
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const cats = ["All", "Stay", "Food", "Activity", "Transport"];

  useEffect(() => {
    supabase.from('members').select('id').eq('trip_id', trip.id)
      .then(({ data }) => setMemberCount(data?.length || 0));
  }, [trip.id]);

  useEffect(() => {
    const fetchExpenses = async () => {
      const { data, error } = await supabase.from('expenses').select('*')
        .eq('trip_id', trip.id).order('created_at', { ascending: false });
      if (error) console.error(error);
      else setExpenses(data);
    };
    fetchExpenses();
    const subscription = supabase.channel(`expenses:${trip.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchExpenses())
      .subscribe();
    return () => subscription.unsubscribe();
  }, [trip.id, expRefresh]);

  const filtered = filter === "All" ? expenses : expenses.filter(e => e.category === filter);
  const total = expenses.reduce((a, e) => a + e.amount, 0);

  const calcSettlements = (expenses) => {
    const balances = {};
    expenses.forEach(exp => {
      const paidBy = exp.paid_by;
      const splitWith = exp.split_with || [];
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
    const debtors = Object.entries(balances).filter(([_, v]) => v < -0.01).map(([k, v]) => ({ name: k, amount: v }));
    const creditors = Object.entries(balances).filter(([_, v]) => v > 0.01).map(([k, v]) => ({ name: k, amount: v }));
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
  };

  const settlements = calcSettlements(expenses);
  useEffect(() => { onSettlementsChange?.(settlements); }, [expenses]);

  const myName = profile?.display_name || user?.email?.split('@')[0] || 'Me';
  const myOwed = settlements.filter(s => s.from === myName).reduce((a, s) => a + s.amount, 0);

  const handleDeleteExpense = async (exp) => {
    if (!window.confirm(`Delete "${exp.title}"?`)) return;
    const { error } = await supabase.from('expenses').delete().eq('id', exp.id);
    if (!error) setExpenses(prev => prev.filter(e => e.id !== exp.id));
  };

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Expenses</div>
        <button style={{ ...S.actionBtn, borderColor: trip.tag + "60", color: trip.tag }}
          onClick={() => onModal("addExpense")}>+ Add</button>
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
          <div style={{ ...S.expSumVal, color: "#f87171" }}>${myOwed}</div>
          <div style={S.expSumLbl}>you owe</div>
        </div>
      </div>
      {settlements.length > 0 && (
        <button style={S.settleCta} onClick={() => onModal("settle")}>
          <span>⚖️ Settle Up — {settlements.filter(s => s.from === myName).length} transfers pending</span>
          <span style={S.settleArrow}>→</span>
        </button>
      )}
      <div style={S.filterRow}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{ ...S.chip, ...(filter === c ? { ...S.chipActive, borderColor: trip.tag, color: trip.tag, background: trip.tag + "15" } : {}) }}>
            {c}
          </button>
        ))}
      </div>
      {filtered.map(exp => {
        const meta = CATEGORY_META[exp.category];
        const splitWith = exp.split_with || exp.splitWith || [];
        const perPerson = splitWith.length ? (exp.amount / splitWith.length).toFixed(0) : 0;
        return (
          <div key={exp.id} style={S.expRow}>
            <div style={{ ...S.expIcon, background: meta.bg, color: meta.color }}>{exp.category[0]}</div>
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
            <button style={S.rowEditBtn} onClick={() => setEditingExpense(exp)}>✎</button>
            <button style={S.rowDeleteBtn} onClick={() => handleDeleteExpense(exp)}>✕</button>
          </div>
        );
      })}
      <div style={{ height: 20 }} />
      {editingExpense && (
        <AddExpenseModal trip={trip} user={null} profile={null}
          existingExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onAdd={() => setEditingExpense(null)} />
      )}
    </div>
  );
}

// ─── UPLOADS TAB ──────────────────────────────────────────────────────────────

function UploadsTab() {
  const [photos, setPhotos] = useState(PHOTOS);
  const toggleSensitive = (id) => setPhotos(p => p.map(ph => ph.id === id ? { ...ph, sensitive: !ph.sensitive } : ph));
  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Memories</div>
        <button style={S.actionBtn}>+ Upload</button>
      </div>
      <div style={S.sensitiveNote}>🔒 Mark photos as sensitive to exclude them from Wrapped and shared exports.</div>
      <div style={S.photoGrid}>
        {photos.map(ph => (
          <div key={ph.id} style={{ ...S.photoCard, ...(ph.wide ? S.photoWide : {}), background: ph.color, opacity: ph.sensitive ? 0.5 : 1 }}>
            <div style={S.photoEmoji}>{ph.emoji}</div>
            {ph.sensitive && <div style={S.sensitiveLock}>🔒</div>}
            <div style={S.photoOverlay}>
              <div style={S.photoCaption}>{ph.caption}</div>
              <div style={S.photoMeta}>{ph.uploader} · {ph.date}</div>
              <button style={{ ...S.sensitiveBtn, ...(ph.sensitive ? S.sensitiveBtnOn : {}) }}
                onClick={() => toggleSensitive(ph.id)}>
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

function MembersTab({ trip, profile }) {
  const colors = ["#4ade80", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa"];
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [newName, setNewName] = useState("");
  const myName = profile?.display_name || "";

  useEffect(() => {
    supabase.from('members').select('*').eq('trip_id', trip.id)
      .then(({ data, error }) => { if (error) console.error(error); else setMembers(data); });
  }, [trip.id]);

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Members</div>
        <button style={S.actionBtn} onClick={() => setShowInvite(true)}>+ Invite</button>
      </div>
      {showInvite && (
        <div style={{ background: "#13131e", borderRadius: 16, padding: 18, marginBottom: 16, border: "1px solid #1e293b" }}>
          <div style={S.fieldLbl}>INVITE BY EMAIL</div>
          <input style={S.input} placeholder="friend@email.com" value={newName}
            onChange={e => setNewName(e.target.value)} type="email" />
          <div style={{ fontSize: 12, color: "#475569", marginTop: 8, marginBottom: 12 }}>
            They'll see this trip when they sign in.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.secondaryBtn} onClick={() => setShowInvite(false)}>Cancel</button>
            <button style={{ ...S.primaryBtn, background: "#22c55e", color: "#000" }} onClick={async () => {
              if (!newName) return;
              const email = newName.trim().toLowerCase();
              const { data: existingUser } = await supabase.rpc('get_user_id_by_email', { email_input: email });
              const linkedUserId = existingUser?.[0]?.id || null;
              const { error: tmError } = await supabase.from('trip_members')
                .insert([{ trip_id: trip.id, user_id: linkedUserId, invited_email: email, role: 'member', status: linkedUserId ? 'accepted' : 'pending' }]).select();
              if (tmError && tmError.code !== '23505') { console.error(tmError); return; }
              let displayName = email.split('@')[0];
              if (linkedUserId) {
                const { data: profileData } = await supabase.from('profiles').select('display_name').eq('id', linkedUserId).single();
                if (profileData?.display_name) displayName = profileData.display_name;
              }
              const { data: memberData, error: memberError } = await supabase.from('members')
                .insert([{ trip_id: trip.id, name: displayName }]).select();
              if (memberError) console.error(memberError);
              else if (memberData) setMembers(prev => [...prev, memberData[0]]);
              setNewName(""); setShowInvite(false);
            }}>Invite</button>
          </div>
        </div>
      )}
      {members.map((m, i) => (
        <div key={m.id} style={S.memberRow}>
          <div style={{ ...S.memberAvatar, background: colors[i % colors.length] + "25", color: colors[i % colors.length] }}>
            {m.name[0]}
          </div>
          <div style={S.memberInfo}>
            <div style={S.memberName}>
              {m.name}
              {myName && m.name === myName ? <span style={S.youTag}>you</span> : ""}
            </div>
            <div style={S.memberMeta}>Member</div>
          </div>
          <div style={S.memberRight}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={S.evenBadge}>even</div>
              {m.name !== myName && (
                <button style={S.rowDeleteBtn} onClick={async () => {
                  if (!window.confirm(`Remove ${m.name}?`)) return;
                  const { error } = await supabase.from('members').delete().eq('id', m.id);
                  if (!error) setMembers(prev => prev.filter(mb => mb.id !== m.id));
                }}>✕</button>
              )}
            </div>
          </div>
        </div>
      ))}
      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── NEW TRIP MODAL ───────────────────────────────────────────────────────────
// Bug fixes: location merge, date range picker, voice permissions, keyboard aware

function NewTripModal({ onClose, onSave, userId }) {
  const [stage, setStage] = useState("prompt");
  const [prompt, setPrompt] = useState("");
  const [listening, setListening] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const recognitionRef = useRef(null);

  const EXAMPLES = [
    "10 days in Tokyo with Marcus and Priya, late October",
    "Dinner Saturday at Ox, just me and Jasmin",
    "Banff long weekend, 5 people, early August",
    "Coffee Tuesday morning with Derek",
  ];
  const [exampleIdx] = useState(() => Math.floor(Math.random() * EXAMPLES.length));

  // FIX: request mic permission explicitly before starting recognition
  const toggleVoice = async () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    // Request mic permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert("Microphone access denied. Please allow mic access in your browser settings.");
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
      setListening(false);
    };
    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const [form, setForm] = useState({
    name: "", location: "", city: "", country: "",
    startDate: "", endDate: "",
    emoji: "✈️", bg: "linear-gradient(135deg, #0d2b1e 0%, #1a4a32 100%)", tag: "#4ade80"
  });
  const [loading, setLoading] = useState(false);

  // Compute human-readable dates string from start/end
  const formatDates = (start, end) => {
  if (!start) return "";
  const s = new Date(start + 'T12:00:00');
  if (!end || start === end) {
    return s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
    const s = new Date(start + 'T12:00:00');
    const e = new Date(end + 'T12:00:00');
    const sameYear = s.getFullYear() === e.getFullYear();
    const sameMonth = sameYear && s.getMonth() === e.getMonth();
    if (sameMonth) {
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}, ${e.getFullYear()}`;
    }
    if (sameYear) {
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${e.getFullYear()}`;
    }
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const parseWithClaude = async () => {
    if (!prompt.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      const res = await fetch("/api/parse-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // FIX: merge city + country into location
      const combined = [parsed.city, parsed.country].filter(Boolean).join(', ');
      const location = combined || parsed.location || "";

      setForm(f => ({ ...f, ...parsed, location }));
      setStage("confirm");
    } catch (e) {
      console.error(e);
      setParseError("Couldn't parse that — try rephrasing or fill in manually.");
      setStage("confirm");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) return;
    setLoading(true);
    const { type, startDate, endDate, ...formData } = form;
    const dates = formatDates(startDate, endDate);
    const { data, error } = await supabase.from('trips')
      .insert([{ ...formData, dates, total_spent: 0, settled: false, solo: false, user_id: userId }]).select();
    if (error) { console.error(error); setLoading(false); return; }
    onSave(data[0]);
  };

  const IconComp = TRIP_ICONS[form.emoji] || Plane;

  return (
    // FIX: overlay uses fixed positioning to stay above keyboard
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>
            {stage === "prompt" ? "What's the plan?" : "Looks right?"}
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {stage === "prompt" && (
          <div style={S.sheetBody}>
            <div style={S.promptWrap}>
              <textarea
                style={S.promptInput}
                placeholder={EXAMPLES[exampleIdx]}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
              />
              <button style={{ ...S.micBtn, ...(listening ? S.micBtnActive : {}) }} onClick={toggleVoice}>
                {listening ? <MicOff size={20} color="#f87171" /> : <Mic size={20} color="#475569" />}
              </button>
            </div>
            {listening && (
              <div style={S.listeningBadge}>
                <div style={S.listeningDot} />
                Listening...
              </div>
            )}
            <div style={S.examplesLabel}>TRY SAYING</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i} style={S.exampleChip} onClick={() => setPrompt(ex)}>{ex}</button>
              ))}
            </div>
            <button
              style={{ ...S.primaryBtn, background: parsing ? "#1e293b" : "#22c55e", color: parsing ? "#64748b" : "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={parseWithClaude}
              disabled={parsing || !prompt.trim()}
            >
              {parsing
                ? <><Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Thinking...</>
                : <><Sparkles size={18} /> Build it</>}
            </button>
            <button style={{ ...S.secondaryBtn, marginTop: 10, width: "100%" }}
              onClick={() => setStage("confirm")}>
              Fill in manually →
            </button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {stage === "confirm" && (
          <div style={S.sheetBody}>
            {parseError && (
              <div style={{ background: "#2a0f0f", border: "1px solid #7f1d1d", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#f87171", marginBottom: 16 }}>
                {parseError}
              </div>
            )}
            <div style={{ ...S.previewCard, background: form.bg }}>
              <div style={{ ...S.tcIconWrap, background: (form.tag || "#4ade80") + "20", border: `1px solid ${form.tag || "#4ade80"}30`, marginBottom: 12 }}>
                <IconComp size={26} color={form.tag || "#4ade80"} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.8px" }}>{form.name || "Untitled"}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                {form.location}{formatDates(form.startDate, form.endDate) ? ` · ${formatDates(form.startDate, form.endDate)}` : ""}
              </div>
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>NAME</div>
              <input style={S.input} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Plan name" />
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>LOCATION</div>
              <input style={S.input} value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Where" />
            </div>
            {/* FIX: date range picker instead of single text field */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ ...S.field, flex: 1 }}>
                <div style={S.fieldLbl}>START DATE</div>
                <input style={{ ...S.input, colorScheme: "dark" }} type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div style={{ ...S.field, flex: 1 }}>
  <div style={{ ...S.fieldLbl, display: "flex", justifyContent: "space-between" }}>
    <span>END DATE</span>
    <span style={{ color: "#334155", fontWeight: 600 }}>optional</span>
  </div>
  <input style={{ ...S.input, colorScheme: "dark" }} type="date"
    value={form.endDate}
    min={form.startDate}
    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
</div>
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>ICON</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
  {TRIP_ICON_LIST.map(({ key, Icon, label }) => (
    <button key={key} onClick={() => setForm(f => ({ ...f, emoji: key }))}
      style={{
        background: form.emoji === key ? "#1e293b" : "transparent",
        border: form.emoji === key ? "1px solid #4ade80" : "1px solid #1e293b",
        borderRadius: 12, padding: "8px 12px", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        minWidth: 56
      }}>
      <Icon size={20} color={form.emoji === key ? "#4ade80" : "#475569"} strokeWidth={1.5} />
      <span style={{ fontSize: 9, color: form.emoji === key ? "#4ade80" : "#475569", fontWeight: 700, letterSpacing: "0.5px" }}>
        {label}
      </span>
    </button>
  ))}
</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.secondaryBtn} onClick={() => setStage("prompt")}>← Redo</button>
              <button style={{ ...S.primaryBtn, background: loading ? "#1e293b" : "#22c55e", color: "#000" }}
                onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Create ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
    supabase.from('members').select('name').eq('trip_id', trip.id).then(({ data }) => {
      const memberNames = data ? data.map(m => m.name) : [];
      const userDisplay = profile?.display_name || user?.email?.split('@')[0] || 'Me';
      const names = [userDisplay, ...memberNames.filter(n => n !== userDisplay)];
      setMembers(names);
      if (!existingExpense) setExp(e => ({ ...e, paidBy: userDisplay, splitWith: names }));
    });
  }, [trip.id]);

  const perPerson = exp.amount && exp.splitWith.length
    ? (parseFloat(exp.amount) / exp.splitWith.length).toFixed(2) : null;

  const toggleMember = (m) => setExp(e => ({
    ...e, splitWith: e.splitWith.includes(m) ? e.splitWith.filter(x => x !== m) : [...e.splitWith, m]
  }));

  const handleSubmit = async () => {
    if (existingExpense) {
      const { error } = await supabase.from('expenses').update({
        title: exp.title, category: exp.category, amount: parseFloat(exp.amount),
        paid_by: exp.paidBy, split_with: exp.splitWith,
      }).eq('id', existingExpense.id);
      if (error) { console.error(error); return; }
    } else {
      const { error } = await supabase.from('expenses').insert([{
        trip_id: trip?.id, title: exp.title, category: exp.category,
        amount: parseFloat(exp.amount), paid_by: exp.paidBy, split_with: exp.splitWith,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), receipt: false
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
          {[1,2,3].map(s => <div key={s} style={{ ...S.stepDot, ...(s <= step ? S.stepDotActive : {}) }} />)}
        </div>
        {step === 1 && (
          <div style={S.sheetBody}>
            <div style={S.field}>
              <div style={S.fieldLbl}>DESCRIPTION</div>
              <input style={S.input} placeholder="e.g. Dinner at Coco's"
                value={exp.title} onChange={e => setExp(n => ({ ...n, title: e.target.value }))} />
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>AMOUNT</div>
              <div style={S.amountWrap}>
                <span style={S.dollarSign}>$</span>
                <input style={{ ...S.input, paddingLeft: 32, fontSize: 26, fontWeight: 800, letterSpacing: "-1px" }}
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
                    style={{ ...S.paidBtn, ...(exp.paidBy === m ? S.paidBtnActive : {}) }}>{m}</button>
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
                  <div style={{ ...S.splitAvatar, ...(exp.splitWith.includes(m) ? { background: "#14532d", color: "#4ade80" } : {}) }}>{m[0]}</div>
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
    const { data, error } = await supabase.from('itinerary')
      .insert([{ trip_id: trip.id, day: form.day, time: form.time, type: form.type, title: form.title, detail: form.detail, icon: form.icon, visibility: form.visibility }]).select();
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
                const TIcon = ITIN_TYPE_ICONS[t];
                return (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ ...S.catBtn, display: "flex", alignItems: "center", gap: 5, textTransform: "capitalize", ...(form.type === t ? { background: m.bg, color: m.accent, borderColor: m.accent + "80" } : { borderColor: "#1e293b", background: "#13131e", color: "#64748b" }) }}>
                    <TIcon size={13} strokeWidth={2} />{t}
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
          <button style={{ ...S.primaryBtn, background: meta.accent, color: "#000", marginTop: 8 }} onClick={handleAdd}>
            Add to Itinerary
          </button>
        </div>
      </div>
    </div>
  );
}

function EditItinModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    type: item.type || "activity", title: item.title || "",
    detail: item.detail || "", day: item.day || "",
    time: item.time || "", icon: item.icon || "🎯",
  });
  const types = ["flight", "stay", "activity", "restaurant", "transport"];
  const meta = ITINERARY_COLORS[form.type];
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.title) return;
    setLoading(true);
    const { data, error } = await supabase.from('itinerary').update(form).eq('id', item.id).select().single();
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
                const TIcon = ITIN_TYPE_ICONS[t];
                return (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ ...S.catBtn, display: "flex", alignItems: "center", gap: 5, textTransform: "capitalize", ...(form.type === t ? { background: m.bg, color: m.accent, borderColor: m.accent + "80" } : { borderColor: "#1e293b", background: "#13131e", color: "#64748b" }) }}>
                    <TIcon size={13} strokeWidth={2} />{t}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>TITLE</div>
            <input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DETAILS / CONFIRMATION #</div>
            <input style={S.input} value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} />
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
          <button style={{ ...S.primaryBtn, background: loading ? "#1e293b" : meta.accent, color: "#000", marginTop: 8 }}
            onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettleModal({ settlements, myName, onClose }) {
  const [marked, setMarked] = useState([]);
  const toggle = (i) => setMarked(m => m.includes(i) ? m.filter(x => x !== i) : [...m, i]);
  const mine = settlements.filter(s => s.from === myName);
  const others = settlements.filter(s => s.from !== myName);
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

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setLoading(true); setError("");
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
          <div style={{ fontSize: 44, marginBottom: 18 }}>🧭</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-1.5px", marginBottom: 8 }}>tripcrew</div>
          <div style={{ fontSize: 14, color: "#475569", marginBottom: 44 }}>for trips, nights out, and everything in between</div>
        </div>
        <div style={{ padding: "0 28px" }}>
          <div style={S.field}>
            <div style={S.fieldLbl}>EMAIL</div>
            <input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>PASSWORD</div>
            <input style={S.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button style={{ ...S.primaryBtn, background: loading ? "#1e293b" : "#22c55e", color: "#000", marginBottom: 14 }}
            onClick={handle} disabled={loading}>
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <div style={{ display: "flex", alignItems: "center", margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
            <span style={{ color: "#334155", fontSize: 13, padding: "0 14px" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
          </div>
          <button style={{ ...S.primaryBtn, background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 18 }}
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
              if (error) console.error(error);
            }}>
            <img src="https://www.google.com/favicon.ico" style={{ width: 18, height: 18 }} alt="Google" />
            Continue with Google
          </button>
          <div style={{ textAlign: "center", fontSize: 14, color: "#475569" }}>
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

// ─── SETTINGS SCREEN ──────────────────────────────────────────────────────────

function SettingsScreen({ user, profile, onBack, onProfileUpdate }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletedTrips, setDeletedTrips] = useState([]);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    supabase.from('trips').select('*').eq('user_id', user.id)
      .not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
      .then(({ data }) => setDeletedTrips(data || []));
  }, [user.id]);

  const handleSaveName = async () => {
    setSaving(true);
    const { data, error } = await supabase.from('profiles').update({ display_name: displayName })
      .eq('id', user.id).select().single();
    if (!error) { onProfileUpdate(data); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  const handleRestore = async (trip) => {
    setRestoring(trip.id);
    const { error } = await supabase.from('trips').update({ deleted_at: null }).eq('id', trip.id);
    if (!error) setDeletedTrips(prev => prev.filter(t => t.id !== trip.id));
    setRestoring(null);
  };

  const handlePermanentDelete = async (trip) => {
    if (!window.confirm(`Permanently delete "${trip.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('trips').delete().eq('id', trip.id);
    if (!error) setDeletedTrips(prev => prev.filter(t => t.id !== trip.id));
  };

  return (
    <div style={S.screen}>
      <div style={{ padding: "52px 24px 0", display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <button style={S.backBtn} onClick={onBack}>←</button>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.8px" }}>Settings</div>
      </div>
      <div style={{ padding: "0 24px 40px" }}>
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>PROFILE</div>
          <div style={S.settingsCard}>
            <div style={S.fieldLbl}>DISPLAY NAME</div>
            <input style={S.input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
            <button style={{ ...S.primaryBtn, background: saved ? "#14532d" : saving ? "#1e293b" : "#22c55e", color: saved ? "#4ade80" : "#000", marginTop: 14 }}
              onClick={handleSaveName} disabled={saving}>
              {saved ? "✓ Saved" : saving ? "Saving..." : "Save Name"}
            </button>
          </div>
        </div>
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>RECENTLY DELETED</div>
          {deletedTrips.length === 0
            ? <div style={{ fontSize: 14, color: "#334155", padding: "16px 0" }}>No recently deleted trips.</div>
            : deletedTrips.map(trip => (
              <div key={trip.id} style={S.settingsCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{trip.name}</div>
                    <div style={{ fontSize: 13, color: "#475569", marginTop: 3 }}>{trip.location} · deleted {new Date(trip.deleted_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: "#14532d", border: "none", color: "#4ade80", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                      onClick={() => handleRestore(trip)} disabled={restoring === trip.id}>
                      {restoring === trip.id ? "..." : "Restore"}
                    </button>
                    <button style={{ background: "#450a0a", border: "none", color: "#f87171", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                      onClick={() => handlePermanentDelete(trip)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>NOTIFICATIONS</div>
          <div style={{ ...S.settingsCard, opacity: 0.4 }}><div style={{ fontSize: 14, color: "#475569" }}>Coming soon</div></div>
        </div>
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>CONNECTED ACCOUNTS</div>
          <div style={{ ...S.settingsCard, opacity: 0.4 }}><div style={{ fontSize: 14, color: "#475569" }}>Coming soon</div></div>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT TRIP MODAL ──────────────────────────────────────────────────────────

function EditTripModal({ trip, onClose, onSave }) {
  const [form, setForm] = useState({
    name: trip.name || "", location: trip.location || "", dates: trip.dates || "",
    emoji: trip.emoji || "✈️", city: trip.city || "", country: trip.country || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name) return;
    setLoading(true);
    const { data, error } = await supabase.from('trips').update(form).eq('id', trip.id).select().single();
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
            <input style={S.input} placeholder="e.g. Tokyo 2025" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>CITY</div>
              <input style={S.input} placeholder="e.g. Tokyo" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>COUNTRY</div>
              <input style={S.input} placeholder="e.g. Japan" value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DATES</div>
            <input style={S.input} placeholder="e.g. Jun 1–10, 2025" value={form.dates}
              onChange={e => setForm(f => ({ ...f, dates: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>ICON</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
  {TRIP_ICON_LIST.map(({ key, Icon, label }) => (
    <button key={key} onClick={() => setForm(f => ({ ...f, emoji: key }))}
      style={{
        background: form.emoji === key ? "#1e293b" : "transparent",
        border: form.emoji === key ? "1px solid #4ade80" : "1px solid #1e293b",
        borderRadius: 12, padding: "8px 12px", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        minWidth: 56
      }}>
      <Icon size={20} color={form.emoji === key ? "#4ade80" : "#475569"} strokeWidth={1.5} />
      <span style={{ fontSize: 9, color: form.emoji === key ? "#4ade80" : "#475569", fontWeight: 700, letterSpacing: "0.5px" }}>
        {label}
      </span>
    </button>
  ))}
</div>
          </div>
          <button style={{ ...S.primaryBtn, background: loading ? "#1e293b" : "#22c55e", color: "#000", marginTop: 8 }}
            onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const S = {
  root: { minHeight: "100vh", background: "#060609", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px", fontFamily: "'Syne', 'DM Sans', 'Helvetica Neue', sans-serif" },
  phone: { width: 430, maxWidth: "100%", background: "#0c0c14", borderRadius: 36, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)", minHeight: 750, height: 750, position: "relative", display: "flex", flexDirection: "column" },
  screen: { flex: 1, overflowY: "auto" },

  // Profile
  profileHero: { padding: "52px 28px 32px", textAlign: "center", background: "linear-gradient(180deg, #111122 0%, #0c0c14 100%)", borderBottom: "1px solid #1a1a2a" },
  profileAvatar: { width: 84, height: 84, borderRadius: "50%", background: "linear-gradient(135deg, #4ade80, #22d3ee)", color: "#000", fontSize: 26, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", letterSpacing: "-1px" },
  profileName: { fontSize: 30, fontWeight: 900, color: "#f8fafc", letterSpacing: "-1.2px", marginBottom: 6 },
  profileSub: { fontSize: 13, color: "#475569", letterSpacing: "1px", marginBottom: 24 },
  profileStats: { display: "flex", justifyContent: "center", alignItems: "center", background: "#13131e", borderRadius: 18, padding: "18px 0", border: "1px solid #1a1a2a" },
  statItem: { flex: 1, textAlign: "center" },
  statNum: { fontSize: 26, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-1px" },
  statLbl: { fontSize: 11, color: "#475569", letterSpacing: "1px", marginTop: 3 },
  statDiv: { width: 1, height: 34, background: "#1e1e2e" },

  // Section
  sectionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 32 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: "2.5px" },
  newBtn: { background: "#22c55e", color: "#000", border: "none", borderRadius: 22, padding: "9px 18px", fontSize: 14, fontWeight: 800, cursor: "pointer" },
  ghostBtn: { background: "transparent", border: "1px solid #1e293b", color: "#475569", borderRadius: 22, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" },

  // Trip card
  tripCard: { borderRadius: 24, padding: "22px", marginBottom: 14, cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)", position: "relative" },
  tcIconWrap: { width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" },
  tcTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  tcEditBtn: { position: "absolute", top: 14, right: 54, background: "#ffffff15", border: "none", color: "#94a3b8", borderRadius: 10, padding: "7px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", zIndex: 10 },
  tcDeleteBtn: { position: "absolute", top: 14, right: 14, background: "#ffffff15", border: "none", color: "#94a3b8", borderRadius: 10, padding: "7px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", zIndex: 10 },
  soloBadge: { background: "#1e293b", color: "#64748b", fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", padding: "4px 10px", borderRadius: 8 },
  settledBadge: { background: "#14532d", color: "#4ade80", fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", padding: "4px 10px", borderRadius: 8 },
  tcName: { fontSize: 26, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.8px", marginBottom: 6 },
  tcLocation: { fontSize: 14, color: "#94a3b8", marginBottom: 18 },
  tcBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tcTotal: { fontSize: 22, fontWeight: 900, letterSpacing: "-1px" },
  tcViewBtn: { display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, border: "1px solid", borderRadius: 22, padding: "7px 14px" },

  // Trip shell
  tripShell: { flex: 1, display: "flex", flexDirection: "column", height: "100%", position: "relative" },
  tripHeader: { padding: "28px 22px 22px", display: "flex", alignItems: "center", gap: 14 },
  backBtn: { background: "#ffffff15", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  thIconWrap: { width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  thMid: { flex: 1, display: "flex", alignItems: "center", gap: 12 },
  thName: { fontSize: 19, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.5px" },
  thSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  shareHeaderBtn: { background: "transparent", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: "0.3px", flexShrink: 0 },

  // Tab
  tabContent: { flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", minHeight: 0 },
  tabScroll: { height: "100%", overflowY: "auto", padding: "0 20px" },
  tabTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, paddingBottom: 18 },
  tabTitle: { fontSize: 24, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.8px" },
  actionBtn: { background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: 22, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  tabBar: { display: "flex", background: "#0f0f1a", borderTop: "1px solid #1a1a28", padding: "12px 0 16px", flexShrink: 0 },
  tabBtn: { flex: 1, background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0", position: "relative" },
  tabLabel: { fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.3px" },
  tabDot: { width: 4, height: 4, borderRadius: "50%", position: "absolute", bottom: -4 },

  // Itinerary
  dayBlock: { marginBottom: 22 },
  dayLabel: { fontSize: 12, fontWeight: 800, color: "#334155", letterSpacing: "2px", marginBottom: 10 },
  iRow: { display: "flex", gap: 12, padding: "14px", borderRadius: 16, border: "1px solid", marginBottom: 10 },
  iTime: { fontSize: 12, color: "#64748b", width: 48, flexShrink: 0, paddingTop: 2, fontWeight: 600 },
  iLine: { display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 },
  iDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0, marginTop: 3 },
  iConnector: { flex: 1, width: 1, background: "#1e293b", marginTop: 4 },
  iBody: { flex: 1 },
  iTitle: { fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 },
  iDetail: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  iType: { fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" },
  iActionBtn: { border: "none", fontSize: 12, cursor: "pointer", padding: "5px 9px", borderRadius: 8 },
  rowEditBtn: { background: "#1e293b", border: "none", color: "#94a3b8", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: 4, flexShrink: 0 },
  rowDeleteBtn: { background: "#450a0a", border: "none", color: "#f87171", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: 4, flexShrink: 0 },

  // Expenses
  expSummary: { display: "flex", background: "#13131e", borderRadius: 18, marginBottom: 14, border: "1px solid #1a1a2a" },
  expSumItem: { flex: 1, padding: "18px 0", textAlign: "center" },
  expSumDiv: { width: 1, background: "#1e1e2e", margin: "12px 0" },
  expSumVal: { fontSize: 22, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.8px" },
  expSumLbl: { fontSize: 11, color: "#475569", marginTop: 3, letterSpacing: "0.5px" },
  settleCta: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "#1a1a2e", border: "1px solid #2d2d4a", borderRadius: 16, padding: "14px 18px", color: "#a78bfa", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16, boxSizing: "border-box" },
  settleArrow: { fontSize: 18 },
  filterRow: { display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 2 },
  chip: { background: "#13131e", border: "1px solid #1e1e2e", color: "#475569", borderRadius: 22, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  chipActive: {},
  expRow: { display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid #13131e" },
  expIcon: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 },
  expBody: { flex: 1 },
  expTitle: { fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 },
  expMeta: { fontSize: 13, color: "#475569" },
  expRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  expAmt: { fontSize: 17, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.5px" },
  receiptBadge: { fontSize: 13 },

  // Uploads
  sensitiveNote: { background: "#1a1a10", border: "1px solid #2a2a1a", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#a3a380", marginBottom: 16 },
  photoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  photoCard: { borderRadius: 18, height: 140, display: "flex", alignItems: "flex-end", position: "relative", overflow: "hidden", cursor: "pointer", transition: "opacity 0.2s" },
  photoWide: { gridColumn: "span 2", height: 170 },
  photoEmoji: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -65%)", fontSize: 40 },
  sensitiveLock: { position: "absolute", top: 10, right: 10, fontSize: 16 },
  photoOverlay: { background: "linear-gradient(transparent, rgba(0,0,0,0.8))", width: "100%", padding: "22px 12px 12px" },
  photoCaption: { fontSize: 13, fontWeight: 700, color: "#f1f5f9" },
  photoMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2, marginBottom: 6 },
  sensitiveBtn: { background: "#1e293b", border: "none", color: "#64748b", borderRadius: 10, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  sensitiveBtnOn: { background: "#451a03", color: "#fb923c" },
  uploadDrop: { border: "1.5px dashed #1e293b", borderRadius: 18, padding: "28px", textAlign: "center", cursor: "pointer" },
  uploadIcon: { fontSize: 28, marginBottom: 8 },
  uploadText: { fontSize: 15, fontWeight: 700, color: "#475569", marginBottom: 4 },
  uploadSub: { fontSize: 13, color: "#2d3748" },

  // Members
  memberRow: { display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid #13131e" },
  memberAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, flexShrink: 0 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: 700, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 6 },
  youTag: { background: "#1e3a5f", color: "#60a5fa", fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "2px 8px", letterSpacing: "1px" },
  memberMeta: { fontSize: 13, color: "#475569", marginTop: 3 },
  memberRight: {},
  evenBadge: { background: "#1e293b", color: "#64748b", fontSize: 12, fontWeight: 700, borderRadius: 8, padding: "5px 10px" },

  // Modals
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", zIndex: 100 },
  sheet: { background: "#12121c", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "88%", overflowY: "auto", paddingBottom: 24, boxShadow: "0 -20px 60px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,255,255,0.06)" },
  sheetHandle: { width: 40, height: 5, background: "#2d2d4a", borderRadius: 10, margin: "14px auto 0" },
  sheetHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px 14px" },
  sheetTitle: { fontSize: 20, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.5px" },
  closeBtn: { background: "#1e293b", border: "none", color: "#94a3b8", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" },
  sheetBody: { padding: "4px 22px 22px" },
  stepRow: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 18 },
  stepDot: { width: 7, height: 7, borderRadius: "50%", background: "#1e293b" },
  stepDotActive: { background: "#4ade80" },

  // Forms
  field: { marginBottom: 18 },
  fieldLbl: { fontSize: 10, fontWeight: 800, color: "#334155", letterSpacing: "2.5px", marginBottom: 10 },
  input: { background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 14, padding: "14px 16px", color: "#f1f5f9", fontSize: 16, width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  amountWrap: { position: "relative" },
  dollarSign: { position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 16, fontWeight: 700 },
  catRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  catBtn: { background: "#13131e", border: "1px solid #1e293b", color: "#64748b", borderRadius: 22, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  paidRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  paidBtn: { background: "#13131e", border: "1px solid #1e293b", color: "#64748b", borderRadius: 22, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  paidBtnActive: { background: "#1e3a5f", border: "1px solid #3b82f6", color: "#60a5fa" },

  // Split
  splitInfo: { textAlign: "center", padding: "18px 0 22px", borderBottom: "1px solid #1a1a28", marginBottom: 18 },
  splitAmt: { fontSize: 44, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-2px" },
  splitLbl: { fontSize: 13, color: "#475569", marginTop: 4 },
  perPerson: { fontSize: 15, color: "#4ade80", fontWeight: 700, marginTop: 6 },
  splitGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 },
  splitMember: { background: "#13131e", border: "1px solid #1e293b", borderRadius: 14, padding: "14px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" },
  splitMemberOn: { border: "1px solid #22c55e", background: "#0f1f0f" },
  splitAvatar: { width: 40, height: 40, borderRadius: "50%", background: "#1e293b", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 },
  splitName: { fontSize: 12, color: "#94a3b8", fontWeight: 600 },
  splitCheck: { position: "absolute", top: 6, right: 6, fontSize: 10, color: "#4ade80", fontWeight: 800 },

  // Confirm
  confirmCard: { background: "#13131e", borderRadius: 18, padding: "18px", marginBottom: 22, border: "1px solid #1e1e2e" },
  confirmRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a28" },
  confirmLbl: { fontSize: 13, color: "#475569" },
  confirmVal: { fontSize: 14, fontWeight: 700, color: "#e2e8f0" },

  // Buttons
  primaryBtn: { background: "#1e293b", color: "#f1f5f9", border: "none", borderRadius: 16, padding: "16px", width: "100%", fontSize: 16, fontWeight: 800, cursor: "pointer", letterSpacing: "-0.3px" },
  secondaryBtn: { background: "#13131e", color: "#64748b", border: "1px solid #1e293b", borderRadius: 16, padding: "16px", flex: 1, fontSize: 15, fontWeight: 700, cursor: "pointer" },

  // Settle
  settleSection: { marginBottom: 22 },
  settleRow: { background: "#13131e", borderRadius: 16, padding: "16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "opacity 0.2s", border: "1px solid #1a1a2a" },
  settlePeople: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  settleAmt: { fontSize: 13, color: "#475569" },
  payBtn: { background: "#13131e", border: "1px solid #2d3748", color: "#94a3b8", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  markBtn: { background: "#1e293b", border: "none", color: "#64748b", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  markBtnDone: { background: "#14532d", color: "#4ade80" },

  // Share
  shareSubtitle: { fontSize: 14, color: "#64748b", marginBottom: 18 },
  shareOption: { display: "flex", alignItems: "center", gap: 14, background: "#13131e", border: "1px solid #1e1e2e", borderRadius: 18, padding: "16px", marginBottom: 12 },
  shareOptTitle: { fontSize: 15, fontWeight: 800, marginBottom: 3 },
  shareOptSub: { fontSize: 13, color: "#475569" },
  copyBtn: { background: "transparent", border: "1px solid", borderRadius: 22, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  shareNote: { background: "#131310", border: "1px solid #2a2a1a", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#8a8a60", marginTop: 8 },

  // Settings
  settingsSection: { marginBottom: 30 },
  settingsSectionLabel: { fontSize: 11, fontWeight: 800, color: "#334155", letterSpacing: "2.5px", marginBottom: 14 },
  settingsCard: { background: "#13131e", border: "1px solid #1e1e2e", borderRadius: 18, padding: "18px" },

  // New trip prompt
  promptWrap: { position: "relative", marginBottom: 14 },
  promptInput: { background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 16, padding: "16px 52px 16px 16px", color: "#f1f5f9", fontSize: 16, width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.6 },
  micBtn: { position: "absolute", right: 12, top: 12, background: "#1e293b", border: "none", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  micBtnActive: { background: "#2a0f0f", border: "1px solid #7f1d1d" },
  listeningBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#f87171", fontWeight: 700, marginBottom: 14 },
  listeningDot: { width: 9, height: 9, borderRadius: "50%", background: "#f87171" },
  examplesLabel: { fontSize: 10, fontWeight: 800, color: "#334155", letterSpacing: "2.5px", marginBottom: 10 },
  exampleChip: { background: "#13131e", border: "1px solid #1e293b", borderRadius: 12, padding: "11px 14px", color: "#475569", fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "inherit" },
  previewCard: { borderRadius: 20, padding: "22px", marginBottom: 22, border: "1px solid rgba(255,255,255,0.05)" },
};
