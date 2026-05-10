import { supabase } from './supabase'
import { useState, useEffect, useRef } from "react";
import {
  Plane, Mountain, Bike, Umbrella, Map, Snowflake, Car, Anchor, Tent, Theater,
  UtensilsCrossed, Hotel, Zap, Train, Calendar, DollarSign, Image, Users,
  MapPin, ChevronRight, Mic, MicOff, Sparkles, Loader,
  Coffee, Wine, Music, ShoppingBag, Dumbbell, PartyPopper, House, Sunset, Sailboat, Camera
} from "lucide-react";

// Load Playfair Display for wordmark
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&display=swap';
document.head.appendChild(fontLink);

// ─── PALETTE ──────────────────────────────────────────────────────────────────
// Sunburn-inspired warm dark theme
const P = {
  // Bases
  outerBg:     "#0d1e28",   // deep navy outer
  phoneBg:     "#112233",   // slightly lighter navy phone shell
  surface1:    "#162c3a",   // cards, modals
  surface2:    "#1c3448",   // elevated surfaces
  surface3:    "#243d52",   // borders, dividers

  // Accents
  terracotta:  "#e4a576",   // primary accent (replaces green)
  orange:      "#f07340",   // CTA buttons, key actions
  slateBlue:   "#698ea2",   // secondary / muted elements
  lightBlue:   "#b8d4e0",   // highlights, badges, positive states

  // Text
  textPrimary:   "#f0ebe4", // warm white
  textSecondary: "#9ab0bd", // muted
  textMuted:     "#4e6b7a", // very muted

  // Semantic
  danger:   "#e07070",
  dangerBg: "#2a1515",
  success:  "#6bbf8a",
  successBg:"#142a1e",
};

// ─── DATA ────────────────────────────────────────────────────────────────────

const ITINERARY_COLORS = {
  flight:     { bg: "#162840", accent: "#b8d4e0", border: "#1e3a52" },
  stay:       { bg: "#1e2a1a", accent: "#6bbf8a", border: "#2a3d24" },
  activity:   { bg: "#2a1c10", accent: "#e4a576", border: "#3d2a18" },
  restaurant: { bg: "#2a1820", accent: "#e4a0b0", border: "#3d2030" },
  transport:  { bg: "#1e1e2a", accent: "#a090d0", border: "#2a2a3d" },
};

const CATEGORY_META = {
  Stay:      { color: "#6bbf8a", bg: "#142a1e" },
  Food:      { color: "#e4a576", bg: "#2a1c10" },
  Activity:  { color: "#b8d4e0", bg: "#162840" },
  Transport: { color: "#a090d0", bg: "#1e1e2a" },
};

const TRIP_ICONS = {
  "✈️": Plane, "🏔️": Mountain, "🚴": Bike, "🏖️": Umbrella,
  "🗾": Map, "🎿": Snowflake, "🚗": Car, "⛵": Anchor,
  "🏕️": Tent, "🎭": Theater, "☕": Coffee, "🍷": Wine,
  "🎵": Music, "🛍️": ShoppingBag, "💪": Dumbbell, "🎉": PartyPopper,
  "🏠": House, "🌅": Sunset, "📸": Camera, "🍽️": UtensilsCrossed,
};

const TRIP_ICON_LIST = [
  { key: "✈️", Icon: Plane,           label: "Flight" },
  { key: "🏔️", Icon: Mountain,        label: "Adventure" },
  { key: "🚴", Icon: Bike,            label: "Cycling" },
  { key: "🏖️", Icon: Umbrella,        label: "Beach" },
  { key: "🗾", Icon: Map,             label: "Explore" },
  { key: "🎿", Icon: Snowflake,       label: "Snow" },
  { key: "🚗", Icon: Car,             label: "Road trip" },
  { key: "⛵", Icon: Anchor,          label: "Sailing" },
  { key: "🏕️", Icon: Tent,           label: "Camping" },
  { key: "🎭", Icon: Theater,         label: "Culture" },
  { key: "☕", Icon: Coffee,          label: "Coffee" },
  { key: "🍷", Icon: Wine,            label: "Drinks" },
  { key: "🎵", Icon: Music,           label: "Concert" },
  { key: "🛍️", Icon: ShoppingBag,    label: "Shopping" },
  { key: "💪", Icon: Dumbbell,        label: "Active" },
  { key: "🎉", Icon: PartyPopper,     label: "Celebrate" },
  { key: "🏠", Icon: House,           label: "Staycation" },
  { key: "🌅", Icon: Sunset,          label: "Getaway" },
  { key: "📸", Icon: Camera,          label: "Photo trip" },
  { key: "🍽️", Icon: UtensilsCrossed, label: "Dinner" },
];

const ITIN_TYPE_ICONS = {
  flight: Plane, stay: Hotel, activity: Zap,
  restaurant: UtensilsCrossed, transport: Train,
};

// Subtle card gradient variations to differentiate trips without per-trip colors
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #162c3a 0%, #1e3a4a 100%)",
  "linear-gradient(135deg, #1a2a32 0%, #243848 100%)",
  "linear-gradient(135deg, #182030 0%, #22303e 100%)",
  "linear-gradient(135deg, #1c2e3c 0%, #263c4c 100%)",
  "linear-gradient(135deg, #14283a 0%, #1e3448 100%)",
];

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("welcome");
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [modal, setModal] = useState(null);
  const [itinRefresh, setItinRefresh] = useState(0);
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
        setView("profile");
      }
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
        setView("profile");
      } else {
        setProfile(null);
        setView("welcome");
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

  if (!authChecked) return null;

  if (!user) {
    if (view === "welcome") return <WelcomeScreen onGetStarted={() => setView("auth")} />;
    return <AuthScreen onAuth={setUser} onBack={() => setView("welcome")} />;
  }

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

// ─── WELCOME SCREEN ───────────────────────────────────────────────────────────

function WelcomeScreen({ onGetStarted }) {
  return (
    <div style={S.root}>
      <div style={S.phone}>
        <div style={SW.container}>
          {/* Top decorative band */}
          <div style={SW.topBand} />

          {/* Brand */}
          <div style={SW.brandWrap}>
            <div style={SW.wordmark}>vouze</div>
            <div style={SW.tagline}>Where every plan becomes a memory</div>
            <div style={SW.subTagline}>Your home for trips, nights out, and everything in between</div>
          </div>

          {/* Decorative card stack preview */}
          <div style={SW.cardStack}>
            {/* Back card — coffee, peeking behind at an angle */}
            <div style={{ ...SW.previewCard, ...SW.previewCardBack }}>
              <span style={SW.previewEmoji}>☕</span>
              <div>
                <div style={SW.previewLabel}>Coffee Tuesday</div>
                <div style={SW.previewSub}>with Derek · Portland</div>
              </div>
            </div>
            {/* Front card — trip */}
            <div style={{ ...SW.previewCard, ...SW.previewCardFront }}>
              <span style={SW.previewEmoji}>✈️</span>
              <div>
                <div style={SW.previewLabel}>Banff long weekend</div>
                <div style={SW.previewSub}>5 people · Aug 1–4</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={SW.ctaWrap}>
            <button style={SW.ctaBtn} onClick={onGetStarted}>
              Let's plan something
            </button>
          </div>

          {/* Bottom band */}
          <div style={SW.bottomBand} />
        </div>
      </div>
    </div>
  );
}

const SW = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    background: `linear-gradient(170deg, ${P.outerBg} 0%, #0f2030 50%, #162535 100%)`,
    position: "relative",
    overflow: "hidden",
    padding: "0 0 40px",
  },
  topBand: {
    width: "100%",
    height: 6,
    background: `linear-gradient(90deg, ${P.terracotta}, ${P.orange}, ${P.terracotta})`,
    flexShrink: 0,
  },
  bottomBand: {
    width: "100%",
    height: 4,
    background: `linear-gradient(90deg, ${P.slateBlue}, ${P.lightBlue}, ${P.slateBlue})`,
    position: "absolute",
    bottom: 0,
  },
  brandWrap: {
    textAlign: "center",
    padding: "48px 32px 0",
  },
  wordmark: {
    fontFamily: "'Playfair Display', 'Syne', serif",
    fontSize: 62,
    fontWeight: 900,
    letterSpacing: "-2px",
    color: P.textPrimary,
    marginBottom: 20,
    lineHeight: 1,
    fontStyle: "italic",
  },
  tagline: {
    fontFamily: "'Syne', 'DM Sans', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: P.terracotta,
    letterSpacing: "-0.5px",
    marginBottom: 12,
    lineHeight: 1.3,
  },
  subTagline: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: P.slateBlue,
    lineHeight: 1.5,
    maxWidth: 280,
    margin: "0 auto",
  },
  cardStack: {
    position: "relative",
    width: 300,
    height: 160,
    margin: "28px auto",
    flexShrink: 0,
  },
  previewCard: {
    position: "absolute",
    left: "50%",
    borderRadius: 20,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: 255,
    boxSizing: "border-box",
  },
  previewCardFront: {
    background: P.surface2,
    border: `1px solid ${P.surface3}`,
    transform: "translateX(-50%) rotate(-2deg)",
    top: 50,
    zIndex: 2,
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
  },
  previewCardBack: {
    background: P.surface1,
    border: `1px solid ${P.terracotta}30`,
    transform: "translateX(-50%) rotate(3deg)",
    top: 10,
    zIndex: 1,
    opacity: 0.8,
  },
  previewEmoji: {
    fontSize: 26,
    flexShrink: 0,
  },
  previewLabel: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: P.textPrimary,
    letterSpacing: "-0.3px",
    marginBottom: 3,
  },
  previewSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: P.slateBlue,
  },
  ctaWrap: {
    width: "100%",
    padding: "0 28px",
    marginTop: 8,
  },
  ctaBtn: {
    width: "100%",
    background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`,
    color: "#fff",
    border: "none",
    borderRadius: 18,
    padding: "18px",
    fontSize: 17,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "-0.3px",
    boxShadow: `0 8px 24px rgba(240, 115, 64, 0.35)`,
  },
};

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────

function AuthScreen({ onAuth, onBack }) {
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
        <div style={{ padding: "52px 28px 0" }}>
          <button style={SA.backBtn} onClick={onBack}>← Back</button>
          <div style={SA.wordmark}>vouze</div>
          <div style={SA.subtitle}>{mode === "login" ? "Welcome back" : "Create your account"}</div>
        </div>
        <div style={{ padding: "32px 28px 0" }}>
          <div style={S.field}>
            <div style={S.fieldLbl}>EMAIL</div>
            <input style={S.input} type="email" placeholder="you@email.com" value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>PASSWORD</div>
            <input style={S.input} type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div style={{ color: P.danger, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button
            style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, marginBottom: 14 }}
            onClick={handle} disabled={loading}>
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <div style={{ display: "flex", alignItems: "center", margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: P.surface3 }} />
            <span style={{ color: P.textMuted, fontSize: 13, padding: "0 14px" }}>or</span>
            <div style={{ flex: 1, height: 1, background: P.surface3 }} />
          </div>
          <button style={{ ...S.primaryBtn, background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 18 }}
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
              if (error) console.error(error);
            }}>
            <img src="https://www.google.com/favicon.ico" style={{ width: 18, height: 18 }} alt="Google" />
            Continue with Google
          </button>
          <div style={{ textAlign: "center", fontSize: 14, color: P.slateBlue }}>
            {mode === "login" ? "No account? " : "Have an account? "}
            <span style={{ color: P.terracotta, cursor: "pointer", fontWeight: 700 }}
              onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SA = {
  backBtn: {
    background: "transparent",
    border: "none",
    color: P.slateBlue,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    marginBottom: 32,
    fontFamily: "'DM Sans', sans-serif",
  },
  wordmark: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 38,
    fontWeight: 900,
    letterSpacing: "-2px",
    color: P.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: P.slateBlue,
    fontFamily: "'DM Sans', sans-serif",
  },
};

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

        {trips.length === 0 && !showNewTrip && (
          <EmptyTripsState onNew={() => setShowNewTrip(true)} />
        )}

        {trips.map((t, i) => (
          <TripCard key={t.id} trip={t} idx={i} onOpen={onOpen}
            onDelete={handleDeleteTrip} onEdit={setEditingTrip} />
        ))}
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyTripsState({ onNew }) {
  return (
    <div style={SE.wrap}>
      <div style={SE.iconRow}>
        <span style={SE.icon}>✈️</span>
        <span style={SE.icon}>☕</span>
        <span style={SE.icon}>🎉</span>
      </div>
      <div style={SE.headline}>Nothing planned yet</div>
      <div style={SE.sub}>Your next trip, dinner, or night out starts here.</div>
      <button style={SE.btn} onClick={onNew}>Plan something →</button>
    </div>
  );
}

const SE = {
  wrap: {
    background: P.surface1,
    border: `1px dashed ${P.surface3}`,
    borderRadius: 24,
    padding: "40px 28px",
    textAlign: "center",
    marginTop: 8,
  },
  iconRow: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    fontSize: 28,
    marginBottom: 18,
  },
  icon: {},
  headline: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    color: P.textPrimary,
    letterSpacing: "-0.5px",
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: P.slateBlue,
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.5,
    marginBottom: 24,
  },
  btn: {
    background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`,
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "13px 24px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "-0.2px",
  },
};

function TripCard({ trip, idx, onOpen, onDelete, onEdit }) {
  const bg = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
  const IconComp = TRIP_ICONS[trip.emoji] || Plane;

  return (
    <div style={{ ...S.tripCard, background: bg }} onClick={() => onOpen(trip)}>
      <button style={S.tcEditBtn} onClick={(e) => { e.stopPropagation(); onEdit(trip); }}>✎</button>
      <button style={S.tcDeleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(trip); }}>✕</button>
      <div style={S.tcTop}>
        <div style={{ ...S.tcIconWrap, background: P.terracotta + "20", border: `1px solid ${P.terracotta}30` }}>
          <IconComp size={26} color={P.terracotta} strokeWidth={1.5} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {trip.solo && <span style={S.soloBadge}>SOLO</span>}
          {trip.settled && <span style={S.settledBadge}>SETTLED</span>}
        </div>
      </div>
      <div style={S.tcName}>{trip.name}</div>
      <div style={S.tcLocation}>{trip.location} · {trip.dates}</div>
      <div style={S.tcBottom}>
        <div style={{ ...S.tcTotal, color: P.terracotta }}>${(trip.total_spent || 0).toLocaleString()}</div>
        <div style={{ ...S.tcViewBtn, color: P.terracotta, borderColor: P.terracotta + "40" }}>
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
      <div style={{ ...S.tripHeader, background: `linear-gradient(135deg, ${P.surface1} 0%, ${P.surface2} 100%)` }}>
        <button style={S.backBtn} onClick={onBack}>←</button>
        <div style={S.thMid}>
          <div style={{ ...S.thIconWrap, background: P.terracotta + "20" }}>
            <IconComp size={22} color={P.terracotta} strokeWidth={1.5} />
          </div>
          <div>
            <div style={S.thName}>{trip.name}</div>
            <div style={S.thSub}>{trip.location} · {trip.dates}</div>
          </div>
        </div>
        <button style={{ ...S.shareHeaderBtn, color: P.terracotta }} onClick={() => onModal("share")}>
          ↗ Share
        </button>
      </div>

      <div style={{ ...S.tabContent, position: "relative" }}>
        {activeTab === "itinerary" && <ItineraryTab trip={trip} onModal={onModal} refreshKey={itinRefresh} />}
        {activeTab === "expenses"  && <ExpensesTab  trip={trip} onModal={onModal} expRefresh={itinRefresh} profile={profile} user={user} onSettlementsChange={setSettlements} />}
        {activeTab === "uploads"   && <UploadsTab trip={trip} user={user} profile={profile} />}
        {activeTab === "members"   && <MembersTab trip={trip} profile={profile} />}
        {modal === "addExpense"    && <AddExpenseModal trip={trip} user={user} profile={profile} onClose={() => setModal(null)} onAdd={onItinRefresh} />}
        {modal === "addItinerary"  && <AddItinModal trip={trip} onClose={() => setModal(null)} onAdd={() => { setModal(null); onItinRefresh(); setTimeout(onItinRefresh, 100); }} />}
        {modal === "settle"        && <SettleModal settlements={settlements} myName={myName} onClose={() => setModal(null)} />}
        {modal === "share"         && <ShareModal trip={trip} onClose={() => setModal(null)} />}
      </div>

      <div style={S.tabBar}>
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} style={S.tabBtn} onClick={() => { setActiveTab(id); setModal(null); }}>
            <Icon size={24} color={activeTab === id ? P.terracotta : P.textMuted} strokeWidth={activeTab === id ? 2 : 1.5} />
            <span style={{ ...S.tabLabel, ...(activeTab === id ? { color: P.terracotta } : {}) }}>
              {label}
            </span>
            {activeTab === id && <div style={{ ...S.tabDot, background: P.terracotta }} />}
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
        <button style={{ ...S.actionBtn, borderColor: P.terracotta + "60", color: P.terracotta }}
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
                  <button style={{ ...S.iActionBtn, background: P.surface2, color: P.lightBlue }}
                    onClick={() => setEditingItem(item)}>✎</button>
                  <button style={{ ...S.iActionBtn, background: P.dangerBg, color: P.danger }}
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
                        style={{ color: P.lightBlue, fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0, marginLeft: 8, display: "flex", alignItems: "center", gap: 3 }}>
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
        <button style={{ ...S.actionBtn, borderColor: P.terracotta + "60", color: P.terracotta }}
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
          <div style={{ ...S.expSumVal, color: P.danger }}>${myOwed}</div>
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
            style={{ ...S.chip, ...(filter === c ? { ...S.chipActive, borderColor: P.terracotta, color: P.terracotta, background: P.terracotta + "15" } : {}) }}>
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
            <div style={{ ...S.expIcon, background: meta?.bg || P.surface1, color: meta?.color || P.terracotta }}>{exp.category?.[0]}</div>
            <div style={S.expBody}>
              <div style={S.expTitle}>{exp.title}</div>
              <div style={S.expMeta}>
                {exp.date} · <span style={{ color: P.textPrimary }}>{exp.paid_by || exp.paidBy}</span> paid · ${perPerson}/person
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

function UploadsTab({ trip, user, profile }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPhotos();
    const subscription = supabase.channel(`photos:${trip.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => fetchPhotos())
      .subscribe();
    return () => subscription.unsubscribe();
  }, [trip.id]);

  const fetchPhotos = async () => {
    const { data, error } = await supabase.from('photos').select('*')
      .eq('trip_id', trip.id).order('created_at', { ascending: false });
    if (error) console.error(error);
    else setPhotos(data || []);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${trip.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('trip-photos').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('trip-photos').getPublicUrl(path);
      const uploader = profile?.display_name || user?.email?.split('@')[0] || 'Me';
      const { error: dbError } = await supabase.from('photos').insert([{
        trip_id: trip.id, user_id: user?.id, storage_path: path,
        url: publicUrl, caption: file.name.split('.')[0], uploader, sensitive: false
      }]);
      if (dbError) throw dbError;
      await fetchPhotos();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const toggleSensitive = async (photo) => {
    const { error } = await supabase.from('photos')
      .update({ sensitive: !photo.sensitive }).eq('id', photo.id);
    if (!error) setPhotos(p => p.map(ph => ph.id === photo.id ? { ...ph, sensitive: !ph.sensitive } : ph));
  };

  const handleDelete = async (photo) => {
    if (!window.confirm('Remove this photo?')) return;
    await supabase.storage.from('trip-photos').remove([photo.storage_path]);
    await supabase.from('photos').delete().eq('id', photo.id);
    setPhotos(p => p.filter(ph => ph.id !== photo.id));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Memories</div>
        <button style={{ ...S.actionBtn, borderColor: P.terracotta + "60", color: P.terracotta }}
          onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading..." : "+ Upload"}
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => handleUpload(e.target.files[0])} />
      <div style={S.sensitiveNote}>🔒 Mark photos as sensitive to exclude them from shared exports.</div>

      {photos.length === 0 && !uploading && (
        <div style={{ ...S.uploadDrop, marginBottom: 16 }}
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}>
          <div style={S.uploadIcon}>📎</div>
          <div style={S.uploadText}>Drop your first photo here</div>
          <div style={S.uploadSub}>Tap to browse or drag and drop</div>
        </div>
      )}

      {photos.length > 0 && (
        <div style={S.photoGrid}>
          {photos.map((ph, idx) => (
            <div key={ph.id}
              style={{ ...S.photoCard, ...(idx === 0 ? S.photoWide : {}), opacity: ph.sensitive ? 0.55 : 1 }}>
              <img src={ph.url} alt={ph.caption}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 }} />
              {ph.sensitive && <div style={S.sensitiveLock}>🔒</div>}
              <div style={S.photoOverlay}>
                <div style={S.photoCaption}>{ph.caption}</div>
                <div style={S.photoMeta}>{ph.uploader}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button style={{ ...S.sensitiveBtn, ...(ph.sensitive ? S.sensitiveBtnOn : {}) }}
                    onClick={() => toggleSensitive(ph)}>
                    {ph.sensitive ? "Sensitive" : "Mark sensitive"}
                  </button>
                  <button style={{ ...S.sensitiveBtn, background: P.dangerBg, color: P.danger }}
                    onClick={() => handleDelete(ph)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div style={{ ...S.uploadDrop, marginTop: 12 }}
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}>
          <div style={S.uploadIcon}>📎</div>
          <div style={S.uploadText}>Add more</div>
          <div style={S.uploadSub}>Photos, receipts, anything</div>
        </div>
      )}
      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── MEMBERS TAB ──────────────────────────────────────────────────────────────

function MembersTab({ trip, profile }) {
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [newName, setNewName] = useState("");
  const myName = profile?.display_name || "";

  useEffect(() => {
    supabase.from('members').select('*').eq('trip_id', trip.id)
      .then(({ data, error }) => { if (error) console.error(error); else setMembers(data); });
  }, [trip.id]);

  const avatarColors = [P.terracotta, P.lightBlue, P.orange, P.slateBlue, P.success];

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Members</div>
        <button style={{ ...S.actionBtn, borderColor: P.terracotta + "60", color: P.terracotta }}
          onClick={() => setShowInvite(true)}>+ Invite</button>
      </div>
      {showInvite && (
        <div style={{ background: P.surface1, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${P.surface3}` }}>
          <div style={S.fieldLbl}>INVITE BY EMAIL</div>
          <input style={S.input} placeholder="friend@email.com" value={newName}
            onChange={e => setNewName(e.target.value)} type="email" />
          <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8, marginBottom: 12 }}>
            They'll see this trip when they sign in.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.secondaryBtn} onClick={() => setShowInvite(false)}>Cancel</button>
            <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={async () => {
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
          <div style={{ ...S.memberAvatar, background: avatarColors[i % avatarColors.length] + "25", color: avatarColors[i % avatarColors.length] }}>
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

  const toggleVoice = async () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
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
    recognition.onerror = (e) => { console.error('Speech recognition error:', e.error); setListening(false); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const [form, setForm] = useState({
    name: "", location: "", city: "", country: "",
    startDate: "", endDate: "", emoji: "✈️",
  });
  const [loading, setLoading] = useState(false);

  const formatDates = (start, end) => {
    if (!start) return "";
    const s = new Date(start + 'T12:00:00');
    if (!end || start === end) {
      return s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
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
    // Add creator as trip member
    await supabase.from('trip_members').insert([{ trip_id: data[0].id, user_id: userId, role: 'owner', status: 'accepted' }]);
    onSave(data[0]);
  };

  const IconComp = TRIP_ICONS[form.emoji] || Plane;

  return (
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
              <textarea style={S.promptInput} placeholder={EXAMPLES[exampleIdx]}
                value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} />
              <button style={{ ...S.micBtn, ...(listening ? S.micBtnActive : {}) }} onClick={toggleVoice}>
                {listening ? <MicOff size={20} color={P.danger} /> : <Mic size={20} color={P.textMuted} />}
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
              style={{ ...S.primaryBtn, background: parsing ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={parseWithClaude} disabled={parsing || !prompt.trim()}>
              {parsing
                ? <><Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Thinking...</>
                : <><Sparkles size={18} /> Build it</>}
            </button>
            <button style={{ ...S.secondaryBtn, marginTop: 10, width: "100%" }}
              onClick={() => setStage("confirm")}>Fill in manually →</button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {stage === "confirm" && (
          <div style={S.sheetBody}>
            {parseError && (
              <div style={{ background: P.dangerBg, border: `1px solid ${P.danger}40`, borderRadius: 12, padding: "12px 14px", fontSize: 13, color: P.danger, marginBottom: 16 }}>
                {parseError}
              </div>
            )}
            <div style={{ ...S.previewCard, background: `linear-gradient(135deg, ${P.surface1} 0%, ${P.surface2} 100%)` }}>
              <div style={{ ...S.tcIconWrap, background: P.terracotta + "20", border: `1px solid ${P.terracotta}30`, marginBottom: 12 }}>
                <IconComp size={26} color={P.terracotta} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px" }}>{form.name || "Untitled"}</div>
              <div style={{ fontSize: 13, color: P.textSecondary, marginTop: 4 }}>
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
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ ...S.field, flex: 1 }}>
                <div style={S.fieldLbl}>START DATE</div>
                <input style={{ ...S.input, colorScheme: "dark" }} type="date"
                  value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div style={{ ...S.field, flex: 1 }}>
                <div style={{ ...S.fieldLbl, display: "flex", justifyContent: "space-between" }}>
                  <span>END DATE</span>
                  <span style={{ color: P.textMuted, fontWeight: 600 }}>optional</span>
                </div>
                <input style={{ ...S.input, colorScheme: "dark" }} type="date"
                  value={form.endDate} min={form.startDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>ICON</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TRIP_ICON_LIST.map(({ key, Icon, label }) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, emoji: key }))}
                    style={{
                      background: form.emoji === key ? P.surface2 : "transparent",
                      border: form.emoji === key ? `1px solid ${P.terracotta}` : `1px solid ${P.surface3}`,
                      borderRadius: 12, padding: "8px 12px", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 56
                    }}>
                    <Icon size={20} color={form.emoji === key ? P.terracotta : P.textMuted} strokeWidth={1.5} />
                    <span style={{ fontSize: 9, color: form.emoji === key ? P.terracotta : P.textMuted, fontWeight: 700, letterSpacing: "0.5px" }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.secondaryBtn} onClick={() => setStage("prompt")}>← Redo</button>
              <button style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }}
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
                    style={{ ...S.catBtn, ...(exp.category === c ? { background: CATEGORY_META[c]?.bg, color: CATEGORY_META[c]?.color, borderColor: CATEGORY_META[c]?.color } : { borderColor: P.surface3, background: P.surface1, color: P.textMuted }) }}>
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
            <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }}
              onClick={() => members.length <= 1 ? setStep(3) : setStep(2)}>
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
                  <div style={{ ...S.splitAvatar, ...(exp.splitWith.includes(m) ? { background: P.successBg, color: P.success } : {}) }}>{m[0]}</div>
                  <div style={S.splitName}>{m}</div>
                  {exp.splitWith.includes(m) && <div style={S.splitCheck}>✓</div>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.secondaryBtn} onClick={() => setStep(1)}>← Back</button>
              <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }}
                onClick={() => setStep(3)}>Review</button>
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
              <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }}
                onClick={handleSubmit}>
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
                    style={{ ...S.catBtn, display: "flex", alignItems: "center", gap: 5, textTransform: "capitalize", ...(form.type === t ? { background: m.bg, color: m.accent, borderColor: m.accent + "80" } : { borderColor: P.surface3, background: P.surface1, color: P.textMuted }) }}>
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
          <button style={{ ...S.primaryBtn, background: meta.accent === P.terracotta ? `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` : meta.accent, color: "#fff", marginTop: 8 }}
            onClick={handleAdd}>
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
                    style={{ ...S.catBtn, display: "flex", alignItems: "center", gap: 5, textTransform: "capitalize", ...(form.type === t ? { background: m.bg, color: m.accent, borderColor: m.accent + "80" } : { borderColor: P.surface3, background: P.surface1, color: P.textMuted }) }}>
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
          <button style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", marginTop: 8 }}
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
                  <div style={S.settlePeople}><span style={{ color: P.danger }}>You</span> → <span style={{ color: P.terracotta }}>{s.to}</span></div>
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
                  <div style={S.settlePeople}><span style={{ color: P.orange }}>{s.from}</span> → <span style={{ color: P.terracotta }}>{s.to}</span></div>
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
    { icon: "🗓", label: "Full Itinerary", sub: "All stops, times & confirmations", color: P.lightBlue },
    { icon: "📍", label: "Places & Recs", sub: "Restaurants, activities & stays only", color: P.terracotta },
    { icon: "📋", label: "Trip Summary", sub: "Overview with spend & members", color: P.orange },
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
        <div style={{ fontSize: 24, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px" }}>Settings</div>
      </div>
      <div style={{ padding: "0 24px 40px" }}>
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>PROFILE</div>
          <div style={S.settingsCard}>
            <div style={S.fieldLbl}>DISPLAY NAME</div>
            <input style={S.input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
            <button style={{ ...S.primaryBtn, background: saved ? P.successBg : saving ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: saved ? P.success : "#fff", marginTop: 14 }}
              onClick={handleSaveName} disabled={saving}>
              {saved ? "✓ Saved" : saving ? "Saving..." : "Save Name"}
            </button>
          </div>
        </div>
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>RECENTLY DELETED</div>
          {deletedTrips.length === 0
            ? <div style={{ fontSize: 14, color: P.textMuted, padding: "16px 0" }}>No recently deleted trips.</div>
            : deletedTrips.map(trip => (
              <div key={trip.id} style={S.settingsCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: P.textPrimary }}>{trip.name}</div>
                    <div style={{ fontSize: 13, color: P.textMuted, marginTop: 3 }}>{trip.location} · deleted {new Date(trip.deleted_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: P.successBg, border: "none", color: P.success, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                      onClick={() => handleRestore(trip)} disabled={restoring === trip.id}>
                      {restoring === trip.id ? "..." : "Restore"}
                    </button>
                    <button style={{ background: P.dangerBg, border: "none", color: P.danger, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                      onClick={() => handlePermanentDelete(trip)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>NOTIFICATIONS</div>
          <div style={{ ...S.settingsCard, opacity: 0.4 }}><div style={{ fontSize: 14, color: P.textMuted }}>Coming soon</div></div>
        </div>
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>CONNECTED ACCOUNTS</div>
          <div style={{ ...S.settingsCard, opacity: 0.4 }}><div style={{ fontSize: 14, color: P.textMuted }}>Coming soon</div></div>
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
                    background: form.emoji === key ? P.surface2 : "transparent",
                    border: form.emoji === key ? `1px solid ${P.terracotta}` : `1px solid ${P.surface3}`,
                    borderRadius: 12, padding: "8px 12px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 56
                  }}>
                  <Icon size={20} color={form.emoji === key ? P.terracotta : P.textMuted} strokeWidth={1.5} />
                  <span style={{ fontSize: 9, color: form.emoji === key ? P.terracotta : P.textMuted, fontWeight: 700, letterSpacing: "0.5px" }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, marginTop: 8 }}
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
  root: {
    minHeight: "100vh",
    background: P.outerBg,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "32px 16px",
    fontFamily: "'Syne', 'DM Sans', 'Helvetica Neue', sans-serif",
  },
  phone: {
    width: 430,
    maxWidth: "100%",
    background: P.phoneBg,
    borderRadius: 36,
    overflow: "hidden",
    boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)`,
    minHeight: 750,
    height: 750,
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  screen: { flex: 1, overflowY: "auto" },

  // Profile
  profileHero: {
    padding: "52px 28px 32px",
    textAlign: "center",
    background: `linear-gradient(180deg, ${P.surface1} 0%, ${P.phoneBg} 100%)`,
    borderBottom: `1px solid ${P.surface3}`,
  },
  profileAvatar: {
    width: 84, height: 84, borderRadius: "50%",
    background: `linear-gradient(135deg, ${P.terracotta}, ${P.orange})`,
    color: "#fff",
    fontSize: 26, fontWeight: 900,
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px", letterSpacing: "-1px",
  },
  profileName: { fontSize: 30, fontWeight: 900, color: P.textPrimary, letterSpacing: "-1.2px", marginBottom: 6 },
  profileSub: { fontSize: 13, color: P.textMuted, letterSpacing: "1px", marginBottom: 24 },
  profileStats: {
    display: "flex", justifyContent: "center", alignItems: "center",
    background: P.surface1, borderRadius: 18, padding: "18px 0", border: `1px solid ${P.surface3}`,
  },
  statItem: { flex: 1, textAlign: "center" },
  statNum: { fontSize: 26, fontWeight: 900, color: P.textPrimary, letterSpacing: "-1px" },
  statLbl: { fontSize: 11, color: P.textMuted, letterSpacing: "1px", marginTop: 3 },
  statDiv: { width: 1, height: 34, background: P.surface3 },

  // Section
  sectionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 32 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: P.textMuted, letterSpacing: "2.5px" },
  newBtn: {
    background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`,
    color: "#fff", border: "none", borderRadius: 22,
    padding: "9px 18px", fontSize: 14, fontWeight: 800, cursor: "pointer",
  },
  ghostBtn: {
    background: "transparent", border: `1px solid ${P.surface3}`,
    color: P.slateBlue, borderRadius: 22,
    padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },

  // Trip card
  tripCard: {
    borderRadius: 24, padding: "22px", marginBottom: 14, cursor: "pointer",
    border: `1px solid rgba(255,255,255,0.06)`, position: "relative",
  },
  tcIconWrap: { width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" },
  tcTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  tcEditBtn: { position: "absolute", top: 14, right: 54, background: "rgba(255,255,255,0.08)", border: "none", color: P.textSecondary, borderRadius: 10, padding: "7px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", zIndex: 10 },
  tcDeleteBtn: { position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.08)", border: "none", color: P.textSecondary, borderRadius: 10, padding: "7px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", zIndex: 10 },
  soloBadge: { background: P.surface2, color: P.textMuted, fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", padding: "4px 10px", borderRadius: 8 },
  settledBadge: { background: P.successBg, color: P.success, fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", padding: "4px 10px", borderRadius: 8 },
  tcName: { fontSize: 26, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px", marginBottom: 6 },
  tcLocation: { fontSize: 14, color: P.textSecondary, marginBottom: 18 },
  tcBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tcTotal: { fontSize: 22, fontWeight: 900, letterSpacing: "-1px" },
  tcViewBtn: { display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, border: "1px solid", borderRadius: 22, padding: "7px 14px" },

  // Trip shell
  tripShell: { flex: 1, display: "flex", flexDirection: "column", height: "100%", position: "relative" },
  tripHeader: { padding: "28px 22px 22px", display: "flex", alignItems: "center", gap: 14 },
  backBtn: { background: "rgba(255,255,255,0.08)", border: "none", color: P.textPrimary, fontSize: 20, cursor: "pointer", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  thIconWrap: { width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  thMid: { flex: 1, display: "flex", alignItems: "center", gap: 12 },
  thName: { fontSize: 19, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px" },
  thSub: { fontSize: 12, color: P.textSecondary, marginTop: 2 },
  shareHeaderBtn: { background: "transparent", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: "0.3px", flexShrink: 0 },

  // Tab
  tabContent: { flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", minHeight: 0 },
  tabScroll: { height: "100%", overflowY: "auto", padding: "0 20px" },
  tabTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, paddingBottom: 18 },
  tabTitle: { fontSize: 24, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px" },
  actionBtn: { background: "transparent", border: `1px solid ${P.surface3}`, color: P.textSecondary, borderRadius: 22, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  tabBar: { display: "flex", background: P.surface1, borderTop: `1px solid ${P.surface3}`, padding: "12px 0 16px", flexShrink: 0 },
  tabBtn: { flex: 1, background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0", position: "relative" },
  tabLabel: { fontSize: 11, fontWeight: 700, color: P.textMuted, letterSpacing: "0.3px" },
  tabDot: { width: 4, height: 4, borderRadius: "50%", position: "absolute", bottom: -4 },

  // Itinerary
  dayBlock: { marginBottom: 22 },
  dayLabel: { fontSize: 12, fontWeight: 800, color: P.textMuted, letterSpacing: "2px", marginBottom: 10 },
  iRow: { display: "flex", gap: 12, padding: "14px", borderRadius: 16, border: "1px solid", marginBottom: 10 },
  iTime: { fontSize: 12, color: P.textMuted, width: 48, flexShrink: 0, paddingTop: 2, fontWeight: 600 },
  iLine: { display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 },
  iDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0, marginTop: 3 },
  iConnector: { flex: 1, width: 1, background: P.surface3, marginTop: 4 },
  iBody: { flex: 1 },
  iTitle: { fontSize: 15, fontWeight: 700, color: P.textPrimary, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 },
  iDetail: { fontSize: 13, color: P.textMuted, marginBottom: 4 },
  iType: { fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" },
  iActionBtn: { border: "none", fontSize: 12, cursor: "pointer", padding: "5px 9px", borderRadius: 8 },
  rowEditBtn: { background: P.surface2, border: "none", color: P.textSecondary, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: 4, flexShrink: 0 },
  rowDeleteBtn: { background: P.dangerBg, border: "none", color: P.danger, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: 4, flexShrink: 0 },

  // Expenses
  expSummary: { display: "flex", background: P.surface1, borderRadius: 18, marginBottom: 14, border: `1px solid ${P.surface3}` },
  expSumItem: { flex: 1, padding: "18px 0", textAlign: "center" },
  expSumDiv: { width: 1, background: P.surface3, margin: "12px 0" },
  expSumVal: { fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px" },
  expSumLbl: { fontSize: 11, color: P.textMuted, marginTop: 3, letterSpacing: "0.5px" },
  settleCta: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 16, padding: "14px 18px", color: P.lightBlue, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16, boxSizing: "border-box" },
  settleArrow: { fontSize: 18 },
  filterRow: { display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 2 },
  chip: { background: P.surface1, border: `1px solid ${P.surface3}`, color: P.textMuted, borderRadius: 22, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  chipActive: {},
  expRow: { display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: `1px solid ${P.surface1}` },
  expIcon: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 },
  expBody: { flex: 1 },
  expTitle: { fontSize: 16, fontWeight: 700, color: P.textPrimary, marginBottom: 4 },
  expMeta: { fontSize: 13, color: P.textMuted },
  expRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  expAmt: { fontSize: 17, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px" },
  receiptBadge: { fontSize: 13 },

  // Uploads
  sensitiveNote: { background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "12px 16px", fontSize: 13, color: P.slateBlue, marginBottom: 16 },
  photoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  photoCard: { borderRadius: 18, height: 140, display: "flex", alignItems: "flex-end", position: "relative", overflow: "hidden", cursor: "pointer", transition: "opacity 0.2s" },
  photoWide: { gridColumn: "span 2", height: 170 },
  sensitiveLock: { position: "absolute", top: 10, right: 10, fontSize: 16 },
  photoOverlay: { background: "linear-gradient(transparent, rgba(0,0,0,0.85))", width: "100%", padding: "22px 12px 12px", position: "absolute", bottom: 0 },
  photoCaption: { fontSize: 13, fontWeight: 700, color: P.textPrimary },
  photoMeta: { fontSize: 11, color: P.textSecondary, marginTop: 2, marginBottom: 6 },
  sensitiveBtn: { background: P.surface2, border: "none", color: P.textMuted, borderRadius: 10, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  sensitiveBtnOn: { background: "#2a1810", color: P.terracotta },
  uploadDrop: { border: `1.5px dashed ${P.surface3}`, borderRadius: 18, padding: "28px", textAlign: "center", cursor: "pointer" },
  uploadIcon: { fontSize: 28, marginBottom: 8 },
  uploadText: { fontSize: 15, fontWeight: 700, color: P.textMuted, marginBottom: 4 },
  uploadSub: { fontSize: 13, color: P.textMuted },

  // Members
  memberRow: { display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: `1px solid ${P.surface1}` },
  memberAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, flexShrink: 0 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: 700, color: P.textPrimary, display: "flex", alignItems: "center", gap: 6 },
  youTag: { background: P.surface2, color: P.lightBlue, fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "2px 8px", letterSpacing: "1px" },
  memberMeta: { fontSize: 13, color: P.textMuted, marginTop: 3 },
  memberRight: {},
  evenBadge: { background: P.surface2, color: P.textMuted, fontSize: 12, fontWeight: 700, borderRadius: 8, padding: "5px 10px" },

  // Modals
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", zIndex: 100 },
  sheet: { background: P.surface1, borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "88%", overflowY: "auto", paddingBottom: 24, boxShadow: `0 -20px 60px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,255,255,0.06)` },
  sheetHandle: { width: 40, height: 5, background: P.surface3, borderRadius: 10, margin: "14px auto 0" },
  sheetHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px 14px" },
  sheetTitle: { fontSize: 20, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px" },
  closeBtn: { background: P.surface2, border: "none", color: P.textSecondary, width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" },
  sheetBody: { padding: "4px 22px 22px" },
  stepRow: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 18 },
  stepDot: { width: 7, height: 7, borderRadius: "50%", background: P.surface3 },
  stepDotActive: { background: P.terracotta },

  // Forms
  field: { marginBottom: 18 },
  fieldLbl: { fontSize: 10, fontWeight: 800, color: P.textMuted, letterSpacing: "2.5px", marginBottom: 10 },
  input: { background: P.phoneBg, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "14px 16px", color: P.textPrimary, fontSize: 16, width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  amountWrap: { position: "relative" },
  dollarSign: { position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: P.textMuted, fontSize: 16, fontWeight: 700 },
  catRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  catBtn: { background: P.surface1, border: `1px solid ${P.surface3}`, color: P.textMuted, borderRadius: 22, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  paidRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  paidBtn: { background: P.surface1, border: `1px solid ${P.surface3}`, color: P.textMuted, borderRadius: 22, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  paidBtnActive: { background: P.surface2, border: `1px solid ${P.lightBlue}`, color: P.lightBlue },

  // Split
  splitInfo: { textAlign: "center", padding: "18px 0 22px", borderBottom: `1px solid ${P.surface3}`, marginBottom: 18 },
  splitAmt: { fontSize: 44, fontWeight: 900, color: P.textPrimary, letterSpacing: "-2px" },
  splitLbl: { fontSize: 13, color: P.textMuted, marginTop: 4 },
  perPerson: { fontSize: 15, color: P.terracotta, fontWeight: 700, marginTop: 6 },
  splitGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 },
  splitMember: { background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "14px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" },
  splitMemberOn: { border: `1px solid ${P.terracotta}`, background: "#1e1810" },
  splitAvatar: { width: 40, height: 40, borderRadius: "50%", background: P.surface3, color: P.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 },
  splitName: { fontSize: 12, color: P.textSecondary, fontWeight: 600 },
  splitCheck: { position: "absolute", top: 6, right: 6, fontSize: 10, color: P.terracotta, fontWeight: 800 },

  // Confirm
  confirmCard: { background: P.surface2, borderRadius: 18, padding: "18px", marginBottom: 22, border: `1px solid ${P.surface3}` },
  confirmRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${P.surface3}` },
  confirmLbl: { fontSize: 13, color: P.textMuted },
  confirmVal: { fontSize: 14, fontWeight: 700, color: P.textPrimary },

  // Buttons
  primaryBtn: { background: P.surface2, color: P.textPrimary, border: "none", borderRadius: 16, padding: "16px", width: "100%", fontSize: 16, fontWeight: 800, cursor: "pointer", letterSpacing: "-0.3px" },
  secondaryBtn: { background: P.surface2, color: P.textMuted, border: `1px solid ${P.surface3}`, borderRadius: 16, padding: "16px", flex: 1, fontSize: 15, fontWeight: 700, cursor: "pointer" },

  // Settle
  settleSection: { marginBottom: 22 },
  settleRow: { background: P.surface2, borderRadius: 16, padding: "16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "opacity 0.2s", border: `1px solid ${P.surface3}` },
  settlePeople: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  settleAmt: { fontSize: 13, color: P.textMuted },
  payBtn: { background: P.surface1, border: `1px solid ${P.surface3}`, color: P.textSecondary, borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  markBtn: { background: P.surface2, border: "none", color: P.textMuted, borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  markBtnDone: { background: P.successBg, color: P.success },

  // Share
  shareSubtitle: { fontSize: 14, color: P.slateBlue, marginBottom: 18 },
  shareOption: { display: "flex", alignItems: "center", gap: 14, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 18, padding: "16px", marginBottom: 12 },
  shareOptTitle: { fontSize: 15, fontWeight: 800, marginBottom: 3 },
  shareOptSub: { fontSize: 13, color: P.textMuted },
  copyBtn: { background: "transparent", border: "1px solid", borderRadius: 22, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  shareNote: { background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "12px 16px", fontSize: 13, color: P.slateBlue, marginTop: 8 },

  // Settings
  settingsSection: { marginBottom: 30 },
  settingsSectionLabel: { fontSize: 11, fontWeight: 800, color: P.textMuted, letterSpacing: "2.5px", marginBottom: 14 },
  settingsCard: { background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 18, padding: "18px" },

  // New trip prompt
  promptWrap: { position: "relative", marginBottom: 14 },
  promptInput: { background: P.phoneBg, border: `1px solid ${P.surface3}`, borderRadius: 16, padding: "16px 52px 16px 16px", color: P.textPrimary, fontSize: 16, width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.6 },
  micBtn: { position: "absolute", right: 12, top: 12, background: P.surface2, border: "none", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  micBtnActive: { background: P.dangerBg, border: `1px solid ${P.danger}40` },
  listeningBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: P.danger, fontWeight: 700, marginBottom: 14 },
  listeningDot: { width: 9, height: 9, borderRadius: "50%", background: P.danger },
  examplesLabel: { fontSize: 10, fontWeight: 800, color: P.textMuted, letterSpacing: "2.5px", marginBottom: 10 },
  exampleChip: { background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 12, padding: "11px 14px", color: P.textMuted, fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "inherit" },
  previewCard: { borderRadius: 20, padding: "22px", marginBottom: 22, border: `1px solid rgba(255,255,255,0.05)` },
};
