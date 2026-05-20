import { supabase } from './supabase'
import React, { useState, useEffect, useRef } from "react";
import {
  Plane, Mountain, Bike, Umbrella, Map, Snowflake, Car, Anchor, Tent, Theater,
  UtensilsCrossed, Hotel, Zap, Train, Calendar, DollarSign, Image, Users,
  MapPin, ChevronRight, Sparkles, BarChart2, Trophy, Clock,
  Coffee, Wine, Music, ShoppingBag, Dumbbell, PartyPopper, House, Sunset, Camera, Download
} from "lucide-react";

const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&display=swap';
document.head.appendChild(fontLink);

const P = {
  outerBg:     "#0d1e28",
  phoneBg:     "#112233",
  surface1:    "#162c3a",
  surface2:    "#1c3448",
  surface3:    "#243d52",
  terracotta:  "#e4a576",
  orange:      "#f07340",
  slateBlue:   "#698ea2",
  lightBlue:   "#b8d4e0",
  textPrimary:   "#f0ebe4",
  textSecondary: "#9ab0bd",
  textMuted:     "#4e6b7a",
  danger:   "#e07070",
  dangerBg: "#2a1515",
  success:  "#6bbf8a",
  successBg:"#142a1e",
};

const ITINERARY_COLORS = {
  flight:     { accent: P.lightBlue },
  transport:  { accent: "#a090d0" },
  stay:       { accent: "#6bbf8a" },
  restaurant: { accent: "#e4a0b0" },
  drinks:     { accent: P.orange },
  activity:   { accent: P.terracotta },
  shopping:   { accent: "#d4a0e0" },
  other:      { accent: P.slateBlue },
};

const CATEGORY_META = {
  Dining:   { color: "#e4a0b0", bg: "#2a1520" },
  Drinks:   { color: P.orange,  bg: "#2a1c10" },
  Stay:     { color: "#6bbf8a", bg: "#142a1e" },
  Activity: { color: P.lightBlue, bg: "#162840" },
  Shopping: { color: "#d4a0e0", bg: "#1e1a2a" },
  Travel:   { color: "#a090d0", bg: "#1a1e2a" },
  Other:    { color: P.slateBlue, bg: "#162030" },
};

const TRIP_ICONS = {
  "✈️": Plane, "🏔️": Mountain, "🚴": Bike, "🏖️": Umbrella,
  "🗾": Map, "🎿": Snowflake, "🚗": Car, "⛵": Anchor,
  "🏕️": Tent, "🎭": Theater, "☕": Coffee, "🍷": Wine,
  "🎵": Music, "🛍️": ShoppingBag, "💪": Dumbbell, "🎉": PartyPopper,
  "🏠": House, "🌅": Sunset, "📸": Camera, "🍽️": UtensilsCrossed,
  "🎊": PartyPopper, "🥂": Wine, "📍": MapPin, "🏆": Trophy, "🥗": UtensilsCrossed,
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
  flight: Plane, transport: Train, stay: Hotel,
  restaurant: UtensilsCrossed, drinks: Wine,
  activity: Zap, shopping: ShoppingBag, other: MapPin,
};

const ITIN_TYPES = ["flight","transport","stay","restaurant","drinks","activity","shopping","other"];

const CAT_ICONS = {
  Dining: UtensilsCrossed, Drinks: Wine, Stay: Hotel,
  Activity: Zap, Shopping: ShoppingBag, Travel: Train, Other: MapPin,
};
const CATS = ["Dining","Drinks","Stay","Activity","Shopping","Travel","Other"];

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
    const defaultTab = (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (trip.start_date) {
        const start = new Date(trip.start_date + 'T12:00:00');
        const end = trip.end_date ? new Date(trip.end_date + 'T12:00:00') : start;
        if (end < today) return "summary";
        return "itinerary";
      }
      return "itinerary";
    })();
    setActiveTrip(trip);
    setActiveTab(defaultTab);
    setView("trip");
  };

  return (
    <div style={S.root}>
      <div style={S.phone}>
        {view === "profile" && (
          <ProfileScreen onOpen={openTrip} user={user} profile={profile}
            onSignOut={async () => { await supabase.auth.signOut(); }}
            onSettings={() => setView("settings")}
            onProfileUpdate={(updated) => setProfile(updated)} />
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
            onTripUpdate={(updated) => setActiveTrip(updated)}
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
          <div style={SW.topBand} />
          <div style={SW.brandWrap}>
            <div style={SW.wordmark}>vouze</div>
            <div style={SW.tagline}>Where every plan becomes a memory</div>
            <div style={SW.subTagline}>Your home for trips, nights out, and everything in between</div>
          </div>
          <div style={SW.cardStack}>
            <div style={{ ...SW.previewCard, ...SW.previewCardBack }}>
              <span style={SW.previewEmoji}>☕</span>
              <div>
                <div style={SW.previewLabel}>Coffee Tuesday</div>
                <div style={SW.previewSub}>with Derek · Portland</div>
              </div>
            </div>
            <div style={{ ...SW.previewCard, ...SW.previewCardFront }}>
              <span style={SW.previewEmoji}>✈️</span>
              <div>
                <div style={SW.previewLabel}>Banff long weekend</div>
                <div style={SW.previewSub}>5 people · Aug 1–4</div>
              </div>
            </div>
          </div>
          <div style={SW.ctaWrap}>
            <button style={SW.ctaBtn} onClick={onGetStarted}>
              Let's plan something
            </button>
          </div>
          <div style={SW.bottomBand} />
        </div>
      </div>
    </div>
  );
}

const SW = {
  container: {
    height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "space-between",
    background: `linear-gradient(170deg, ${P.outerBg} 0%, #0f2030 50%, #162535 100%)`,
    position: "relative", overflow: "hidden", padding: "0 0 40px",
  },
  topBand: { width: "100%", height: 6, background: `linear-gradient(90deg, ${P.terracotta}, ${P.orange}, ${P.terracotta})`, flexShrink: 0 },
  bottomBand: { width: "100%", height: 4, background: `linear-gradient(90deg, ${P.slateBlue}, ${P.lightBlue}, ${P.slateBlue})`, position: "absolute", bottom: 0 },
  brandWrap: { textAlign: "center", padding: "48px 32px 0" },
  wordmark: { fontFamily: "'Playfair Display', serif", fontSize: 62, fontWeight: 900, letterSpacing: "-2px", color: P.textPrimary, marginBottom: 20, lineHeight: 1, fontStyle: "italic" },
  tagline: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: P.terracotta, letterSpacing: "-0.5px", marginBottom: 12, lineHeight: 1.3 },
  subTagline: { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: P.slateBlue, lineHeight: 1.5, maxWidth: 280, margin: "0 auto" },
  cardStack: { position: "relative", width: 300, height: 160, margin: "28px auto", flexShrink: 0 },
  previewCard: { position: "absolute", left: "50%", borderRadius: 20, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, width: 255, boxSizing: "border-box" },
  previewCardFront: { background: P.surface2, border: `1px solid ${P.surface3}`, transform: "translateX(-50%) rotate(-2deg)", top: 50, zIndex: 2, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" },
  previewCardBack: { background: P.surface1, border: `1px solid ${P.terracotta}30`, transform: "translateX(-50%) rotate(3deg)", top: 10, zIndex: 1, opacity: 0.8 },
  previewEmoji: { fontSize: 26, flexShrink: 0 },
  previewLabel: { fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: P.textPrimary, letterSpacing: "-0.3px", marginBottom: 3 },
  previewSub: { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: P.slateBlue },
  ctaWrap: { width: "100%", padding: "0 28px", marginTop: 8 },
  ctaBtn: { width: "100%", background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", border: "none", borderRadius: 18, padding: "18px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px", boxShadow: `0 8px 24px rgba(240, 115, 64, 0.35)` },
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
  backBtn: { background: "transparent", border: "none", color: P.slateBlue, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 32, fontFamily: "'DM Sans', sans-serif" },
  wordmark: { fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 900, letterSpacing: "-2px", color: P.textPrimary, marginBottom: 8, fontStyle: "italic" },
  subtitle: { fontSize: 16, color: P.slateBlue, fontFamily: "'DM Sans', sans-serif" },
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────

function renderAvatarContent(profile, user) {
  const av = profile?.avatar;
  if (av?.startsWith('emoji:')) return <span style={{ fontSize: 32 }}>{av.slice(6)}</span>;
  if (av?.startsWith('name:')) return <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.5px" }}>{av.slice(5).slice(0, 3).toUpperCase()}</span>;
  if (av?.startsWith('initials:')) return <span style={{ fontSize: 20, fontWeight: 900 }}>{av.slice(9).slice(0, 3).toUpperCase()}</span>;
  return <span style={{ fontSize: 26, fontWeight: 900 }}>{(profile?.display_name || user?.email || "?").slice(0, 2).toUpperCase()}</span>;
}

// ─── METRIC DEFINITIONS ───────────────────────────────────────────────────────

const METRIC_DEFS = [
  // Tier 1 — Personal
  { key: "trips",       label: "trips",       tier: "Personal" },
  { key: "cities",      label: "cities",      tier: "Personal" },
  { key: "thisyear",    label: "this year",   tier: "Personal" },
  { key: "nights",      label: "nights away", tier: "Personal" },
  { key: "people",      label: "people",      tier: "Personal" },
  { key: "countries",   label: "countries",   tier: "Personal" },
  // Tier 2 — Activity
  { key: "restaurants", label: "restaurants", tier: "Activity" },
  { key: "activities",  label: "activities",  tier: "Activity" },
  { key: "stays",       label: "stays",       tier: "Activity" },
  { key: "stops",       label: "stops",       tier: "Activity" },
  { key: "memories",    label: "memories",    tier: "Activity" },
  // Tier 3 — Vibes
  { key: "v_trip",        label: "✈️ flights",      tier: "Vibes", vibeEmoji: "✈️" },
  { key: "v_road",        label: "🚗 road trips",   tier: "Vibes", vibeEmoji: "🚗" },
  { key: "v_staycation",  label: "🏠 staycations",  tier: "Vibes", vibeEmoji: "🏠" },
  { key: "v_hike",        label: "🏔️ hikes",        tier: "Vibes", vibeEmoji: "🏔️" },
  { key: "v_camping",     label: "🏕️ camping",      tier: "Vibes", vibeEmoji: "🏕️" },
  { key: "v_concert",     label: "🎵 concerts",     tier: "Vibes", vibeEmoji: "🎵" },
  { key: "v_dinner",      label: "🍽️ dinners",      tier: "Vibes", vibeEmoji: "🍽️" },
  { key: "v_brunch",      label: "🥂 brunches",     tier: "Vibes", vibeEmoji: "🥂" },
  { key: "v_lunch",       label: "🥗 lunches",      tier: "Vibes", vibeEmoji: "🥗" },
  { key: "v_coffee",      label: "☕ coffee",       tier: "Vibes", vibeEmoji: "☕" },
  { key: "v_drinks",      label: "🍷 drinks",       tier: "Vibes", vibeEmoji: "🍷" },
  { key: "v_nightout",    label: "🎉 nights out",   tier: "Vibes", vibeEmoji: "🎉" },
  { key: "v_active",      label: "💪 workouts",     tier: "Vibes", vibeEmoji: "💪" },
  { key: "v_beach",       label: "🏖️ beach days",   tier: "Vibes", vibeEmoji: "🏖️" },
  { key: "v_celebration", label: "🎊 celebrations", tier: "Vibes", vibeEmoji: "🎊" },
  { key: "v_gameday",     label: "🏆 game days",    tier: "Vibes", vibeEmoji: "🏆" },
  { key: "v_getaway",     label: "🌅 getaways",     tier: "Vibes", vibeEmoji: "🌅" },
  { key: "v_meetup",      label: "📍 meetups",      tier: "Vibes", vibeEmoji: "📍" },
  // Tier 4 — Financial
  { key: "spent",       label: "total spent", tier: "Financial", prefix: "$" },
  { key: "expenses",    label: "expenses",    tier: "Financial" },
];

const DEFAULT_METRICS = ["trips", "cities", "thisyear"];

function computeMetric(key, { trips, itinItems, expenses, photos, members }) {
  const today = new Date(); today.setHours(0,0,0,0);
  switch (key) {
    case "trips":       return trips.length;
    case "cities":      return new Set(trips.map(t => (t.city || t.location || "").split(',')[0].trim().toLowerCase()).filter(Boolean)).size;
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
    case "countries":   return new Set(trips.map(t => { const loc = t.location || ""; const parts = loc.split(','); return parts[parts.length-1].trim().toLowerCase(); }).filter(Boolean)).size;
    case "restaurants": return itinItems.filter(i => i.type === "restaurant").length;
    case "activities":  return itinItems.filter(i => i.type === "activity").length;
    case "stays":       return itinItems.filter(i => i.type === "stay").length;
    case "stops":       return itinItems.length;
    case "memories":    return photos.length;
    case "spent":       return "$" + expenses.reduce((a, e) => a + (e.amount || 0), 0).toLocaleString();
    case "expenses":    return expenses.length;
    default: {
      // Vibe metrics — key format: v_{vibeKey}
      if (key.startsWith("v_")) {
        const vibeKey = key.slice(2);
        const vibeEmoji = METRIC_DEFS.find(m => m.key === key)?.vibeEmoji;
        return trips.filter(t => {
          const vibe = VIBES.find(v => v.key === vibeKey);
          return vibe && t.emoji === vibe.emoji;
        }).length;
      }
      return 0;
    }
  }
}

function ProfileScreen({ onOpen, user, onSignOut, onSettings, profile, onProfileUpdate }) {
  const [trips, setTrips] = useState([]);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [showMetricPicker, setShowMetricPicker] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  // Extra data for metric computation
  const [itinItems, setItinItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [members, setMembers] = useState([]);

  const metricPrefs = profile?.metric_prefs || DEFAULT_METRICS;

  useEffect(() => {
    const fetchAll = async () => {
      const { data: memberRows } = await supabase.from('trip_members').select('trip_id').eq('user_id', user.id);
      if (!memberRows?.length) { setTrips([]); return; }
      const tripIds = memberRows.map(r => r.trip_id);

      const [tripsRes, itinRes, expRes, photoRes, memberRes] = await Promise.all([
        supabase.from('trips').select('*').in('id', tripIds).is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('itinerary').select('type').in('trip_id', tripIds),
        supabase.from('expenses').select('amount').in('trip_id', tripIds),
        supabase.from('photos').select('id').in('trip_id', tripIds),
        supabase.from('members').select('name').in('trip_id', tripIds).neq('name', profile?.display_name || ''),
      ]);

      setTrips(tripsRes.data || []);
      setItinItems(itinRes.data || []);
      setExpenses(expRes.data || []);
      setPhotos(photoRes.data || []);
      setMembers(memberRes.data || []);
    };
    fetchAll();
  }, []);

  const handleDeleteTrip = async (trip) => {
    if (!window.confirm(`Delete "${trip.name}"? You can restore it from settings.`)) return;
    const { error } = await supabase.from('trips').update({ deleted_at: new Date().toISOString() }).eq('id', trip.id);
    if (error) { console.error(error); return; }
    setTrips(prev => prev.filter(t => t.id !== trip.id));
  };

  const metricData = { trips, itinItems, expenses, photos, members };

  return (
    <div style={S.screen}>
      <div style={S.profileHero}>
        {/* Horizontal: avatar left, name+year right */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ position: "relative", flexShrink: 0, cursor: "pointer" }} onClick={() => setShowAvatarEdit(true)}>
            <div style={{ ...S.profileAvatar, width: 60, height: 60, fontSize: 20 }}>{renderAvatarContent(profile, user)}</div>
            <div style={SP.avatarEditBadge}>✎</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...S.profileName, fontSize: 22, marginBottom: 2 }}>{profile?.display_name || user.email}</div>
            <div style={S.profileSub}>member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : "—"}</div>
          </div>
        </div>

        {/* Stats row — customizable */}
        <div style={{ position: "relative" }}>
          <div style={S.profileStats}>
            {metricPrefs.slice(0, 3).map((key, i) => {
              const def = METRIC_DEFS.find(m => m.key === key) || METRIC_DEFS[0];
              const val = computeMetric(key, metricData);
              return (
                <React.Fragment key={key}>
                  {i > 0 && <div style={S.statDiv} />}
                  <div style={S.statItem}>
                    <div style={S.statNum}>{val}</div>
                    <div style={S.statLbl}>{def.label}</div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {/* Gear icon to open picker */}
          <button onClick={() => setShowMetricPicker(true)}
            style={{ position: "absolute", top: -8, right: -8, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>
            ⚙
          </button>
        </div>
      </div>

      {showAvatarEdit && (
        <AvatarEditSheet profile={profile} user={user}
          onClose={() => setShowAvatarEdit(false)}
          onSave={(updated) => { onProfileUpdate?.(updated); setShowAvatarEdit(false); }} />
      )}
      {editingTrip && (
        <EditTripModal trip={editingTrip} onClose={() => setEditingTrip(null)}
          onSave={(updated) => { setTrips(prev => prev.map(t => t.id === updated.id ? updated : t)); setEditingTrip(null); }} />
      )}
      {showMetricPicker && (
        <MetricPickerSheet
          current={metricPrefs}
          userId={user.id}
          onClose={() => setShowMetricPicker(false)}
          onSave={(updated) => { onProfileUpdate?.({ ...profile, metric_prefs: updated }); setShowMetricPicker(false); }} />
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
        <button style={S.ghostBtn} onClick={onSettings}>⚙️ Settings</button>
        <button style={S.ghostBtn} onClick={onSignOut}>Sign out</button>
      </div>

      <div style={{ padding: "0 22px 40px" }}>
        <div style={S.sectionRow}>
          <div style={S.sectionLabel}>YOUR TRIPS</div>
          {selecting
            ? <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.ghostBtn, fontSize: 12 }} onClick={() => { setSelecting(false); setSelectedIds([]); }}>Cancel</button>
                {selectedIds.length > 0 && (
                  <button style={{ ...S.ghostBtn, fontSize: 12, color: P.danger, borderColor: P.danger + "40" }}
                    onClick={async () => {
                      for (const id of selectedIds) {
                        await supabase.from('trips').update({ deleted_at: new Date().toISOString() }).eq('id', id);
                      }
                      setTrips(prev => prev.filter(t => !selectedIds.includes(t.id)));
                      setSelectedIds([]); setSelecting(false);
                    }}>Delete ({selectedIds.length})</button>
                )}
              </div>
            : <button style={S.newBtn} onClick={() => setShowNewTrip(true)}>+ New</button>
          }
        </div>
        {selecting && (
          <div style={{ fontSize: 12, color: P.textMuted, textAlign: "center", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
            Hold to select · Tap to toggle · Delete when ready
          </div>
        )}
        {showNewTrip && (
          <NewTripModal onClose={() => setShowNewTrip(false)} userId={user.id} userProfile={profile}
            onSave={(trip) => { setTrips(prev => [trip, ...prev]); setShowNewTrip(false); }} />
        )}
        {trips.length === 0 && !showNewTrip && <EmptyTripsState onNew={() => setShowNewTrip(true)} />}
        {trips.map((t) => (
          <TripCard key={t.id} trip={t} onOpen={onOpen}
            onDelete={handleDeleteTrip} onEdit={setEditingTrip}
            selecting={selecting} selected={selectedIds.includes(t.id)}
            onLongPress={() => { setSelecting(true); setSelectedIds([t.id]); }}
            onToggleSelect={() => setSelectedIds(prev =>
              prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])} />
        ))}
      </div>
    </div>
  );
}

// ─── METRIC PICKER SHEET ──────────────────────────────────────────────────────

function MetricPickerSheet({ current, userId, onClose, onSave }) {
  const [selected, setSelected] = useState(current || DEFAULT_METRICS);
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    if (selected.includes(key)) {
      setSelected(prev => prev.filter(k => k !== key));
    } else {
      if (selected.length >= 3) {
        // Replace the last one
        setSelected(prev => [...prev.slice(0, 2), key]);
      } else {
        setSelected(prev => [...prev, key]);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const prefs = selected.slice(0, 3);
    const { data, error } = await supabase.from('profiles')
      .update({ metric_prefs: prefs }).eq('id', userId).select().single();
    if (!error) onSave(prefs);
    setSaving(false);
  };

  const tiers = ["Personal", "Activity", "Vibes", "Financial"];

  return (
    <div style={S.overlay}>
      <div style={{ ...S.sheet, maxHeight: "85%" }}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Customize Stats</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "0 22px 8px" }}>
          <div style={{ fontSize: 13, color: P.slateBlue, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
            Pick 3 stats to show on your profile. Tap to swap the last selected.
          </div>

          {/* Selected preview */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[0,1,2].map(i => {
              const key = selected[i];
              const def = key ? METRIC_DEFS.find(m => m.key === key) : null;
              return (
                <div key={i} style={{ flex: 1, background: def ? P.terracotta + "18" : P.surface2, border: `1px solid ${def ? P.terracotta + "60" : P.surface3}`, borderRadius: 12, padding: "10px 8px", textAlign: "center", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: def ? P.terracotta : P.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                    {def ? def.label : `slot ${i+1}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grouped options */}
          {tiers.map(tier => (
            <div key={tier} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: P.textMuted, letterSpacing: "2px", marginBottom: 10 }}>{tier.toUpperCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {METRIC_DEFS.filter(m => m.tier === tier).map(m => {
                  const isOn = selected.includes(m.key);
                  return (
                    <button key={m.key} onClick={() => toggle(m.key)}
                      style={{ background: isOn ? P.terracotta + "18" : P.surface2, border: `1px solid ${isOn ? P.terracotta : P.surface3}`, borderRadius: 22, padding: "8px 14px", fontSize: 13, fontWeight: 700, color: isOn ? P.terracotta : P.textMuted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 22px 24px" }}>
          <button style={{ ...S.primaryBtn, background: saving ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }}
            onClick={handleSave} disabled={saving || selected.length === 0}>
            {saving ? "Saving..." : "Save Stats"}
          </button>
        </div>
      </div>
    </div>
  );
}

const SP = {
  avatarEditBadge: { position: "absolute", bottom: 0, right: 0, background: P.surface2, border: `2px solid ${P.phoneBg}`, borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: P.textSecondary, cursor: "pointer" },
};

function AvatarEditSheet({ profile, user, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarVal, setAvatarVal] = useState(() => {
    const av = profile?.avatar;
    if (av?.startsWith('emoji:')) return av.slice(6);
    if (av?.startsWith('initials:')) return av.slice(9);
    if (av?.startsWith('name:')) return av.slice(5);
    return (profile?.display_name || user?.email || "").slice(0, 2).toUpperCase();
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const avatarStr = avatarVal.trim() ? `initials:${avatarVal.trim().slice(0,5)}` : null;
    const { data, error } = await supabase.from('profiles')
      .update({ display_name: displayName, avatar: avatarStr })
      .eq('id', user.id).select().single();
    if (!error) onSave(data);
    setSaving(false);
  };

  const previewContent = avatarVal.trim().slice(0, 5) || "?";

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Edit Profile</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ ...S.profileAvatar, width: 84, height: 84 }}>
              <span style={{ fontSize: previewContent.length === 1 ? 36 : 22, fontWeight: 900, letterSpacing: previewContent.length > 1 ? "-1px" : 0 }}>{previewContent}</span>
            </div>
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DISPLAY NAME</div>
            <input style={S.input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>AVATAR — EMOJI OR INITIALS (UP TO 5)</div>
            <input style={{ ...S.input, fontSize: 22, textAlign: "center", letterSpacing: "2px" }} value={avatarVal} maxLength={5} onChange={e => setAvatarVal(e.target.value)} placeholder="🌊 or IVJ" />
            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8 }}>Paste an emoji, type initials, or anything up to 5 characters</div>
          </div>
          <button style={{ ...S.primaryBtn, background: saving ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyTripsState({ onNew }) {
  return (
    <div style={SE.wrap}>
      <div style={SE.iconRow}><span style={SE.icon}>✈️</span><span style={SE.icon}>☕</span><span style={SE.icon}>🎉</span></div>
      <div style={SE.headline}>Nothing planned yet</div>
      <div style={SE.sub}>Your next trip, dinner, or night out starts here.</div>
      <button style={SE.btn} onClick={onNew}>Plan something →</button>
    </div>
  );
}

const SE = {
  wrap: { background: P.surface1, border: `1px dashed ${P.surface3}`, borderRadius: 24, padding: "40px 28px", textAlign: "center", marginTop: 8 },
  iconRow: { display: "flex", justifyContent: "center", gap: 12, fontSize: 28, marginBottom: 18 },
  icon: {},
  headline: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: P.textPrimary, letterSpacing: "-0.5px", marginBottom: 8 },
  sub: { fontSize: 14, color: P.slateBlue, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, marginBottom: 24 },
  btn: { background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", border: "none", borderRadius: 14, padding: "13px 24px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.2px" },
};

function TripCard({ trip, onOpen, onDelete, onEdit, selecting, selected, onLongPress, onToggleSelect }) {
  const IconComp = TRIP_ICONS[trip.emoji] || Plane;
  const showTime = trip.time && !trip.dates?.includes('–');
  const formatTime12 = (t) => {
    if (!t) return "";
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}:${String(m).padStart(2,'0')}${ampm}`;
  };
  const longPressTimer = useRef(null);

  const handlePressStart = () => { longPressTimer.current = setTimeout(() => { onLongPress?.(); }, 500); };
  const handlePressEnd = () => { clearTimeout(longPressTimer.current); };
  const handleTap = () => { if (selecting) { onToggleSelect?.(); } else { onOpen(trip); } };

  return (
    <div style={{ ...S.tripCard, opacity: selected ? 0.75 : 1, transition: "opacity 0.15s", outline: selected ? `2px solid ${P.terracotta}` : "none" }}
      onClick={handleTap} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd} onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}>
      {selecting && (
        <div style={{ position: "absolute", top: 14, right: 14, zIndex: 10, ...SI.checkbox, ...(selected ? SI.checkboxOn : {}) }}>
          {selected && <span style={{ fontSize: 11, color: "#fff", fontWeight: 800 }}>✓</span>}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ ...S.tcIconWrap, background: P.terracotta + "20", border: `1px solid ${P.terracotta}30`, flexShrink: 0 }}>
          <IconComp size={24} color={P.terracotta} strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.tcName}>{trip.name}</div>
          <div style={S.tcLocation}>{trip.location}</div>
          <div style={{ fontSize: 12, color: P.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            {trip.dates}{showTime ? ` · ${formatTime12(trip.time)}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          {trip.settled && <span style={S.settledBadge}>SETTLED</span>}
          <ChevronRight size={18} color={P.terracotta + "80"} />
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRMATION MODAL ───────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "Confirm", danger = false }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <div style={{ background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 20, padding: "24px 22px", width: "100%" }}>
        <div style={{ fontSize: 15, color: P.textPrimary, fontWeight: 600, marginBottom: 20, lineHeight: 1.5, textAlign: "center" }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.secondaryBtn, flex: 1 }} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.primaryBtn, flex: 1, background: danger ? P.danger : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── SETTLEMENT CALCULATOR (shared utility) ───────────────────────────────────

function calcSettlements(expenses) {
  const balances = {};
  expenses.forEach(exp => {
    const paidBy = exp.paid_by;
    const splitWith = exp.split_with || [];
    if (!splitWith.length) return;
    const share = exp.amount / splitWith.length;
    if (!balances[paidBy]) balances[paidBy] = 0;
    balances[paidBy] += exp.amount;
    splitWith.forEach(person => { if (!balances[person]) balances[person] = 0; balances[person] -= share; });
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
      remaining -= payment; creditor.amount -= payment;
    });
  });
  return settlements;
}

// ─── TRIP SHELL ───────────────────────────────────────────────────────────────

function TripShell({ trip, activeTab, setActiveTab, onBack, onModal, itinRefresh, modal, setModal, user, profile, onItinRefresh, onTripUpdate }) {
  const [expenses, setExpenses] = useState([]);
  const [editingTrip, setEditingTrip] = useState(false);
  const myName = profile?.display_name || user?.email?.split('@')[0] || 'Me';
  const IconComp = TRIP_ICONS[trip.emoji] || Plane;
  const settlements = calcSettlements(expenses);
  const nameFontSize = (trip.name?.length || 0) > 22 ? 15 : (trip.name?.length || 0) > 16 ? 17 : 19;

  useEffect(() => {
    const fetch = async () => { const { data } = await supabase.from('expenses').select('*').eq('trip_id', trip.id).order('created_at', { ascending: false }); setExpenses(data || []); };
    fetch();
    const sub = supabase.channel(`shell-expenses:${trip.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetch).subscribe();
    return () => sub.unsubscribe();
  }, [trip.id, itinRefresh]);

  const tabs = [
    { id: "itinerary", label: "Itinerary", Icon: Calendar },
    { id: "expenses",  label: "Expenses",  Icon: DollarSign },
    { id: "uploads",   label: "Uploads",   Icon: Image },
    { id: "members",   label: "Members",   Icon: Users },
    { id: "summary",   label: "Summary",   Icon: BarChart2 },
  ];

  return (
    <div style={S.tripShell}>
      {editingTrip && (
        <EditTripModal trip={trip} onClose={() => setEditingTrip(false)}
          onSave={(updated) => { onTripUpdate?.(updated); setEditingTrip(false); }} />
      )}
      {/* Header — 3 rows */}
      <div style={{ background: P.surface1, borderBottom: `1px solid ${P.surface3}`, flexShrink: 0 }}>
        {/* Row 1: back · icon · share */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 6px" }}>
          <button style={S.backBtn} onClick={() => { setModal(null); onBack(); }}>←</button>
          <div style={{ ...S.thIconWrap, background: P.terracotta + "20" }}>
            <IconComp size={20} color={P.terracotta} strokeWidth={1.5} />
          </div>
          <button style={{ ...S.shareHeaderBtn, color: P.terracotta }} onClick={() => onModal("share")}>↗ Share</button>
        </div>
        {/* Row 2: trip name — tappable */}
        <div style={{ textAlign: "center", padding: "0 56px", cursor: "pointer" }} onClick={() => setEditingTrip(true)}>
          <div style={{ fontSize: nameFontSize, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", whiteSpace: "nowrap", overflow: "hidden" }}>{trip.name}</div>
        </div>
        {/* Row 3: location · dates */}
        <div style={{ textAlign: "center", fontSize: 12, color: P.textSecondary, padding: "3px 22px 12px", lineHeight: 1.4 }}>
          {trip.location}{trip.dates ? ` · ${trip.dates}` : ""}
        </div>
      </div>

      <div style={{ ...S.tabContent, position: "relative" }}>
        {activeTab === "itinerary" && <ItineraryTab trip={trip} onModal={onModal} refreshKey={itinRefresh} />}
        {activeTab === "expenses"  && <ExpensesTab  trip={trip} onModal={onModal} expRefresh={itinRefresh} profile={profile} user={user} expenses={expenses} settlements={settlements} myName={myName} />}
        {activeTab === "uploads"   && <UploadsTab trip={trip} user={user} profile={profile} />}
        {activeTab === "members"   && <MembersTab trip={trip} profile={profile} expenses={expenses} />}
        {activeTab === "summary"   && <SummaryTab trip={trip} settlements={settlements} myName={myName} expenses={expenses} />}
        {modal === "addExpense"    && <AddExpenseModal trip={trip} user={user} profile={profile} onClose={() => setModal(null)} onAdd={onItinRefresh} />}
        {modal === "addItinerary"  && <AddItinModal trip={trip} onClose={() => setModal(null)} onAdd={() => { setModal(null); onItinRefresh(); setTimeout(onItinRefresh, 100); }} />}
        {modal === "settle"        && <SettleModal settlements={settlements} myName={myName} trip={trip} onClose={() => setModal(null)} />}
        {modal === "share"         && <ShareModal trip={trip} onClose={() => setModal(null)} />}
      </div>

      <div style={S.tabBar}>
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} style={S.tabBtn} onClick={() => { setActiveTab(id); setModal(null); }}>
            <Icon size={24} color={activeTab === id ? P.terracotta : P.textMuted} strokeWidth={activeTab === id ? 2 : 1.5} />
            <span style={{ ...S.tabLabel, ...(activeTab === id ? { color: P.terracotta } : {}) }}>{label}</span>
            {activeTab === id && <div style={{ ...S.tabDot, background: P.terracotta }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ITINERARY TAB ────────────────────────────────────────────────────────────

const formatDayLabel = (dateStr) => {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d)) return dateStr;
  const day = d.toLocaleDateString('en-US', { weekday: 'long' });
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${day} · ${date}`;
};

function ItineraryTab({ trip, onModal, refreshKey }) {
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const longPressTimers = useRef({});

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    for (const id of selectedIds) { await supabase.from('itinerary').delete().eq('id', id); }
    setItems(prev => prev.filter(i => !selectedIds.includes(i.id)));
    setSelectedIds([]); setSelecting(false); setConfirmDelete(false);
  };

  const handleLongPressStart = (id) => { longPressTimers.current[id] = setTimeout(() => { setSelecting(true); setSelectedIds([id]); }, 500); };
  const handleLongPressEnd = (id) => { clearTimeout(longPressTimers.current[id]); };
  const handleItemTap = (item) => { if (selecting) { setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]); } else { setEditingItem(item); } };
  const cancelSelection = () => { setSelecting(false); setSelectedIds([]); };

  useEffect(() => {
    const fetchItinerary = async () => {
      const { data, error } = await supabase.from('itinerary').select('*')
        .eq('trip_id', trip.id).order('day', { ascending: true }).order('time', { ascending: true });
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
      {confirmDelete && <ConfirmModal message={`Delete ${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''}?`} onConfirm={handleDeleteSelected} onCancel={() => setConfirmDelete(false)} confirmLabel="Delete" danger />}
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Itinerary</div>
        {selecting
          ? <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.actionBtn, color: P.slateBlue }} onClick={cancelSelection}>Cancel</button>
              {selectedIds.length > 0 && (
                <button style={{ ...S.actionBtn, borderColor: P.danger + "60", color: P.danger }} onClick={() => setConfirmDelete(true)}>Delete ({selectedIds.length})</button>
              )}
            </div>
          : <button style={S.newBtn} onClick={() => onModal("addItinerary")}>+ Add</button>
        }
      </div>
      {selecting && <div style={SI.selectHint}>Long press to select · Tap to toggle · Delete when ready</div>}
      {items.length === 0 && (
        <div style={SI.emptyState}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
          <div style={SI.emptyTitle}>No stops yet</div>
          <div style={SI.emptySub}>Tap + Add to start building your itinerary</div>
        </div>
      )}
      {days.map(day => (
        <div key={day} style={S.dayBlock}>
          <div style={SI.dayLabel}>{formatDayLabel(day)}</div>
          {items.filter(i => i.day === day).map(item => {
            const meta = ITINERARY_COLORS[item.type] || ITINERARY_COLORS.activity;
            const hasEmojiIcon = item.icon && item.icon.length <= 4 && item.icon !== "🎯";
            const TypeIcon = ITIN_TYPE_ICONS[item.type] || Zap;
            const isSelected = selectedIds.includes(item.id);
            const hasLocation = item.type === "stay" || item.type === "restaurant" || item.type === "activity";
            const formatTime12 = (t) => {
              if (!t) return "—";
              const [h, m] = t.split(':').map(Number);
              if (isNaN(h)) return t;
              const ampm = h >= 12 ? 'pm' : 'am';
              return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`;
            };
            return (
              <div key={item.id}
                style={{ ...SI.item, borderLeftColor: meta.accent, ...(isSelected ? SI.itemSelected : {}) }}
                onClick={() => handleItemTap(item)}
                onTouchStart={() => handleLongPressStart(item.id)} onTouchEnd={() => handleLongPressEnd(item.id)}
                onMouseDown={() => handleLongPressStart(item.id)} onMouseUp={() => handleLongPressEnd(item.id)} onMouseLeave={() => handleLongPressEnd(item.id)}>
                <div style={SI.timeCol}><span style={SI.time}>{formatTime12(item.time)}</span></div>
                <div style={SI.content}>
                  <div style={SI.titleRow}>
                    {hasEmojiIcon ? <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span> : <TypeIcon size={16} color={meta.accent} strokeWidth={2} style={{ flexShrink: 0 }} />}
                    <span style={SI.title}>{item.title}</span>
                    {hasLocation && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(item.title + " " + (item.detail || ""))}`}
                        target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={SI.mapsLink}>
                        <MapPin size={11} /> Maps
                      </a>
                    )}
                  </div>
                  {item.detail ? <div style={SI.detail}>{item.detail}</div> : null}
                </div>
                {selecting && (
                  <div style={{ ...SI.checkbox, ...(isSelected ? SI.checkboxOn : {}) }}>
                    {isSelected && <span style={{ fontSize: 11, color: "#fff", fontWeight: 800 }}>✓</span>}
                  </div>
                )}
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

const SI = {
  dayLabel: { fontSize: 12, fontWeight: 800, color: P.slateBlue, letterSpacing: "0.5px", marginBottom: 10, marginTop: 4, fontFamily: "'DM Sans', sans-serif" },
  selectHint: { fontSize: 12, color: P.textMuted, textAlign: "center", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" },
  item: { display: "flex", alignItems: "flex-start", gap: 14, background: P.surface1, borderRadius: 14, borderLeft: `3px solid transparent`, padding: "14px 14px 14px 16px", marginBottom: 10, cursor: "pointer", border: `1px solid ${P.surface3}`, borderLeftWidth: 3, userSelect: "none", transition: "background 0.15s" },
  itemSelected: { background: P.surface2, borderColor: P.terracotta + "40" },
  timeCol: { flexShrink: 0, width: 52, paddingTop: 2 },
  time: { fontSize: 14, color: P.textSecondary, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  content: { flex: 1, minWidth: 0 },
  titleRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "nowrap" },
  title: { fontSize: 16, fontWeight: 700, color: P.textPrimary, letterSpacing: "-0.3px", fontFamily: "'Syne', sans-serif", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  mapsLink: { color: P.lightBlue, fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 2 },
  detail: { fontSize: 13, color: P.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 },
  checkbox: { width: 22, height: 22, borderRadius: "50%", border: `2px solid ${P.surface3}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  checkboxOn: { background: P.terracotta, border: `2px solid ${P.terracotta}` },
  emptyState: { textAlign: "center", padding: "48px 24px", background: P.surface1, borderRadius: 18, border: `1px dashed ${P.surface3}`, marginTop: 8 },
  emptyTitle: { fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: P.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 13, color: P.slateBlue, fontFamily: "'DM Sans', sans-serif" },
};

// ─── EXPENSES TAB ─────────────────────────────────────────────────────────────

function ExpensesTab({ trip, onModal, expRefresh, profile, user, expenses, settlements, myName }) {
  const [filter, setFilter] = useState("All");
  const [editingExpense, setEditingExpense] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const cats = ["All","Dining","Drinks","Stay","Activity","Shopping","Travel","Other"];

  useEffect(() => {
    supabase.from('members').select('id').eq('trip_id', trip.id).then(({ data }) => setMemberCount(data?.length || 0));
  }, [trip.id]);

  const filtered = filter === "All" ? expenses : expenses.filter(e => e.category === filter);
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const myOwed = settlements.filter(s => s.from === myName).reduce((a, s) => a + s.amount, 0);

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Expenses</div>
        <div style={{ display: "flex", gap: 8 }}>
          {settlements.length > 0 && (
            <button style={{ ...S.actionBtn, borderColor: P.lightBlue+"60", color: P.lightBlue }} onClick={() => onModal("settle")}>⚖️ Settle</button>
          )}
          <button style={S.newBtn} onClick={() => onModal("addExpense")}>+ Add</button>
        </div>
      </div>
      <div style={S.expSummary}>
        <div style={S.expSumItem}><div style={S.expSumVal}>${total.toLocaleString()}</div><div style={S.expSumLbl}>total spent</div></div>
        <div style={S.expSumDiv} />
        <div style={S.expSumItem}><div style={S.expSumVal}>{memberCount}</div><div style={S.expSumLbl}>travelers</div></div>
        <div style={S.expSumDiv} />
        <div style={S.expSumItem}>
          {myOwed > 0 ? <div style={{ ...S.expSumVal, color: P.danger }}>${myOwed}</div> : <div style={{ ...S.expSumVal, color: P.success }}>Even</div>}
          <div style={S.expSumLbl}>you owe</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {cats.map(c => {
          const meta = CATEGORY_META[c];
          const CIcon = CAT_ICONS[c] || DollarSign;
          const selected = filter === c;
          return (
            <button key={c} onClick={() => setFilter(c)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 10px", borderRadius: 12, cursor: "pointer", minHeight: 50, minWidth: 56, flexShrink: 0, background: selected ? (c === "All" ? P.terracotta+"18" : meta?.bg || P.surface2) : P.surface1, border: selected ? `1px solid ${c === "All" ? P.terracotta : meta?.color || P.terracotta}` : `1px solid ${P.surface3}` }}>
              {c === "All" ? <DollarSign size={15} color={selected ? P.terracotta : P.textMuted} strokeWidth={1.5} /> : <CIcon size={15} color={selected ? meta?.color : P.textMuted} strokeWidth={1.5} />}
              <span style={{ fontSize: 9, fontWeight: 700, color: selected ? (c === "All" ? P.terracotta : meta?.color) : P.textMuted, textTransform: "capitalize", letterSpacing: "0.3px" }}>{c}</span>
            </button>
          );
        })}
      </div>
      {filtered.map(exp => {
        const meta = CATEGORY_META[exp.category];
        const splitWith = exp.split_with || exp.splitWith || [];
        const perPerson = splitWith.length ? (exp.amount / splitWith.length).toFixed(0) : exp.amount;
        const CatIcon = CAT_ICONS[exp.category] || DollarSign;
        return (
          <div key={exp.id}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 8, background: P.surface1, borderRadius: 14, borderLeft: `3px solid ${meta?.color || P.terracotta}`, cursor: "pointer" }}
            onClick={() => setEditingExpense(exp)}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: meta?.bg || P.surface2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CatIcon size={16} color={meta?.color || P.terracotta} strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: P.textPrimary, marginBottom: 2 }}>{exp.title}</div>
              <div style={{ fontSize: 12, color: P.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                ${perPerson}/person{splitWith.length > 1 ? ` · ${splitWith.length} people` : ""}
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", flexShrink: 0 }}>${exp.amount}</div>
          </div>
        );
      })}
      <div style={{ height: 20 }} />
      {editingExpense && (
        <AddExpenseModal trip={trip} user={user} profile={profile}
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
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const fileInputRef = useRef(null);
  const longPressTimers = useRef({});

  useEffect(() => {
    fetchPhotos();
    const subscription = supabase.channel(`photos:${trip.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => fetchPhotos())
      .subscribe();
    return () => subscription.unsubscribe();
  }, [trip.id]);

  const fetchPhotos = async () => {
    const { data, error } = await supabase.from('photos').select('*').eq('trip_id', trip.id).order('created_at', { ascending: false });
    if (error) console.error(error);
    else setPhotos(data || []);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const validExts = ['jpg','jpeg','png','gif','webp','heic','heif'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExts.includes(ext)) { alert('Please upload an image file (jpg, png, gif, webp, heic)'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${trip.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('trip-photos').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('trip-photos').getPublicUrl(path);
      const uploader = profile?.display_name || user?.email?.split('@')[0] || 'Me';
      const { error: dbError } = await supabase.from('photos').insert([{ trip_id: trip.id, user_id: user?.id, storage_path: path, url: publicUrl, caption: file.name.split('.')[0], uploader, sensitive: false }]);
      if (dbError) throw dbError;
      await fetchPhotos();
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const toggleSensitive = async (photo) => {
    const { error } = await supabase.from('photos').update({ sensitive: !photo.sensitive }).eq('id', photo.id);
    if (!error) setPhotos(p => p.map(ph => ph.id === photo.id ? { ...ph, sensitive: !ph.sensitive } : ph));
  };

  const [confirmDeletePhotos, setConfirmDeletePhotos] = useState(false);

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      const ph = photos.find(p => p.id === id);
      if (ph) {
        await supabase.storage.from('trip-photos').remove([ph.storage_path]);
        await supabase.from('photos').delete().eq('id', id);
      }
    }
    setPhotos(p => p.filter(ph => !selectedIds.includes(ph.id)));
    setSelectedIds([]); setSelecting(false); setConfirmDeletePhotos(false);
  };

  const handleMarkSensitiveSelected = async () => {
    for (const id of selectedIds) {
      const ph = photos.find(p => p.id === id);
      if (ph) await supabase.from('photos').update({ sensitive: !ph.sensitive }).eq('id', id);
    }
    await fetchPhotos();
    setSelectedIds([]); setSelecting(false);
  };

  const handleLongPressStart = (id) => {
    longPressTimers.current[id] = setTimeout(() => { setSelecting(true); setSelectedIds([id]); }, 500);
  };
  const handleLongPressEnd = (id) => { clearTimeout(longPressTimers.current[id]); };

  const handleTap = (ph) => {
    if (selecting) {
      setSelectedIds(prev => prev.includes(ph.id) ? prev.filter(x => x !== ph.id) : [...prev, ph.id]);
    } else {
      setPreviewPhoto(ph);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); };

  return (
    <div style={S.tabScroll}>
      {confirmDeletePhotos && <ConfirmModal message={`Remove ${selectedIds.length} photo${selectedIds.length > 1 ? 's' : ''}?`} onConfirm={handleDeleteSelected} onCancel={() => setConfirmDeletePhotos(false)} confirmLabel="Remove" danger />}
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Memories</div>
        {selecting
          ? <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.actionBtn, color: P.slateBlue }} onClick={() => { setSelecting(false); setSelectedIds([]); }}>Cancel</button>
              {selectedIds.length > 0 && <>
                <button style={{ ...S.actionBtn, borderColor: P.terracotta + "60", color: P.terracotta }} onClick={handleMarkSensitiveSelected}>🔒</button>
                <button style={{ ...S.actionBtn, borderColor: P.danger + "60", color: P.danger }} onClick={() => setConfirmDeletePhotos(true)}>Remove</button>
              </>}
            </div>
          : <button style={S.newBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading..." : "+ Upload"}
            </button>
        }
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleUpload(e.target.files[0])} />

      {/* Subtle hint */}
      <div style={{ fontSize: 12, color: P.textMuted, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
        Tap to preview · Hold to select · 🔒 = sensitive
      </div>

      {photos.length === 0 && !uploading && (
        <div style={{ ...S.uploadDrop, marginBottom: 16 }} onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
          <div style={S.uploadIcon}>📎</div>
          <div style={S.uploadText}>Drop your first photo here</div>
          <div style={S.uploadSub}>Tap to browse or drag and drop</div>
        </div>
      )}

      {/* 4-column tile grid */}
      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 16 }}>
          {photos.map(ph => {
            const isSelected = selectedIds.includes(ph.id);
            return (
              <div key={ph.id}
                style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", cursor: "pointer", opacity: ph.sensitive ? 0.5 : 1, outline: isSelected ? `2px solid ${P.terracotta}` : "none", transition: "opacity 0.15s" }}
                onClick={() => handleTap(ph)}
                onTouchStart={() => handleLongPressStart(ph.id)} onTouchEnd={() => handleLongPressEnd(ph.id)}
                onMouseDown={() => handleLongPressStart(ph.id)} onMouseUp={() => handleLongPressEnd(ph.id)} onMouseLeave={() => handleLongPressEnd(ph.id)}>
                <img src={ph.url} alt={ph.caption} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {ph.sensitive && <div style={{ position: "absolute", top: 4, right: 4, fontSize: 10 }}>🔒</div>}
                {isSelected && (
                  <div style={{ position: "absolute", inset: 0, background: P.terracotta + "30", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: P.terracotta, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, color: "#fff", fontWeight: 800 }}>✓</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {photos.length > 0 && !selecting && (
        <div style={{ ...S.uploadDrop, marginBottom: 16 }} onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
          <div style={S.uploadIcon}>📎</div>
          <div style={S.uploadText}>Add more</div>
          <div style={S.uploadSub}>Photos, receipts, anything</div>
        </div>
      )}

      <div style={{ height: 20 }} />

      {/* Full-screen photo preview */}
      {previewPhoto && (
        <div style={{ position: "absolute", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column" }}
          onClick={() => setPreviewPhoto(null)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 12px", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: P.textPrimary }}>{previewPhoto.caption}</div>
              <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>by {previewPhoto.uploader}</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={e => { e.stopPropagation(); toggleSensitive(previewPhoto); setPreviewPhoto(p => ({ ...p, sensitive: !p.sensitive })); }}
                style={{ background: previewPhoto.sensitive ? "#2a1810" : P.surface2, border: "none", color: previewPhoto.sensitive ? P.terracotta : P.textMuted, borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {previewPhoto.sensitive ? "🔒 Sensitive" : "Mark 🔒"}
              </button>
              <button onClick={e => { e.stopPropagation(); const a = document.createElement('a'); a.href = previewPhoto.url; a.download = previewPhoto.caption || 'photo'; a.target = '_blank'; a.click(); }}
                style={{ background: P.surface2, border: "none", color: P.lightBlue, borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Download size={12} /> Save
              </button>
              <button style={S.closeBtn} onClick={() => setPreviewPhoto(null)}>✕</button>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px" }}>
            <img src={previewPhoto.url} alt={previewPhoto.caption}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 12 }}
              onClick={e => e.stopPropagation()} />
          </div>
          <div style={{ height: 32 }} />
        </div>
      )}
    </div>
  );
}

// ─── MEMBERS TAB ──────────────────────────────────────────────────────────────

function MembersTab({ trip, profile, expenses }) {
  const [members, setMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [showInvite, setShowInvite] = useState(false);
  const [newName, setNewName] = useState("");
  const myName = profile?.display_name || "";

  // Compute per-member net balance from expenses
  const memberBalances = {};
  expenses.forEach(exp => {
    const paidBy = exp.paid_by;
    const splitWith = exp.split_with || [];
    if (!splitWith.length) return;
    const share = exp.amount / splitWith.length;
    if (!memberBalances[paidBy]) memberBalances[paidBy] = 0;
    memberBalances[paidBy] += exp.amount;
    splitWith.forEach(p => { if (!memberBalances[p]) memberBalances[p] = 0; memberBalances[p] -= share; });
  });

  const getBalanceLabel = (name) => {
    const bal = memberBalances[name];
    if (!bal || Math.abs(bal) < 0.5) return { text: "even", color: P.textMuted };
    if (bal > 0) return { text: `owed $${Math.round(bal)}`, color: P.success };
    return { text: `owes $${Math.round(Math.abs(bal))}`, color: P.danger };
  };

  useEffect(() => {
    const fetchMembers = async () => {
      const [{ data: memberRows }, { data: tmRows }] = await Promise.all([
        supabase.from('members').select('*').eq('trip_id', trip.id),
        supabase.from('trip_members').select('user_id, invited_email').eq('trip_id', trip.id),
      ]);

      setMembers(memberRows || []);

      const userIds = (tmRows || []).map(r => r.user_id).filter(Boolean);
      if (!userIds.length) return;

      const { data: profileRows } = await supabase
        .from('profiles').select('id, display_name, avatar').in('id', userIds);

      // Build nameMap keyed by lowercase display_name and email prefix
      const nameMap = {};
      (profileRows || []).forEach(p => {
        const entry = { display_name: p.display_name, avatar: p.avatar };
        if (p.display_name) nameMap[p.display_name.toLowerCase()] = entry;
        // Also map email prefix → profile for fallback matching
        const tm = (tmRows || []).find(r => r.user_id === p.id);
        if (tm?.invited_email) {
          nameMap[tm.invited_email.split('@')[0].toLowerCase()] = entry;
        }
      });

      setMemberProfiles(nameMap);
    };
    fetchMembers();
  }, [trip.id]);

  const avatarColors = [P.terracotta, P.lightBlue, P.orange, P.slateBlue, P.success];

  // Derive avatar display from profile avatar field or fall back to initials
  const getAvatarContent = (memberName) => {
    const p = memberProfiles[memberName.toLowerCase()];
    if (p?.avatar) {
      const av = p.avatar;
      if (av.startsWith('emoji:')) return { content: av.slice(6), isEmoji: true };
      if (av.startsWith('initials:')) return { content: av.slice(9).slice(0,3).toUpperCase(), isEmoji: false };
      if (av.startsWith('name:')) return { content: av.slice(5).slice(0,3).toUpperCase(), isEmoji: false };
    }
    // Fallback: initials from name
    const parts = memberName.trim().split(/\s+/);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
      : memberName.slice(0,2).toUpperCase();
    return { content: initials, isEmoji: false };
  };

  // Get real display name from profile map if available
  const getDisplayName = (memberName) => {
    const p = memberProfiles[memberName.toLowerCase()];
    return p?.display_name || memberName;
  };

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Members</div>
        <button style={S.newBtn} onClick={() => setShowInvite(true)}>+ Invite</button>
      </div>
      {showInvite && (
        <div style={{ background: P.surface1, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${P.surface3}` }}>
          <div style={S.fieldLbl}>INVITE BY EMAIL</div>
          <input style={S.input} placeholder="friend@email.com" value={newName} onChange={e => setNewName(e.target.value)} type="email" />
          <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8, marginBottom: 12 }}>They'll see this trip when they sign in.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.secondaryBtn} onClick={() => setShowInvite(false)}>Cancel</button>
            <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={async () => {
              if (!newName) return;
              const email = newName.trim().toLowerCase();
              const { data: existingUser } = await supabase.rpc('get_user_id_by_email', { email_input: email });
              const linkedUserId = existingUser?.[0]?.id || null;
              const { error: tmError } = await supabase.from('trip_members').insert([{ trip_id: trip.id, user_id: linkedUserId, invited_email: email, role: 'member', status: linkedUserId ? 'accepted' : 'pending' }]).select();
              if (tmError && tmError.code !== '23505') { console.error(tmError); return; }
              let displayName = email.split('@')[0];
              if (linkedUserId) {
                const { data: profileData } = await supabase.from('profiles').select('display_name').eq('id', linkedUserId).single();
                if (profileData?.display_name) displayName = profileData.display_name;
              }
              const { data: memberData, error: memberError } = await supabase.from('members').insert([{ trip_id: trip.id, name: displayName }]).select();
              if (memberError) console.error(memberError);
              else if (memberData) setMembers(prev => [...prev, memberData[0]]);
              setNewName(""); setShowInvite(false);
            }}>Invite</button>
          </div>
        </div>
      )}
      {members.map((m, i) => {
        const { content, isEmoji } = getAvatarContent(m.name);
        const displayName = getDisplayName(m.name);
        const color = avatarColors[i % avatarColors.length];
        const balance = getBalanceLabel(m.name);
        return (
          <div key={m.id} style={S.memberRow}>
            <div style={{ ...S.memberAvatar, background: color + "25", color }}>
              <span style={{ fontSize: isEmoji ? 22 : 16, fontWeight: isEmoji ? 400 : 900, letterSpacing: "-0.5px" }}>{content}</span>
            </div>
            <div style={S.memberInfo}>
              <div style={S.memberName}>{displayName}</div>
            </div>
            <div style={S.memberRight}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ background: P.surface2, border: `1px solid ${balance.color}30`, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: balance.color, minWidth: 80, textAlign: "center" }}>{balance.text}</div>
                {m.name !== myName && (
                  <button style={S.rowDeleteBtn} onClick={async () => {
                    if (!window.confirm(`Remove ${m.name} from this trip?`)) return;
                    const { error } = await supabase.from('members').delete().eq('id', m.id);
                    if (!error) setMembers(prev => prev.filter(mb => mb.id !== m.id));
                  }}>✕</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── SUMMARY TAB ─────────────────────────────────────────────────────────────

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
              const meta = { Stay: P.success, Dining: "#e4a0b0", Drinks: P.orange, Activity: P.lightBlue, Shopping: "#d4a0e0", Travel: "#a090d0", Other: P.slateBlue };
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

// ─── VIBES ────────────────────────────────────────────────────────────────────

const VIBES = [
  { key: "trip",        label: "Trip",         emoji: "✈️", icon: Plane,           shortForm: false },
  { key: "road",        label: "Road Trip",    emoji: "🚗", icon: Car,             shortForm: false },
  { key: "staycation",  label: "Staycation",   emoji: "🏠", icon: House,           shortForm: false },
  { key: "hike",        label: "Hike",         emoji: "🏔️", icon: Mountain,        shortForm: false },
  { key: "camping",     label: "Camping",      emoji: "🏕️", icon: Tent,           shortForm: false },
  { key: "concert",     label: "Concert",      emoji: "🎵", icon: Music,           shortForm: true  },
  { key: "dinner",      label: "Dinner",       emoji: "🍽️", icon: UtensilsCrossed, shortForm: true  },
  { key: "brunch",      label: "Brunch",       emoji: "🥂", icon: UtensilsCrossed, shortForm: true  },
  { key: "lunch",       label: "Lunch",        emoji: "🥗", icon: UtensilsCrossed, shortForm: true  },
  { key: "coffee",      label: "Coffee",       emoji: "☕", icon: Coffee,          shortForm: true  },
  { key: "drinks",      label: "Drinks",       emoji: "🍷", icon: Wine,            shortForm: true  },
  { key: "nightout",    label: "Night Out",    emoji: "🎉", icon: PartyPopper,     shortForm: true  },
  { key: "active",      label: "Workout",      emoji: "💪", icon: Zap,             shortForm: true  },
  { key: "beach",       label: "Beach Day",    emoji: "🏖️", icon: Umbrella,       shortForm: false },
  { key: "celebration", label: "Celebration",  emoji: "🎊", icon: Sparkles,        shortForm: true  },
  { key: "gameday",     label: "Game Day",     emoji: "🏆", icon: Trophy,          shortForm: true  },
  { key: "getaway",     label: "Getaway",      emoji: "🌅", icon: Sunset,          shortForm: false },
  { key: "meetup",      label: "Meetup",       emoji: "📍", icon: MapPin,          shortForm: true  },
];

// ─── NEW TRIP MODAL ───────────────────────────────────────────────────────────

function NewTripModal({ onClose, onSave, userId, userProfile }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    vibe: null, location: "", who: [], solo: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "", time: "", generatedName: "", editedName: "", emoji: "",
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const isShortForm = answers.vibe?.shortForm || false;

  const Receipt = () => {
    const items = [];
    if (step > 1 && answers.vibe) items.push({ label: "vibe", value: `${answers.vibe.emoji} ${answers.vibe.label}` });
    if (step > 2 && answers.location) items.push({ label: "where", value: answers.location });
    if (step > 3) items.push({ label: "who", value: answers.solo ? "Just me" : answers.who.length ? `${answers.who.length} people` : "Just me" });
    if (step > 4 && answers.startDate) {
      const d = new Date(answers.startDate + 'T12:00:00');
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = answers.time ? (() => { const [h, m] = answers.time.split(':').map(Number); const ampm = h >= 12 ? 'pm' : 'am'; return ` · ${h % 12 || 12}:${String(m).padStart(2,'0')}${ampm}`; })() : "";
      items.push({ label: "when", value: `${dateStr}${timeStr}` });
    }
    if (!items.length) return null;
    return (
      <div style={SN.receipt}>
        {items.map((item, i) => (
          <div key={i} style={SN.receiptRow}>
            <span style={SN.receiptLabel}>{item.label}</span>
            <span style={SN.receiptValue}>{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const goBack = () => setStep(s => Math.max(1, s - 1));

  const StepVibe = () => (
    <div style={SN.stepWrap}>
      <Receipt />
      <div style={SN.question}>What's the vibe?</div>
      <div style={SN.vibeGrid}>
        {VIBES.map(v => {
          const Icon = v.icon;
          const selected = answers.vibe?.key === v.key;
          return (
            <button key={v.key} style={{ ...SN.vibeTile, ...(selected ? SN.vibeTileOn : {}) }}
              onClick={() => { setAnswers(a => ({ ...a, vibe: v, emoji: v.emoji })); setTimeout(() => setStep(2), 180); }}>
              <Icon size={26} color={selected ? P.terracotta : P.textSecondary} strokeWidth={1.5} />
              <span style={{ ...SN.vibeLabel, color: selected ? P.terracotta : P.textSecondary }}>{v.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const locationRef = useRef(null);
  const [locationInput, setLocationInput] = useState(answers.location || "");
  const StepWhere = () => (
    <div style={{ ...SN.stepWrap, display: "flex", flexDirection: "column", minHeight: "70vh" }}>
      <div style={{ flex: 1 }}>
        <Receipt />
        <div style={SN.question}>Where to?</div>
        <div style={SN.subQuestion}>{isShortForm ? "Name the spot" : "City or destination"}</div>
        <input ref={locationRef} style={{ ...S.input, fontSize: 20, padding: "20px", marginBottom: 12, minHeight: 64 }}
          placeholder={isShortForm ? "e.g. Barista, Ox Restaurant" : "e.g. Tokyo, Banff, Portland"}
          defaultValue={locationInput} onBlur={e => setLocationInput(e.target.value)} autoFocus />
      </div>
      <button style={{ ...SN.nextBtn, marginTop: "auto" }} onClick={() => {
        const loc = locationRef.current?.value || locationInput;
        if (!loc.trim()) return;
        setAnswers(a => ({ ...a, location: loc })); setStep(3);
      }}>Next →</button>
    </div>
  );

  const [emailInput, setEmailInput] = useState("");
  const addEmail = () => { if (emailInput.trim()) { setAnswers(a => ({ ...a, who: [...a.who, emailInput.trim()] })); setEmailInput(""); } };

  const StepWho = () => (
    <div style={{ ...SN.stepWrap, display: "flex", flexDirection: "column", minHeight: "70vh" }}>
      <div style={{ flex: 1 }}>
        <Receipt />
        <div style={SN.question}>Who's coming?</div>
        <div style={SN.whoRow}>
          <button style={{ ...SN.whoChip, ...(answers.solo ? SN.whoChipOn : {}) }} onClick={() => setAnswers(a => ({ ...a, solo: true, who: [] }))}>Just me</button>
          <button style={{ ...SN.whoChip, ...(!answers.solo ? SN.whoChipOn : {}) }} onClick={() => setAnswers(a => ({ ...a, solo: false }))}>+ Add people</button>
        </div>
        {!answers.solo && (
          <div style={{ marginTop: 16 }}>
            <div style={SN.emailRow}>
              <input style={{ ...S.input, flex: 1, fontSize: 15 }} placeholder="friend@email.com" value={emailInput} type="email" autoComplete="off"
                onChange={e => setEmailInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addEmail(); }} />
              <button style={SN.addEmailBtn} onClick={addEmail}>Add</button>
            </div>
            {answers.who.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {answers.who.map((email, i) => (
                  <div key={i} style={SN.emailTag}>
                    <span>{email}</span>
                    <button style={SN.removeEmail} onClick={() => setAnswers(a => ({ ...a, who: a.who.filter((_, j) => j !== i) }))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <button style={{ ...SN.nextBtn, marginTop: "auto" }} onClick={() => setStep(4)}>Next →</button>
    </div>
  );

  const StepWhen = () => (
    <div style={{ ...SN.stepWrap, display: "flex", flexDirection: "column", minHeight: "70vh" }}>
      <div style={{ flex: 1 }}>
        <Receipt />
        <div style={SN.question}>When?</div>
        <div style={S.field}>
          <div style={S.fieldLbl}>DATE</div>
          <input style={{ ...S.input, colorScheme: "dark" }} type="date" defaultValue={answers.startDate} onChange={e => setAnswers(a => ({ ...a, startDate: e.target.value }))} />
        </div>
        {!isShortForm && (
          <div style={S.field}>
            <div style={{ ...S.fieldLbl, display: "flex", justifyContent: "space-between" }}><span>END DATE</span><span style={{ color: P.textMuted }}>optional</span></div>
            <input style={{ ...S.input, colorScheme: "dark" }} type="date" defaultValue={answers.endDate} min={answers.startDate} onChange={e => setAnswers(a => ({ ...a, endDate: e.target.value }))} />
          </div>
        )}
        {isShortForm && (
          <div style={S.field}>
            <div style={{ ...S.fieldLbl, display: "flex", justifyContent: "space-between" }}><span>TIME</span><span style={{ color: P.textMuted }}>optional</span></div>
            <input style={{ ...S.input, colorScheme: "dark" }} type="time" defaultValue={answers.time} onChange={e => setAnswers(a => ({ ...a, time: e.target.value }))} />
          </div>
        )}
      </div>
      <button style={{ ...SN.nextBtn, marginTop: "auto", opacity: answers.startDate ? 1 : 0.4 }} disabled={!answers.startDate} onClick={handleGenerateName}>
        {generating ? "Working on it..." : "Next →"}
      </button>
    </div>
  );

  const formatDates = (start, end) => {
    if (!start) return "";
    const s = new Date(start + 'T12:00:00');
    if (!end || start === end) return s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const e = new Date(end + 'T12:00:00');
    const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
    if (sameMonth) return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}, ${e.getFullYear()}`;
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${e.getFullYear()}`;
  };

  const handleGenerateName = async () => {
    setGenerating(true);
    try {
      const whoStr = answers.solo ? "just me" : answers.who.length ? `with ${answers.who.join(", ")}` : "just me";
      const dateStr = formatDates(answers.startDate, answers.endDate);
      const timeStr = answers.time ? ` at ${answers.time}` : "";
      const promptText = `Generate a short, natural trip name (max 5 words) for: ${answers.vibe?.label} at ${answers.location}${timeStr}, ${dateStr}, ${whoStr}. Examples: "Coffee at Barista with Derek", "Tokyo October", "Banff Long Weekend". Only return the name, nothing else.`;
      const res = await fetch("/api/parse-trip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: promptText, mode: "name" }) });
      const data = await res.json();
      const name = (data.content?.[0]?.text || "").trim().replace(/^"|"$/g, '').slice(0, 30);
      setAnswers(a => ({ ...a, generatedName: name, editedName: name }));
    } catch (e) {
      const fallback = `${answers.vibe?.label} at ${answers.location}`;
      setAnswers(a => ({ ...a, generatedName: fallback, editedName: fallback }));
    } finally { setGenerating(false); setStep(5); }
  };

  const formatTime12 = (t) => {
    if (!t) return "";
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`;
  };

  const nameInputRef = useRef(null);

  const handleSave = async () => {
    const finalName = nameInputRef.current?.value || answers.editedName;
    if (!finalName) return;
    setSaving(true);
    try {
      const dates = formatDates(answers.startDate, answers.endDate);
      const location = answers.location;
      const { data: tripData, error: tripError } = await supabase.from('trips').insert([{
        name: finalName, location, city: !answers.vibe?.shortForm ? location : "",
        emoji: answers.emoji || "✈️", dates,
        start_date: answers.startDate || null, end_date: answers.endDate || null,
        time: answers.time || null, total_spent: 0, settled: false,
        solo: answers.solo || answers.who.length === 0, user_id: userId,
      }]).select();
      if (tripError) throw tripError;
      const trip = tripData[0];
      await supabase.from('trip_members').insert([{ trip_id: trip.id, user_id: userId, role: 'owner', status: 'accepted' }]);
      const creatorName = userProfile?.display_name || "Me";
      const { data: existingMember } = await supabase.from('members').select('id').eq('trip_id', trip.id).eq('name', creatorName).single();
      if (!existingMember) { await supabase.from('members').insert([{ trip_id: trip.id, name: creatorName }]); }
      for (const email of answers.who) {
        const { data: existingUser } = await supabase.rpc('get_user_id_by_email', { email_input: email.toLowerCase() });
        const linkedUserId = existingUser?.[0]?.id || null;
        await supabase.from('trip_members').insert([{ trip_id: trip.id, user_id: linkedUserId, invited_email: email.toLowerCase(), role: 'member', status: linkedUserId ? 'accepted' : 'pending' }]);
        let displayName = email.split('@')[0];
        if (linkedUserId) {
          const { data: pd } = await supabase.from('profiles').select('display_name').eq('id', linkedUserId).single();
          if (pd?.display_name) displayName = pd.display_name;
        }
        await supabase.from('members').insert([{ trip_id: trip.id, name: displayName }]);
      }
      if (answers.vibe?.shortForm && answers.location) {
        const itinType = ['dinner', 'coffee', 'drinks'].includes(answers.vibe.key) ? 'restaurant' : 'activity';
        await supabase.from('itinerary').insert([{ trip_id: trip.id, day: answers.startDate, time: answers.time || "", type: itinType, title: answers.location, detail: "", icon: answers.vibe.emoji, visibility: "group" }]);
      }
      onSave(trip);
    } catch (e) { console.error(e); setSaving(false); }
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: P.phoneBg, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ ...SN.header, paddingTop: 32, flexShrink: 0 }}>
        {step > 1 ? <button style={SN.backBtn} onClick={goBack}>← Back</button> : <div />}
        <div style={SN.stepIndicator}>
          {[1,2,3,4,5].map(n => (<div key={n} style={{ ...SN.stepPip, ...(n <= step ? SN.stepPipOn : {}) }} />))}
        </div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ flex: 1, padding: "0 22px 16px", overflowY: "auto" }}>
        {step === 1 && <StepVibe />}
        {step === 2 && <StepWhere />}
        {step === 3 && <StepWho />}
        {step === 4 && <StepWhen />}
        {step === 5 && (() => {
          const IconComp = TRIP_ICONS[answers.emoji] || Plane;
          const dateStr = formatDates(answers.startDate, answers.endDate);
          const timeStr = formatTime12(answers.time);
          return (
            <div style={SN.stepWrap}>
              <Receipt />
              <div style={SN.question}>Looks good?</div>
              <div style={SN.confirmCard}>
                <div style={SN.confirmIcon}><IconComp size={28} color={P.terracotta} strokeWidth={1.5} /></div>
                <input ref={nameInputRef} key="name-input" style={SN.nameInput} defaultValue={answers.editedName} maxLength={30} onBlur={e => setAnswers(a => ({ ...a, editedName: e.target.value }))} />
                <div style={SN.confirmMeta}>{answers.location}{dateStr ? ` · ${dateStr}` : ""}{timeStr ? ` · ${timeStr}` : ""}</div>
                <div style={SN.confirmPeople}>{answers.solo ? "Just you" : answers.who.length ? `You + ${answers.who.length} others` : "Just you"}</div>
              </div>
              <div style={{ fontSize: 12, color: P.textMuted, textAlign: "center", marginBottom: 16 }}>Tap the name to edit it</div>
              <button style={{ ...SN.nextBtn, background: saving ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={handleSave} disabled={saving}>
                {saving ? "Working on it..." : "Let's go ✓"}
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

const SN = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px 8px" },
  backBtn: { background: "transparent", border: "none", color: P.slateBlue, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif" },
  stepIndicator: { display: "flex", gap: 6 },
  stepPip: { width: 6, height: 6, borderRadius: "50%", background: P.surface3 },
  stepPipOn: { background: P.terracotta },
  stepWrap: { paddingBottom: 12 },
  receipt: { background: P.surface2, borderRadius: 14, padding: "12px 16px", marginBottom: 24, border: `1px solid ${P.surface3}` },
  receiptRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${P.surface3}` },
  receiptLabel: { fontSize: 10, fontWeight: 800, color: P.textMuted, letterSpacing: "2px" },
  receiptValue: { fontSize: 14, fontWeight: 700, color: P.textPrimary },
  question: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px", marginBottom: 4 },
  subQuestion: { fontSize: 13, color: P.slateBlue, marginBottom: 18, fontFamily: "'DM Sans', sans-serif" },
  vibeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 },
  vibeTile: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "8px 4px", cursor: "pointer", minHeight: 74 },
  vibeTileOn: { background: P.terracotta + "18", border: `1px solid ${P.terracotta}70` },
  vibeLabel: { fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  nextBtn: { width: "100%", background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px" },
  whoRow: { display: "flex", gap: 10, marginTop: 16 },
  whoChip: { flex: 1, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, color: P.textMuted, cursor: "pointer", textAlign: "center", fontFamily: "'DM Sans', sans-serif" },
  whoChipOn: { background: P.terracotta + "18", border: `1px solid ${P.terracotta}60`, color: P.terracotta },
  emailRow: { display: "flex", gap: 8 },
  addEmailBtn: { background: P.surface3, border: "none", color: P.textPrimary, borderRadius: 12, padding: "0 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  emailTag: { display: "flex", alignItems: "center", gap: 6, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 22, padding: "6px 12px", fontSize: 13, color: P.textSecondary },
  removeEmail: { background: "transparent", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 11, padding: 0, lineHeight: 1 },
  confirmCard: { background: `linear-gradient(135deg, ${P.surface1}, ${P.surface2})`, border: `1px solid ${P.surface3}`, borderRadius: 20, padding: "24px", marginBottom: 16, textAlign: "center" },
  confirmIcon: { width: 52, height: 52, borderRadius: 16, background: P.terracotta + "20", border: `1px solid ${P.terracotta}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  nameInput: { background: "transparent", border: "none", borderBottom: `1px solid ${P.surface3}`, color: P.textPrimary, fontSize: 22, fontWeight: 900, letterSpacing: "-0.8px", width: "100%", textAlign: "center", outline: "none", marginBottom: 12, fontFamily: "'Syne', sans-serif", padding: "4px 0" },
  confirmMeta: { fontSize: 13, color: P.textSecondary, marginBottom: 6 },
  confirmPeople: { fontSize: 13, color: P.slateBlue },
};

// ─── ADD EXPENSE MODAL (FIXED) ────────────────────────────────────────────────

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
    const fetchMembers = async () => {
      // Get all trip_members with linked profiles in one query
      const { data: tmRows } = await supabase
        .from('trip_members')
        .select('user_id, invited_email')
        .eq('trip_id', trip.id);

      if (!tmRows?.length) return;

      const userIds = tmRows.map(r => r.user_id).filter(Boolean);
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      // Map user_id → display_name
      const profileMap = {};
      (profileRows || []).forEach(p => { profileMap[p.id] = p.display_name; });

      // Build final names list — use display_name if available, else email prefix
      const seen = new Set();
      const names = [];
      for (const row of tmRows) {
        const name = (row.user_id && profileMap[row.user_id])
          || (row.invited_email ? row.invited_email.split('@')[0] : null);
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          names.push(name);
        }
      }

      // Put current user first
      const userDisplay = profile?.display_name || user?.email?.split('@')[0] || 'Me';
      const sorted = [
        userDisplay,
        ...names.filter(n => n.toLowerCase() !== userDisplay.toLowerCase())
      ];

      setMembers(sorted);
      if (!existingExpense) {
        setExp(e => ({ ...e, paidBy: userDisplay, splitWith: sorted }));
      } else if (!exp.paidBy) {
        setExp(e => ({ ...e, paidBy: sorted[0] || userDisplay }));
      }
    };
    fetchMembers();
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

  const stepTitles = ["", "What was it?", "Who's splitting?", "Looks good?"];

  // Shared full-screen flex-column layout — same pattern as AddItinModal
  const FS = { display: "flex", flexDirection: "column", flex: 1, padding: "0 22px 12px" };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: P.phoneBg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px 8px", flexShrink: 0 }}>
        <div style={S.sheetTitle}>{stepTitles[step]}</div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>
      {/* Step dots */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14, flexShrink: 0 }}>
        {[1,2,3].map(s => <div key={s} style={{ ...S.stepDot, ...(s <= step ? S.stepDotActive : {}) }} />)}
      </div>

      {/* ── Step 1: Category, Amount, Description, Paid By ── */}
      {step === 1 && (
        <div style={FS}>
          <div style={{ flex: 1 }}>
            {/* Category — horizontal scroll */}
            <div style={{ marginBottom: 12 }}>
              <div style={S.fieldLbl}>CATEGORY</div>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {CATS.map(c => {
                  const m = CATEGORY_META[c];
                  const CIcon = CAT_ICONS[c];
                  const selected = exp.category === c;
                  return (
                    <button key={c} onClick={() => setExp(n => ({ ...n, category: c }))}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 10px", borderRadius: 12, cursor: "pointer", minHeight: 50, minWidth: 58, flexShrink: 0, background: selected ? m.bg : P.surface1, border: selected ? `1px solid ${m.color}` : `1px solid ${P.surface3}` }}>
                      <CIcon size={15} color={selected ? m.color : P.textMuted} strokeWidth={1.5} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: selected ? m.color : P.textMuted, textTransform: "capitalize", letterSpacing: "0.3px" }}>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount — Venmo style */}
            <div style={{ textAlign: "center", padding: "6px 0 8px", borderBottom: `1px solid ${P.surface3}`, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: P.textMuted, letterSpacing: "2px", marginBottom: 4 }}>AMOUNT</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: P.textMuted }}>$</span>
                <input type="number" placeholder="0" value={exp.amount}
                  onChange={e => setExp(n => ({ ...n, amount: e.target.value }))}
                  style={{ background: "transparent", border: "none", outline: "none", fontSize: 34, fontWeight: 900, color: P.textPrimary, letterSpacing: "-1px", width: 130, textAlign: "center", fontFamily: "'Syne', sans-serif" }} />
              </div>
              {perPerson && <div style={{ fontSize: 11, color: P.slateBlue, marginTop: 2 }}>${perPerson}/person</div>}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 10 }}>
              <div style={S.fieldLbl}>DESCRIPTION</div>
              <input style={{ ...S.input, padding: "12px 16px" }} placeholder="e.g. Dinner at Coco's"
                value={exp.title} onChange={e => setExp(n => ({ ...n, title: e.target.value }))} />
            </div>

            {/* Paid by */}
            <div>
              <div style={S.fieldLbl}>PAID BY</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {members.map(m => (
                  <button key={m} onClick={() => setExp(n => ({ ...n, paidBy: m }))}
                    style={{ ...S.paidBtn, ...(exp.paidBy === m ? S.paidBtnActive : {}) }}>{m}</button>
                ))}
              </div>
            </div>
          </div>

          <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, marginTop: "auto", paddingTop: 14 }}
            onClick={() => {
              if (!exp.amount || parseFloat(exp.amount) <= 0) return;
              members.length <= 1 ? setStep(3) : setStep(2);
            }}>
            {members.length <= 1 ? "Review →" : "Next → Split"}
          </button>
        </div>
      )}

      {/* ── Step 2: Who's splitting ── */}
      {step === 2 && (
        <div style={FS}>
          <div style={{ flex: 1 }}>
            <div style={{ textAlign: "center", padding: "10px 0 16px", borderBottom: `1px solid ${P.surface3}`, marginBottom: 14 }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: P.textPrimary, letterSpacing: "-2px" }}>${exp.amount || "0"}</div>
              <div style={{ fontSize: 13, color: P.textMuted, marginTop: 4 }}>splitting {exp.splitWith.length} ways</div>
              {perPerson && <div style={{ fontSize: 15, color: P.terracotta, fontWeight: 700, marginTop: 4 }}>${perPerson}/person</div>}
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
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            <button style={S.secondaryBtn} onClick={() => setStep(1)}>← Back</button>
            <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={() => setStep(3)}>Review →</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && (
        <div style={FS}>
          <div style={{ flex: 1 }}>
            <div style={{ background: P.surface2, borderRadius: 16, overflow: "hidden", border: `1px solid ${P.surface3}`, marginBottom: 12 }}>
              {[
                { label: "What", val: exp.title || "—" },
                { label: "Amount", val: `$${exp.amount}` },
                { label: "Category", val: exp.category },
                { label: "Paid by", val: exp.paidBy },
                { label: "Split", val: `${exp.splitWith.length} people · $${perPerson}/ea` },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${P.surface3}` : "none" }}>
                  <span style={{ fontSize: 13, color: P.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: P.textPrimary }}>{row.val}</span>
                </div>
              ))}
            </div>
            {existingExpense && (
              <button style={{ ...S.primaryBtn, background: "transparent", color: P.danger, border: `1px solid ${P.danger}40` }}
                onClick={async () => {
                  if (!window.confirm("Delete this expense?")) return;
                  await supabase.from('expenses').delete().eq('id', existingExpense.id);
                  if (onAdd) onAdd();
                  onClose();
                }}>
                Delete Expense
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            <button style={S.secondaryBtn} onClick={() => setStep(existingExpense ? 1 : 2)}>← Edit</button>
            <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={handleSubmit}>
              {existingExpense ? "✓ Save Changes" : "✓ Add Expense"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DATE TIME PICKER HELPER ─────────────────────────────────────────────────

const TYPE_PLACEHOLDERS = {
  flight:     "e.g. PDX to LAX",
  transport:  "e.g. Dollar Car Rental",
  stay:       "e.g. Fairmont Lake Louise",
  restaurant: "e.g. Nobu Houston",
  drinks:     "e.g. Teardrop Cocktail Lounge",
  activity:   "e.g. Museum of Fine Arts",
  shopping:   "e.g. Galleria Mall",
  other:      "e.g. Scenic overlook",
};

function formatDateDisplay(d) {
  if (!d) return null;
  const dt = new Date(d + 'T12:00:00');
  if (isNaN(dt)) return null;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeDisplay(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return null;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function DateTimePicker({ day, time, onDayChange, onTimeChange }) {
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
      {/* Date */}
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={S.fieldLbl}>DATE</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 52 }}>
          {day ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{ fontSize: 15, fontWeight: 700, color: P.terracotta, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}>
                {formatDateDisplay(day)}
              </span>
              <button onClick={() => onDayChange("")} style={{ background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
            </div>
          ) : (
            <button onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Calendar size={32} color={P.slateBlue} strokeWidth={1.5} />
              <span style={{ fontSize: 10, color: P.textMuted, fontWeight: 600 }}>tap to set</span>
            </button>
          )}
        </div>
        <input ref={dateInputRef} type="date" value={day} onChange={e => onDayChange(e.target.value)}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }} />
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: P.surface3, margin: "16px 0" }} />

      {/* Time */}
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={S.fieldLbl}>TIME <span style={{ color: P.textMuted, fontWeight: 600, letterSpacing: 0 }}>(optional)</span></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 52 }}>
          {time ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{ fontSize: 15, fontWeight: 700, color: P.terracotta, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => timeInputRef.current?.showPicker?.() || timeInputRef.current?.click()}>
                {formatTimeDisplay(time)}
              </span>
              <button onClick={() => onTimeChange("")} style={{ background: "none", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
            </div>
          ) : (
            <button onClick={() => timeInputRef.current?.showPicker?.() || timeInputRef.current?.click()}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Clock size={32} color={P.slateBlue} strokeWidth={1.5} />
              <span style={{ fontSize: 10, color: P.textMuted, fontWeight: 600 }}>tap to set</span>
            </button>
          )}
        </div>
        <input ref={timeInputRef} type="time" value={time} onChange={e => onTimeChange(e.target.value)}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }} />
      </div>
    </div>
  );
}

// ─── ADD ITIN MODAL ───────────────────────────────────────────────────────────

function AddItinModal({ onClose, trip, onAdd }) {
  const [type, setType] = useState("activity");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const titleRef = useRef(null);
  const detailRef = useRef(null);

  const handleAdd = async () => {
    const title = titleRef.current?.value || "";
    const detail = detailRef.current?.value || "";
    if (!title) return;
    const { data, error } = await supabase.from('itinerary')
      .insert([{ trip_id: trip.id, day, time, type, title, detail, icon: "🎯", visibility: "group" }]).select();
    if (error) { console.error(error); return; }
    onAdd(data[0]);
    onClose();
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: P.phoneBg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px 10px", flexShrink: 0 }}>
        <div style={S.sheetTitle}>Add to Itinerary</div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ flex: 1, padding: "0 22px 12px", display: "flex", flexDirection: "column" }}>
        {/* Type — horizontal scroll */}
        <div style={{ marginBottom: 12 }}>
          <div style={S.fieldLbl}>TYPE</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {["flight","transport","stay","restaurant","drinks","activity","shopping","other"].map(t => {
              const m = ITINERARY_COLORS[t];
              const TIcon = ITIN_TYPE_ICONS[t];
              const selected = type === t;
              return (
                <button key={t} onClick={() => setType(t)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 10px", borderRadius: 12, cursor: "pointer", background: selected ? P.surface2 : P.surface1, border: selected ? `1px solid ${m.accent}` : `1px solid ${P.surface3}`, minHeight: 54, minWidth: 58, flexShrink: 0 }}>
                  <TIcon size={18} color={selected ? m.accent : P.textMuted} strokeWidth={1.5} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: selected ? m.accent : P.textMuted, textTransform: "capitalize", letterSpacing: "0.3px" }}>{t}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Title — centered, no box, dynamic placeholder */}
        <div style={{ textAlign: "center", padding: "6px 0 10px", borderBottom: `1px solid ${P.surface3}`, marginBottom: 12 }}>
          <div style={S.fieldLbl}>TITLE</div>
          <input ref={titleRef} placeholder={TYPE_PLACEHOLDERS[type] || "e.g. Add a title"}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", width: "100%", textAlign: "center", fontFamily: "'Syne', sans-serif", padding: "4px 0" }} />
        </div>
        {/* Details */}
        <div style={{ marginBottom: 12 }}>
          <div style={S.fieldLbl}>DETAILS / CONFIRMATION #</div>
          <input ref={detailRef} style={{ ...S.input, fontSize: 14, padding: "12px 16px" }} placeholder="Confirmation code, address, notes..." defaultValue="" />
        </div>
        {/* Date + Time — icon pickers */}
        <DateTimePicker day={day} time={time} onDayChange={setDay} onTimeChange={setTime} />
        <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", marginTop: "auto" }} onClick={handleAdd}>
          Add to Itinerary
        </button>
      </div>
    </div>
  );
}

// ─── EDIT ITIN MODAL ──────────────────────────────────────────────────────────

function EditItinModal({ item, onClose, onSave }) {
  const [type, setType] = useState(item.type || "activity");
  const [day, setDay] = useState(item.day || "");
  const [time, setTime] = useState(item.time || "");
  const titleRef = useRef(null);
  const detailRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const title = titleRef.current?.value || item.title;
    const detail = detailRef.current?.value || item.detail || "";
    if (!title) return;
    setLoading(true);
    const { data, error } = await supabase.from('itinerary')
      .update({ type, title, detail, day, time, icon: item.icon })
      .eq('id', item.id).select().single();
    if (error) { console.error(error); setLoading(false); return; }
    onSave(data);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: P.phoneBg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px 10px", flexShrink: 0 }}>
        <div style={S.sheetTitle}>Edit Item</div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ flex: 1, padding: "0 22px 12px", display: "flex", flexDirection: "column" }}>
        {/* Type — horizontal scroll */}
        <div style={{ marginBottom: 12 }}>
          <div style={S.fieldLbl}>TYPE</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {["flight","transport","stay","restaurant","drinks","activity","shopping","other"].map(t => {
              const m = ITINERARY_COLORS[t];
              const TIcon = ITIN_TYPE_ICONS[t];
              const selected = type === t;
              return (
                <button key={t} onClick={() => setType(t)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 10px", borderRadius: 12, cursor: "pointer", background: selected ? P.surface2 : P.surface1, border: selected ? `1px solid ${m.accent}` : `1px solid ${P.surface3}`, minHeight: 54, minWidth: 58, flexShrink: 0 }}>
                  <TIcon size={18} color={selected ? m.accent : P.textMuted} strokeWidth={1.5} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: selected ? m.accent : P.textMuted, textTransform: "capitalize", letterSpacing: "0.3px" }}>{t}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Title — centered, no box, dynamic placeholder */}
        <div style={{ textAlign: "center", padding: "6px 0 10px", borderBottom: `1px solid ${P.surface3}`, marginBottom: 12 }}>
          <div style={S.fieldLbl}>TITLE</div>
          <input ref={titleRef} defaultValue={item.title}
            placeholder={TYPE_PLACEHOLDERS[type] || "e.g. Add a title"}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", width: "100%", textAlign: "center", fontFamily: "'Syne', sans-serif", padding: "4px 0" }} />
        </div>
        {/* Details */}
        <div style={{ marginBottom: 12 }}>
          <div style={S.fieldLbl}>DETAILS / CONFIRMATION #</div>
          <input ref={detailRef} style={{ ...S.input, fontSize: 14, padding: "12px 16px" }} defaultValue={item.detail || ""} />
        </div>
        {/* Date + Time — icon pickers */}
        <DateTimePicker day={day} time={time} onDayChange={setDay} onTimeChange={setTime} />
        <button style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", marginTop: "auto" }}
          onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── SETTLE MODAL ─────────────────────────────────────────────────────────────

function SettleModal({ settlements, myName, trip, onClose }) {
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
                  <a href={`venmo://paycharge?txn=pay&recipients=${encodeURIComponent(s.to)}&amount=${s.amount}&note=${encodeURIComponent(trip?.name || 'Trip')}`}
                    style={{ ...S.payBtn, textDecoration: "none", display: "flex", alignItems: "center" }}>Venmo</a>
                  <a href={`https://enroll.zellepay.com/pay-with-zelle`} target="_blank" rel="noopener noreferrer"
                    style={{ ...S.payBtn, textDecoration: "none", display: "flex", alignItems: "center" }}>Zelle</a>
                  <button onClick={() => toggle(`m${i}`)} style={{ ...S.markBtn, ...(marked.includes(`m${i}`) ? S.markBtnDone : {}) }}>{marked.includes(`m${i}`) ? "✓" : "Mark"}</button>
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
                <button onClick={() => toggle(`o${i}`)} style={{ ...S.markBtn, ...(marked.includes(`o${i}`) ? S.markBtnDone : {}) }}>{marked.includes(`o${i}`) ? "✓ Done" : "Confirm"}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SHARE MODAL ──────────────────────────────────────────────────────────────

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
    const { data, error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id).select().single();
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
        <button style={SA.backBtn} onClick={onBack}>← Back</button>
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
            <input style={S.input} placeholder="e.g. Tokyo 2025" value={form.name} maxLength={30} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>CITY</div>
              <input style={S.input} placeholder="e.g. Tokyo" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <div style={S.fieldLbl}>COUNTRY</div>
              <input style={S.input} placeholder="e.g. Japan" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>DATES</div>
            <input style={S.input} placeholder="e.g. Jun 1–10, 2025" value={form.dates} onChange={e => setForm(f => ({ ...f, dates: e.target.value }))} />
          </div>
          <div style={S.field}>
            <div style={S.fieldLbl}>ICON</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TRIP_ICON_LIST.map(({ key, Icon, label }) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, emoji: key }))}
                  style={{ background: form.emoji === key ? P.surface2 : "transparent", border: form.emoji === key ? `1px solid ${P.terracotta}` : `1px solid ${P.surface3}`, borderRadius: 12, padding: "8px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 56 }}>
                  <Icon size={20} color={form.emoji === key ? P.terracotta : P.textMuted} strokeWidth={1.5} />
                  <span style={{ fontSize: 9, color: form.emoji === key ? P.terracotta : P.textMuted, fontWeight: 700, letterSpacing: "0.5px" }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <button style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, marginTop: 8 }} onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const S = {
  root: { minHeight: "100vh", background: P.outerBg, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px", fontFamily: "'Syne', 'DM Sans', 'Helvetica Neue', sans-serif" },
  phone: { width: 430, maxWidth: "100%", background: P.phoneBg, borderRadius: 36, overflow: "hidden", boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)`, minHeight: 750, height: 750, position: "relative", display: "flex", flexDirection: "column" },
  screen: { flex: 1, overflowY: "auto" },
  profileHero: { padding: "52px 28px 32px", textAlign: "center", background: `linear-gradient(180deg, ${P.surface1} 0%, ${P.phoneBg} 100%)`, borderBottom: `1px solid ${P.surface3}` },
  profileAvatar: { width: 84, height: 84, borderRadius: "50%", background: `linear-gradient(135deg, ${P.terracotta}, ${P.orange})`, color: "#fff", fontSize: 26, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", letterSpacing: "-1px" },
  profileName: { fontSize: 30, fontWeight: 900, color: P.textPrimary, letterSpacing: "-1.2px", marginBottom: 6 },
  profileSub: { fontSize: 13, color: P.textMuted, letterSpacing: "1px", marginBottom: 24 },
  profileStats: { display: "flex", justifyContent: "center", alignItems: "center", background: P.surface1, borderRadius: 18, padding: "18px 0", border: `1px solid ${P.surface3}` },
  statItem: { flex: 1, textAlign: "center" },
  statNum: { fontSize: 26, fontWeight: 900, color: P.textPrimary, letterSpacing: "-1px" },
  statLbl: { fontSize: 11, color: P.textMuted, letterSpacing: "1px", marginTop: 3 },
  statDiv: { width: 1, height: 34, background: P.surface3 },
  sectionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 32 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: P.textMuted, letterSpacing: "2.5px" },
  newBtn: { background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", border: "none", borderRadius: 22, padding: "9px 18px", fontSize: 14, fontWeight: 800, cursor: "pointer" },
  ghostBtn: { background: "transparent", border: `1px solid ${P.surface3}`, color: P.slateBlue, borderRadius: 22, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  tripCard: { borderRadius: 20, padding: "16px 18px", marginBottom: 10, cursor: "pointer", background: P.surface1, border: `1px solid ${P.surface3}`, borderLeft: `3px solid ${P.terracotta}`, position: "relative" },
  tcIconWrap: { width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" },
  settledBadge: { background: P.successBg, color: P.success, fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", padding: "4px 10px", borderRadius: 8 },
  tcName: { fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px", marginBottom: 2 },
  tcLocation: { fontSize: 13, color: P.textSecondary, marginBottom: 1 },
  tcTotal: { fontSize: 22, fontWeight: 900, letterSpacing: "-1px" },
  tripShell: { flex: 1, display: "flex", flexDirection: "column", height: "100%", position: "relative" },
  tripHeader: { padding: "28px 22px 22px", display: "flex", alignItems: "center", gap: 14 },
  backBtn: { background: "rgba(255,255,255,0.08)", border: "none", color: P.textPrimary, fontSize: 20, cursor: "pointer", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  thIconWrap: { width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  thMid: { flex: 1, display: "flex", alignItems: "center", gap: 12 },
  thName: { fontSize: 19, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px" },
  thSub: { fontSize: 12, color: P.textSecondary, marginTop: 2 },
  shareHeaderBtn: { background: "transparent", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: "0.3px", flexShrink: 0 },
  tabContent: { flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", minHeight: 0 },
  tabScroll: { height: "100%", overflowY: "auto", padding: "0 20px" },
  tabTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, paddingBottom: 18 },
  tabTitle: { fontSize: 24, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px" },
  actionBtn: { background: "transparent", border: `1px solid ${P.surface3}`, color: P.textSecondary, borderRadius: 22, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  tabBar: { display: "flex", background: P.surface1, borderTop: `1px solid ${P.surface3}`, padding: "12px 0 16px", flexShrink: 0 },
  tabBtn: { flex: 1, background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0", position: "relative" },
  tabLabel: { fontSize: 11, fontWeight: 700, color: P.textMuted, letterSpacing: "0.3px" },
  tabDot: { width: 4, height: 4, borderRadius: "50%", position: "absolute", bottom: -4 },
  dayBlock: { marginBottom: 22 },
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
  memberRow: { display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: `1px solid ${P.surface1}` },
  memberAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, flexShrink: 0 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: 700, color: P.textPrimary, display: "flex", alignItems: "center", gap: 6 },
  youTag: { background: P.surface2, color: P.lightBlue, fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "2px 8px", letterSpacing: "1px" },
  memberMeta: { fontSize: 13, color: P.textMuted, marginTop: 3 },
  memberRight: {},
  evenBadge: { background: P.surface2, color: P.textMuted, fontSize: 12, fontWeight: 700, borderRadius: 8, padding: "5px 10px", border: "1px solid transparent" },
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", zIndex: 100, background: "rgba(0,0,0,0.4)" },
  sheet: { background: P.surface1, borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "88%", overflowY: "auto", paddingBottom: 24, boxShadow: `0 -20px 60px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,255,255,0.06)` },
  sheetHandle: { width: 40, height: 5, background: P.surface3, borderRadius: 10, margin: "14px auto 0" },
  sheetHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px 14px" },
  sheetTitle: { fontSize: 20, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px" },
  closeBtn: { background: P.surface2, border: "none", color: P.textSecondary, width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" },
  sheetBody: { padding: "4px 22px 22px" },
  stepDot: { width: 7, height: 7, borderRadius: "50%", background: P.surface3 },
  stepDotActive: { background: P.terracotta },
  field: { marginBottom: 18 },
  fieldLbl: { fontSize: 10, fontWeight: 800, color: P.textMuted, letterSpacing: "2.5px", marginBottom: 10 },
  input: { background: P.phoneBg, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "14px 16px", color: P.textPrimary, fontSize: 16, width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  paidBtn: { background: P.surface1, border: `1px solid ${P.surface3}`, color: P.textMuted, borderRadius: 14, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  paidBtnActive: { background: P.surface2, border: `1px solid ${P.lightBlue}`, color: P.lightBlue },
  splitGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 },
  splitMember: { background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "14px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" },
  splitMemberOn: { border: `1px solid ${P.terracotta}`, background: "#1e1810" },
  splitAvatar: { width: 40, height: 40, borderRadius: "50%", background: P.surface3, color: P.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 },
  splitName: { fontSize: 12, color: P.textSecondary, fontWeight: 600 },
  splitCheck: { position: "absolute", top: 6, right: 6, fontSize: 10, color: P.terracotta, fontWeight: 800 },
  primaryBtn: { background: P.surface2, color: P.textPrimary, border: "none", borderRadius: 16, padding: "16px", width: "100%", fontSize: 16, fontWeight: 800, cursor: "pointer", letterSpacing: "-0.3px" },
  secondaryBtn: { background: P.surface2, color: P.textMuted, border: `1px solid ${P.surface3}`, borderRadius: 16, padding: "16px", flex: 1, fontSize: 15, fontWeight: 700, cursor: "pointer" },
  settleSection: { marginBottom: 22 },
  settleRow: { background: P.surface2, borderRadius: 16, padding: "16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "opacity 0.2s", border: `1px solid ${P.surface3}` },
  settlePeople: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  settleAmt: { fontSize: 13, color: P.textMuted },
  payBtn: { background: P.surface1, border: `1px solid ${P.surface3}`, color: P.textSecondary, borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  markBtn: { background: P.surface2, border: "none", color: P.textMuted, borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  markBtnDone: { background: P.successBg, color: P.success },
  shareSubtitle: { fontSize: 14, color: P.slateBlue, marginBottom: 18 },
  shareOption: { display: "flex", alignItems: "center", gap: 14, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 18, padding: "16px", marginBottom: 12 },
  shareOptTitle: { fontSize: 15, fontWeight: 800, marginBottom: 3 },
  shareOptSub: { fontSize: 13, color: P.textMuted },
  copyBtn: { background: "transparent", border: "1px solid", borderRadius: 22, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  shareNote: { background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "12px 16px", fontSize: 13, color: P.slateBlue, marginTop: 8 },
  settingsSection: { marginBottom: 30 },
  settingsSectionLabel: { fontSize: 11, fontWeight: 800, color: P.textMuted, letterSpacing: "2.5px", marginBottom: 14 },
  settingsCard: { background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 18, padding: "18px" },
  rowDeleteBtn: { background: P.dangerBg, border: "none", color: P.danger, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: 4, flexShrink: 0 },
};
