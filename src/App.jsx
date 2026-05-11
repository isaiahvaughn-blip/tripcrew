import { supabase } from './supabase'
import { useState, useEffect, useRef } from "react";
import {
  Plane, Mountain, Bike, Umbrella, Map, Snowflake, Car, Anchor, Tent, Theater,
  UtensilsCrossed, Hotel, Zap, Train, Calendar, DollarSign, Image, Users,
  MapPin, ChevronRight, Mic, MicOff, Sparkles, Loader, BarChart2,
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
  flight:     { accent: P.lightBlue },
  stay:       { accent: "#6bbf8a" },
  activity:   { accent: P.terracotta },
  restaurant: { accent: "#e4a0b0" },
  transport:  { accent: "#a090d0" },
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
    // Smart tab default: Summary for past trips, Itinerary for upcoming/current
    // Use raw startDate if available, otherwise skip to itinerary
    const defaultTab = (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Try raw date fields first (v2 trips store these)
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
    fontFamily: "'Playfair Display', 'Syne', serif",
    fontSize: 38,
    fontWeight: 900,
    letterSpacing: "-2px",
    color: P.textPrimary,
    marginBottom: 8,
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 16,
    color: P.slateBlue,
    fontFamily: "'DM Sans', sans-serif",
  },
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────

// Helper to render avatar content from profile.avatar field
function renderAvatarContent(profile, user) {
  const av = profile?.avatar;
  if (av?.startsWith('emoji:')) return <span style={{ fontSize: 32 }}>{av.slice(6)}</span>;
  if (av?.startsWith('name:')) return <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.5px" }}>{av.slice(5).slice(0, 3).toUpperCase()}</span>;
  if (av?.startsWith('initials:')) return <span style={{ fontSize: 20, fontWeight: 900 }}>{av.slice(9).slice(0, 3).toUpperCase()}</span>;
  // Default: initials from display name or email
  return <span style={{ fontSize: 26, fontWeight: 900 }}>{(profile?.display_name || user?.email || "?").slice(0, 2).toUpperCase()}</span>;
}

function ProfileScreen({ onOpen, user, onSignOut, onSettings, profile, onProfileUpdate }) {
  const [trips, setTrips] = useState([]);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);

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
        <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}
          onClick={() => setShowAvatarEdit(true)}>
          <div style={S.profileAvatar}>
            {renderAvatarContent(profile, user)}
          </div>
          <div style={SP.avatarEditBadge}>✎</div>
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
            <div style={S.statNum}>{new Set(trips.map(t => {
              const raw = t.city || t.location || "";
              return raw.split(',')[0].trim().toLowerCase();
            }).filter(Boolean)).size}</div>
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

      {showAvatarEdit && (
        <AvatarEditSheet
          profile={profile} user={user}
          onClose={() => setShowAvatarEdit(false)}
          onSave={(updated) => { onProfileUpdate?.(updated); setShowAvatarEdit(false); }}
        />
      )}
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
            userProfile={profile}
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

const SP = {
  avatarEditBadge: {
    position: "absolute", bottom: 0, right: 0,
    background: P.surface2, border: `2px solid ${P.phoneBg}`,
    borderRadius: "50%", width: 26, height: 26,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, color: P.textSecondary, cursor: "pointer",
  },
};

function AvatarEditSheet({ profile, user, onClose, onSave }) {
  const [mode, setMode] = useState("initials"); // initials | emoji
  const [initialsVal, setInitialsVal] = useState(() => {
    const av = profile?.avatar;
    if (av?.startsWith('initials:')) return av.slice(9);
    if (av?.startsWith('name:')) return av.slice(5);
    return (profile?.display_name || user?.email || "").slice(0, 2).toUpperCase();
  });
  const [emojiVal, setEmojiVal] = useState(() => {
    const av = profile?.avatar;
    if (av?.startsWith('emoji:')) return av.slice(6);
    return "🌊";
  });
  const [saving, setSaving] = useState(false);

  const EMOJI_OPTIONS = ["🌊","🔥","⚡","🎯","🌙","🌈","🦋","🐉","🎸","🏄","🧠","💫","🌺","🦅","🎭","🍀","🌴","🎪","🚀","💎"];

  const preview = mode === "emoji" ? `emoji:${emojiVal}` : `initials:${initialsVal.slice(0,3).toUpperCase()}`;

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await supabase.from('profiles')
      .update({ avatar: preview }).eq('id', user.id).select().single();
    if (!error) onSave(data);
    setSaving(false);
  };

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Edit Avatar</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          {/* Preview */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ ...S.profileAvatar, width: 80, height: 80, fontSize: mode === "emoji" ? 36 : 24 }}>
              {mode === "emoji"
                ? <span style={{ fontSize: 36 }}>{emojiVal}</span>
                : <span style={{ fontSize: 22, fontWeight: 900 }}>{initialsVal.slice(0,3).toUpperCase() || "?"}</span>}
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            <button style={{ ...SN.whoChip, flex: 1, ...(mode === "initials" ? SN.whoChipOn : {}) }}
              onClick={() => setMode("initials")}>Initials</button>
            <button style={{ ...SN.whoChip, flex: 1, ...(mode === "emoji" ? SN.whoChipOn : {}) }}
              onClick={() => setMode("emoji")}>Emoji</button>
          </div>

          {mode === "initials" && (
            <div style={S.field}>
              <div style={S.fieldLbl}>UP TO 3 CHARACTERS</div>
              <input style={{ ...S.input, fontSize: 22, fontWeight: 900, letterSpacing: "4px", textAlign: "center" }}
                value={initialsVal} maxLength={3}
                onChange={e => setInitialsVal(e.target.value.toUpperCase())}
                placeholder="IVJ" />
            </div>
          )}

          {mode === "emoji" && (
            <div style={S.field}>
              <div style={S.fieldLbl}>PICK AN EMOJI</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                {EMOJI_OPTIONS.map(em => (
                  <button key={em}
                    style={{ fontSize: 28, background: emojiVal === em ? P.terracotta + "20" : P.surface2, border: emojiVal === em ? `1px solid ${P.terracotta}` : `1px solid ${P.surface3}`, borderRadius: 12, padding: "8px 10px", cursor: "pointer" }}
                    onClick={() => setEmojiVal(em)}>{em}</button>
                ))}
              </div>
              <input style={{ ...S.input, fontSize: 22, textAlign: "center" }}
                value={emojiVal} maxLength={2}
                onChange={e => setEmojiVal(e.target.value)}
                placeholder="Or type any emoji" />
            </div>
          )}

          <button style={{ ...S.primaryBtn, background: saving ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }}
            onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Avatar"}
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
  const showTime = trip.time && !trip.dates?.includes('–');

  return (
    <div style={{ ...S.tripCard, background: bg }} onClick={() => onOpen(trip)}>
      <button style={S.tcEditBtn} onClick={(e) => { e.stopPropagation(); onEdit(trip); }}>✎</button>
      <button style={S.tcDeleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(trip); }}>✕</button>
      <div style={S.tcTop}>
        <div style={{ ...S.tcIconWrap, background: P.terracotta + "20", border: `1px solid ${P.terracotta}30` }}>
          <IconComp size={26} color={P.terracotta} strokeWidth={1.5} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {trip.settled && <span style={S.settledBadge}>SETTLED</span>}
        </div>
      </div>
      <div style={S.tcName}>{trip.name}</div>
      <div style={S.tcLocation}>
        {trip.location} · {trip.dates}{showTime ? ` · ${trip.time}` : ""}
      </div>
      <div style={S.tcBottom}>
        {trip.total_spent > 0
          ? <div style={{ ...S.tcTotal, color: P.terracotta }}>${trip.total_spent.toLocaleString()}</div>
          : <div />}
        <ChevronRight size={18} color={P.terracotta + "80"} />
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
    { id: "summary",   label: "Summary",   Icon: BarChart2 },
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
        {activeTab === "summary"   && <SummaryTab trip={trip} settlements={settlements} myName={myName} />}
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
  const longPressTimers = useRef({});

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    for (const id of selectedIds) {
      await supabase.from('itinerary').delete().eq('id', id);
    }
    setItems(prev => prev.filter(i => !selectedIds.includes(i.id)));
    setSelectedIds([]);
    setSelecting(false);
  };

  const handleLongPressStart = (id) => {
    longPressTimers.current[id] = setTimeout(() => {
      setSelecting(true);
      setSelectedIds([id]);
    }, 500);
  };

  const handleLongPressEnd = (id) => {
    clearTimeout(longPressTimers.current[id]);
  };

  const handleItemTap = (item) => {
    if (selecting) {
      setSelectedIds(prev =>
        prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
      );
    } else {
      setEditingItem(item);
    }
  };

  const cancelSelection = () => {
    setSelecting(false);
    setSelectedIds([]);
  };

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
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Itinerary</div>
        {selecting
          ? <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.actionBtn, color: P.slateBlue }} onClick={cancelSelection}>Cancel</button>
              {selectedIds.length > 0 && (
                <button style={{ ...S.actionBtn, borderColor: P.danger + "60", color: P.danger }}
                  onClick={handleDeleteSelected}>Delete ({selectedIds.length})</button>
              )}
            </div>
          : <button style={{ ...S.actionBtn, borderColor: P.terracotta + "60", color: P.terracotta }}
              onClick={() => onModal("addItinerary")}>+ Add</button>
        }
      </div>

      {selecting && (
        <div style={SI.selectHint}>Long press to select · Tap to toggle · Delete when ready</div>
      )}

      {items.length === 0 && (
        <div style={SI.emptyState}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
          <div style={SI.emptyTitle}>No stops yet</div>
          <div style={SI.emptySub}>Tap + Add to start building your itinerary</div>
        </div>
      )}
        <div key={day} style={S.dayBlock}>
          <div style={SI.dayLabel}>{formatDayLabel(day)}</div>
          {items.filter(i => i.day === day).map(item => {
            const meta = ITINERARY_COLORS[item.type] || ITINERARY_COLORS.activity;
            // Use stored icon emoji if available, otherwise fall back to type icon component
            const hasEmojiIcon = item.icon && item.icon.length <= 4 && item.icon !== "🎯";
            const TypeIcon = ITIN_TYPE_ICONS[item.type] || Zap;
            const isSelected = selectedIds.includes(item.id);
            const hasLocation = item.type === "stay" || item.type === "restaurant";
            // Format time as 12hr
            const formatTime12 = (t) => {
              if (!t) return "—";
              const [h, m] = t.split(':').map(Number);
              if (isNaN(h)) return t;
              const ampm = h >= 12 ? 'pm' : 'am';
              const hr = h % 12 || 12;
              return `${hr}:${String(m).padStart(2, '0')}${ampm}`;
            };
            return (
              <div
                key={item.id}
                style={{ ...SI.item, borderLeftColor: meta.accent, ...(isSelected ? SI.itemSelected : {}) }}
                onClick={() => handleItemTap(item)}
                onTouchStart={() => handleLongPressStart(item.id)}
                onTouchEnd={() => handleLongPressEnd(item.id)}
                onMouseDown={() => handleLongPressStart(item.id)}
                onMouseUp={() => handleLongPressEnd(item.id)}
                onMouseLeave={() => handleLongPressEnd(item.id)}
              >
                {/* Time */}
                <div style={SI.timeCol}>
                  <span style={SI.time}>{formatTime12(item.time)}</span>
                </div>

                {/* Content */}
                <div style={SI.content}>
                  <div style={SI.titleRow}>
                    {hasEmojiIcon
                      ? <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                      : <TypeIcon size={16} color={meta.accent} strokeWidth={2} style={{ flexShrink: 0 }} />
                    }
                    <span style={SI.title}>{item.title}</span>
                    {hasLocation && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(item.title + " " + (item.detail || ""))}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={SI.mapsLink}>
                        <MapPin size={11} /> Maps
                      </a>
                    )}
                  </div>
                  {item.detail ? <div style={SI.detail}>{item.detail}</div> : null}
                </div>

                {/* Selection indicator */}
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
  dayLabel: {
    fontSize: 12, fontWeight: 800, color: P.slateBlue,
    letterSpacing: "0.5px", marginBottom: 10, marginTop: 4,
    fontFamily: "'DM Sans', sans-serif",
  },
  selectHint: {
    fontSize: 12, color: P.textMuted, textAlign: "center",
    marginBottom: 12, fontFamily: "'DM Sans', sans-serif",
  },
  item: {
    display: "flex", alignItems: "flex-start", gap: 14,
    background: P.surface1, borderRadius: 14,
    borderLeft: `3px solid transparent`,
    padding: "14px 14px 14px 16px",
    marginBottom: 10, cursor: "pointer",
    border: `1px solid ${P.surface3}`,
    borderLeftWidth: 3,
    userSelect: "none",
    transition: "background 0.15s",
  },
  itemSelected: {
    background: P.surface2,
    borderColor: P.terracotta + "40",
  },
  timeCol: {
    flexShrink: 0, width: 52, paddingTop: 2,
  },
  time: {
    fontSize: 14, color: P.textSecondary, fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
  },
  content: { flex: 1, minWidth: 0 },
  titleRow: {
    display: "flex", alignItems: "center", gap: 6,
    marginBottom: 4, flexWrap: "nowrap",
  },
  title: {
    fontSize: 16, fontWeight: 700, color: P.textPrimary,
    letterSpacing: "-0.3px", fontFamily: "'Syne', sans-serif",
    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  mapsLink: {
    color: P.lightBlue, fontSize: 11, fontWeight: 700,
    textDecoration: "none", flexShrink: 0,
    display: "flex", alignItems: "center", gap: 2,
  },
  detail: {
    fontSize: 13, color: P.textMuted,
    fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: "50%",
    border: `2px solid ${P.surface3}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 2,
  },
  checkboxOn: {
    background: P.terracotta,
    border: `2px solid ${P.terracotta}`,
  },
  emptyState: {
    textAlign: "center", padding: "48px 24px",
    background: P.surface1, borderRadius: 18,
    border: `1px dashed ${P.surface3}`, marginTop: 8,
  },
  emptyTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: 18,
    fontWeight: 800, color: P.textPrimary, marginBottom: 8,
  },
  emptySub: {
    fontSize: 13, color: P.slateBlue,
    fontFamily: "'DM Sans', sans-serif",
  },
};

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
          {myOwed > 0
            ? <div style={{ ...S.expSumVal, color: P.danger }}>${myOwed}</div>
            : <div style={{ ...S.expSumVal, color: P.success }}>Even</div>}
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

// ─── SUMMARY TAB ─────────────────────────────────────────────────────────────

function SummaryTab({ trip, settlements, myName }) {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [itinCount, setItinCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    supabase.from('members').select('*').eq('trip_id', trip.id).then(({ data }) => setMembers(data || []));
    supabase.from('expenses').select('*').eq('trip_id', trip.id).then(({ data }) => setExpenses(data || []));
    supabase.from('itinerary').select('id').eq('trip_id', trip.id).then(({ data }) => setItinCount(data?.length || 0));
    supabase.from('photos').select('id').eq('trip_id', trip.id).then(({ data }) => setPhotoCount(data?.length || 0));
  }, [trip.id]);

  const total = expenses.reduce((a, e) => a + (e.amount || 0), 0);
  const myOwed = settlements.filter(s => s.from === myName).reduce((a, s) => a + s.amount, 0);
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Summary</div>
      </div>

      {/* Stats row */}
      <div style={SS.statsGrid}>
        <div style={SS.statCard}>
          <div style={SS.statVal}>${total.toLocaleString()}</div>
          <div style={SS.statLbl}>total spent</div>
        </div>
        <div style={SS.statCard}>
          <div style={SS.statVal}>{members.length}</div>
          <div style={SS.statLbl}>travelers</div>
        </div>
        <div style={SS.statCard}>
          <div style={{ ...SS.statVal, color: myOwed > 0 ? P.danger : P.success }}>
            {myOwed > 0 ? `-$${myOwed}` : "Even"}
          </div>
          <div style={SS.statLbl}>your balance</div>
        </div>
        <div style={SS.statCard}>
          <div style={SS.statVal}>{itinCount}</div>
          <div style={SS.statLbl}>stops</div>
        </div>
      </div>

      {/* Trip details */}
      <div style={SS.section}>
        <div style={SS.sectionLabel}>TRIP DETAILS</div>
        <div style={SS.detailCard}>
          <div style={SS.detailRow}>
            <span style={SS.detailLbl}>Destination</span>
            <span style={SS.detailVal}>{trip.location || "—"}</span>
          </div>
          <div style={SS.detailRow}>
            <span style={SS.detailLbl}>Dates</span>
            <span style={SS.detailVal}>{trip.dates || "—"}</span>
          </div>
          <div style={SS.detailRow}>
            <span style={SS.detailLbl}>Travelers</span>
            <span style={SS.detailVal}>{members.map(m => m.name).join(", ") || "—"}</span>
          </div>
          <div style={{ ...SS.detailRow, borderBottom: "none" }}>
            <span style={SS.detailLbl}>Memories</span>
            <span style={SS.detailVal}>{photoCount} photo{photoCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Spend by category */}
      {Object.keys(categoryTotals).length > 0 && (
        <div style={SS.section}>
          <div style={SS.sectionLabel}>SPEND BREAKDOWN</div>
          <div style={SS.detailCard}>
            {Object.entries(categoryTotals).map(([cat, amt], i, arr) => {
              const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
              const meta = { Stay: P.success, Food: P.terracotta, Activity: P.lightBlue, Transport: "#a090d0" };
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

      {/* Settlement status */}
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

// Vibe definitions — short-form vibes adapt location input to specific place
const VIBES = [
  { key: "trip",     label: "Trip",          emoji: "✈️", icon: Plane,        shortForm: false },
  { key: "road",     label: "Road Trip",     emoji: "🚗", icon: Car,          shortForm: false },
  { key: "weekend",  label: "Weekend Away",  emoji: "🌅", icon: Sunset,       shortForm: false },
  { key: "hike",     label: "Hike",          emoji: "🏔️", icon: Mountain,     shortForm: false },
  { key: "camping",  label: "Camping",       emoji: "🏕️", icon: Tent,        shortForm: false },
  { key: "concert",  label: "Concert",       emoji: "🎵", icon: Music,        shortForm: true  },
  { key: "dinner",   label: "Dinner",        emoji: "🍽️", icon: UtensilsCrossed, shortForm: true },
  { key: "coffee",   label: "Coffee",        emoji: "☕", icon: Coffee,       shortForm: true  },
  { key: "drinks",   label: "Drinks",        emoji: "🍷", icon: Wine,         shortForm: true  },
  { key: "nightout", label: "Night Out",     emoji: "🎉", icon: PartyPopper,  shortForm: true  },
  { key: "active",   label: "Workout",       emoji: "💪", icon: Dumbbell,     shortForm: true  },
  { key: "beach",    label: "Beach Day",     emoji: "🏖️", icon: Umbrella,    shortForm: false },
  { key: "other",    label: "Other",         emoji: "✨", icon: Sparkles,    shortForm: false },
];

function NewTripModal({ onClose, onSave, userId, userProfile }) {
  const [step, setStep] = useState(1); // 1=vibe, 2=where, 3=who, 4=when, 5=confirm
  const [answers, setAnswers] = useState({
    vibe: null,       // vibe object
    location: "",     // place name or city
    who: [],          // array of email strings, empty = solo
    solo: false,
    startDate: "",
    endDate: "",
    time: "",
    generatedName: "",
    editedName: "",
    emoji: "",
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const isShortForm = answers.vibe?.shortForm || false;

  // Animate previous answers stacking at top
  const Receipt = () => {
    const items = [];
    if (step > 1 && answers.vibe) items.push({ label: "vibe", value: `${answers.vibe.emoji} ${answers.vibe.label}` });
    if (step > 2 && answers.location) items.push({ label: "where", value: answers.location });
    if (step > 3) items.push({ label: "who", value: answers.solo ? "Just me" : answers.who.length ? `${answers.who.length} people` : "Just me" });
    if (step > 4 && answers.startDate) {
      const d = new Date(answers.startDate + 'T12:00:00');
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = answers.time ? (() => {
        const [h, m] = answers.time.split(':').map(Number);
        const ampm = h >= 12 ? 'pm' : 'am';
        return ` · ${h % 12 || 12}:${String(m).padStart(2,'0')}${ampm}`;
      })() : "";
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

  // Step 1 — What's the vibe?
  const StepVibe = () => (
    <div style={SN.stepWrap}>
      <Receipt />
      <div style={SN.question}>What's the vibe?</div>
      <div style={SN.vibeGrid}>
        {VIBES.map(v => {
          const Icon = v.icon;
          const selected = answers.vibe?.key === v.key;
          return (
            <button key={v.key}
              style={{ ...SN.vibeTile, ...(selected ? SN.vibeTileOn : {}) }}
              onClick={() => {
                setAnswers(a => ({ ...a, vibe: v, emoji: v.emoji }));
                setTimeout(() => setStep(2), 180);
              }}>
              <Icon size={22} color={selected ? P.terracotta : P.textSecondary} strokeWidth={1.5} />
              <span style={{ ...SN.vibeLabel, color: selected ? P.terracotta : P.textSecondary }}>{v.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Step 2 — Where to?
  const StepWhere = () => (
    <div style={SN.stepWrap}>
      <Receipt />
      <div style={SN.question}>Where to?</div>
      <div style={SN.subQuestion}>
        {isShortForm ? "Name the spot" : "City or destination"}
      </div>
      <input
        style={{ ...S.input, fontSize: 18, padding: "16px", marginBottom: 12 }}
        placeholder={isShortForm ? "e.g. Barista, Ox Restaurant" : "e.g. Tokyo, Banff, Portland"}
        value={answers.location}
        onChange={e => setAnswers(a => ({ ...a, location: e.target.value }))}
        autoFocus
      />
      <button
        style={{ ...SN.nextBtn, opacity: answers.location.trim() ? 1 : 0.4 }}
        disabled={!answers.location.trim()}
        onClick={() => setStep(3)}>
        Next →
      </button>
    </div>
  );

  // Step 3 — Who's coming?
  const [emailInput, setEmailInput] = useState("");
  const addEmail = () => {
    if (emailInput.trim()) {
      setAnswers(a => ({ ...a, who: [...a.who, emailInput.trim()] }));
      setEmailInput("");
    }
  };

  const StepWho = () => (
    <div style={SN.stepWrap}>
      <Receipt />
      <div style={SN.question}>Who's coming?</div>
      <div style={SN.whoRow}>
        <button
          style={{ ...SN.whoChip, ...(answers.solo ? SN.whoChipOn : {}) }}
          onClick={() => setAnswers(a => ({ ...a, solo: true, who: [] }))}>
          Just me
        </button>
        <button
          style={{ ...SN.whoChip, ...(!answers.solo ? SN.whoChipOn : {}) }}
          onClick={() => setAnswers(a => ({ ...a, solo: false }))}>
          + Add people
        </button>
      </div>
      {!answers.solo && (
        <div style={{ marginTop: 16 }}>
          <div style={SN.emailRow}>
            <input
              style={{ ...S.input, flex: 1, fontSize: 15 }}
              placeholder="friend@email.com"
              value={emailInput}
              type="email"
              autoComplete="off"
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addEmail(); }}
            />
            <button style={SN.addEmailBtn} onClick={addEmail}>Add</button>
          </div>
          {answers.who.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {answers.who.map((email, i) => (
                <div key={i} style={SN.emailTag}>
                  <span>{email}</span>
                  <button style={SN.removeEmail}
                    onClick={() => setAnswers(a => ({ ...a, who: a.who.filter((_, j) => j !== i) }))}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button style={{ ...SN.nextBtn, marginTop: 20 }} onClick={() => setStep(4)}>
        Next →
      </button>
    </div>
  );

  // Step 4 — When?
  const StepWhen = () => (
    <div style={SN.stepWrap}>
      <Receipt />
      <div style={SN.question}>When?</div>
      <div style={S.field}>
        <div style={S.fieldLbl}>DATE</div>
        <input style={{ ...S.input, colorScheme: "dark" }} type="date"
          value={answers.startDate}
          onChange={e => setAnswers(a => ({ ...a, startDate: e.target.value }))} />
      </div>
      {!isShortForm && (
        <div style={S.field}>
          <div style={{ ...S.fieldLbl, display: "flex", justifyContent: "space-between" }}>
            <span>END DATE</span>
            <span style={{ color: P.textMuted }}>optional</span>
          </div>
          <input style={{ ...S.input, colorScheme: "dark" }} type="date"
            value={answers.endDate} min={answers.startDate}
            onChange={e => setAnswers(a => ({ ...a, endDate: e.target.value }))} />
        </div>
      )}
      {isShortForm && (
        <div style={S.field}>
          <div style={{ ...S.fieldLbl, display: "flex", justifyContent: "space-between" }}>
            <span>TIME</span>
            <span style={{ color: P.textMuted }}>optional</span>
          </div>
          <input style={{ ...S.input, colorScheme: "dark" }} type="time"
            value={answers.time}
            onChange={e => setAnswers(a => ({ ...a, time: e.target.value }))} />
        </div>
      )}
      <button
        style={{ ...SN.nextBtn, opacity: answers.startDate ? 1 : 0.4 }}
        disabled={!answers.startDate}
        onClick={handleGenerateName}>
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
      const res = await fetch("/api/parse-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText, mode: "name" }),
      });
      const data = await res.json();
      const name = (data.content?.[0]?.text || "").trim().replace(/^"|"$/g, '');
      setAnswers(a => ({ ...a, generatedName: name, editedName: name }));
    } catch (e) {
      const fallback = `${answers.vibe?.label} at ${answers.location}`;
      setAnswers(a => ({ ...a, generatedName: fallback, editedName: fallback }));
    } finally {
      setGenerating(false);
      setStep(5);
    }
  };

  // Shared time formatter for confirm screen and receipt
  const formatTime12 = (t) => {
    if (!t) return "";
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'pm' : 'am';
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')}${ampm}`;
  };

  // Step 5 — Looks good?
  const StepConfirm = () => {
    const IconComp = TRIP_ICONS[answers.emoji] || Plane;
    const dateStr = formatDates(answers.startDate, answers.endDate);
    const timeStr = formatTime12(answers.time);
    return (
      <div style={SN.stepWrap}>
        <Receipt />
        <div style={SN.question}>Looks good?</div>
        <div style={SN.confirmCard}>
          <div style={SN.confirmIcon}>
            <IconComp size={28} color={P.terracotta} strokeWidth={1.5} />
          </div>
          <input
            style={SN.nameInput}
            value={answers.editedName}
            onChange={e => {
              const val = e.target.value;
              setAnswers(a => ({ ...a, editedName: val }));
            }}
            autoFocus={false}
          />
          <div style={SN.confirmMeta}>
            {answers.location}{dateStr ? ` · ${dateStr}` : ""}
            {timeStr ? ` · ${timeStr}` : ""}
          </div>
          <div style={SN.confirmPeople}>
            {answers.solo ? "Just you" : answers.who.length ? `You + ${answers.who.length} others` : "Just you"}
          </div>
        </div>
        <div style={{ fontSize: 12, color: P.textMuted, textAlign: "center", marginBottom: 16 }}>
          Tap the name to edit it
        </div>
        <button
          style={{ ...SN.nextBtn, background: saving ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }}
          onClick={handleSave} disabled={saving}>
          {saving ? "Working on it..." : "Let's go ✓"}
        </button>
      </div>
    );
  };

  const handleSave = async () => {
    if (!answers.editedName) return;
    setSaving(true);
    try {
      const dates = formatDates(answers.startDate, answers.endDate);
      const location = answers.location;

      // Create trip (no tag/bg — uses global palette)
      const { data: tripData, error: tripError } = await supabase.from('trips').insert([{
        name: answers.editedName,
        location,
        city: !answers.vibe?.shortForm ? location : "",
        emoji: answers.emoji || "✈️",
        dates,
        start_date: answers.startDate || null,
        end_date: answers.endDate || null,
        time: answers.time || null,
        total_spent: 0,
        settled: false,
        solo: answers.solo || answers.who.length === 0,
        user_id: userId,
      }]).select();
      if (tripError) throw tripError;
      const trip = tripData[0];

      // Add creator as member
      await supabase.from('trip_members').insert([{
        trip_id: trip.id, user_id: userId, role: 'owner', status: 'accepted'
      }]);

      // Add creator to members table (check first to avoid duplicate)
      const creatorName = userProfile?.display_name || "Me";
      const { data: existingMember } = await supabase.from('members')
        .select('id').eq('trip_id', trip.id).eq('name', creatorName).single();
      if (!existingMember) {
        await supabase.from('members').insert([{ trip_id: trip.id, name: creatorName }]);
      }

      // Invite others
      for (const email of answers.who) {
        const { data: existingUser } = await supabase.rpc('get_user_id_by_email', { email_input: email.toLowerCase() });
        const linkedUserId = existingUser?.[0]?.id || null;
        await supabase.from('trip_members').insert([{
          trip_id: trip.id, user_id: linkedUserId, invited_email: email.toLowerCase(),
          role: 'member', status: linkedUserId ? 'accepted' : 'pending'
        }]);
        let displayName = email.split('@')[0];
        if (linkedUserId) {
          const { data: pd } = await supabase.from('profiles').select('display_name').eq('id', linkedUserId).single();
          if (pd?.display_name) displayName = pd.display_name;
        }
        await supabase.from('members').insert([{ trip_id: trip.id, name: displayName }]);
      }

      // For short-form vibes with a specific place — auto-create itinerary item
      if (answers.vibe?.shortForm && answers.location) {
        const itinType = ['dinner', 'coffee', 'drinks'].includes(answers.vibe.key) ? 'restaurant' : 'activity';
        // Use vibe's own icon key so itinerary item matches the trip vibe
        const vibeIconKey = answers.vibe.emoji;
        await supabase.from('itinerary').insert([{
          trip_id: trip.id,
          day: answers.startDate,
          time: answers.time || "",
          type: itinType,
          title: answers.location,
          detail: "",
          icon: vibeIconKey,
          visibility: "group",
        }]);
      }

      onSave(trip);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const STEP_LABELS = ["", "vibe", "where", "who", "when", "confirm"];

  return (
    <div style={S.overlay}>
      <div style={{ ...S.sheet, maxHeight: "92%" }}>
        <div style={S.sheetHandle} />
        <div style={SN.header}>
          {step > 1
            ? <button style={SN.backBtn} onClick={goBack}>← Back</button>
            : <div />}
          <div style={SN.stepIndicator}>
            {[1,2,3,4,5].map(n => (
              <div key={n} style={{ ...SN.stepPip, ...(n <= step ? SN.stepPipOn : n === step ? SN.stepPipCurrent : {}) }} />
            ))}
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.sheetBody}>
          {step === 1 && <StepVibe />}
          {step === 2 && <StepWhere />}
          {step === 3 && <StepWho />}
          {step === 4 && <StepWhen />}
          {step === 5 && <StepConfirm />}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// New trip flow styles
const SN = {
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 22px 8px",
  },
  backBtn: {
    background: "transparent", border: "none", color: P.slateBlue,
    fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  stepIndicator: { display: "flex", gap: 6 },
  stepPip: { width: 6, height: 6, borderRadius: "50%", background: P.surface3 },
  stepPipOn: { background: P.terracotta },
  stepPipCurrent: { background: P.slateBlue },
  stepWrap: { paddingBottom: 12 },
  receipt: {
    background: P.surface2, borderRadius: 14, padding: "12px 16px",
    marginBottom: 24, border: `1px solid ${P.surface3}`,
  },
  receiptRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", paddingBottom: 6, marginBottom: 6,
    borderBottom: `1px solid ${P.surface3}`,
  },
  receiptLabel: { fontSize: 10, fontWeight: 800, color: P.textMuted, letterSpacing: "2px" },
  receiptValue: { fontSize: 14, fontWeight: 700, color: P.textPrimary },
  question: {
    fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 900,
    color: P.textPrimary, letterSpacing: "-0.8px", marginBottom: 6,
  },
  subQuestion: {
    fontSize: 13, color: P.slateBlue, marginBottom: 18,
    fontFamily: "'DM Sans', sans-serif",
  },
  vibeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 },
  vibeTile: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 8, background: P.surface2, border: `1px solid ${P.surface3}`,
    borderRadius: 16, padding: "16px 8px", cursor: "pointer",
    minHeight: 80,
  },
  vibeTileOn: {
    background: P.terracotta + "18",
    border: `1px solid ${P.terracotta}70`,
  },
  vibeLabel: { fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  nextBtn: {
    width: "100%", background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`,
    color: "#fff", border: "none", borderRadius: 16, padding: "16px",
    fontSize: 16, fontWeight: 800, cursor: "pointer",
    fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px",
  },
  whoRow: { display: "flex", gap: 10, marginTop: 16 },
  whoChip: {
    flex: 1, background: P.surface2, border: `1px solid ${P.surface3}`,
    borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700,
    color: P.textMuted, cursor: "pointer", textAlign: "center",
    fontFamily: "'DM Sans', sans-serif",
  },
  whoChipOn: {
    background: P.terracotta + "18",
    border: `1px solid ${P.terracotta}60`,
    color: P.terracotta,
  },
  emailRow: { display: "flex", gap: 8 },
  addEmailBtn: {
    background: P.surface3, border: "none", color: P.textPrimary,
    borderRadius: 12, padding: "0 18px", fontSize: 14, fontWeight: 700,
    cursor: "pointer", flexShrink: 0,
  },
  emailTag: {
    display: "flex", alignItems: "center", gap: 6,
    background: P.surface2, border: `1px solid ${P.surface3}`,
    borderRadius: 22, padding: "6px 12px", fontSize: 13, color: P.textSecondary,
  },
  removeEmail: {
    background: "transparent", border: "none", color: P.textMuted,
    cursor: "pointer", fontSize: 11, padding: 0, lineHeight: 1,
  },
  confirmCard: {
    background: `linear-gradient(135deg, ${P.surface1}, ${P.surface2})`,
    border: `1px solid ${P.surface3}`,
    borderRadius: 20, padding: "24px", marginBottom: 16, textAlign: "center",
  },
  confirmIcon: {
    width: 52, height: 52, borderRadius: 16,
    background: P.terracotta + "20", border: `1px solid ${P.terracotta}30`,
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
  },
  nameInput: {
    background: "transparent", border: "none", borderBottom: `1px solid ${P.surface3}`,
    color: P.textPrimary, fontSize: 22, fontWeight: 900, letterSpacing: "-0.8px",
    width: "100%", textAlign: "center", outline: "none", marginBottom: 12,
    fontFamily: "'Syne', sans-serif", padding: "4px 0",
  },
  confirmMeta: { fontSize: 13, color: P.textSecondary, marginBottom: 6 },
  confirmPeople: { fontSize: 13, color: P.slateBlue },
};

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
