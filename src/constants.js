import {
  Plane, Mountain, Bike, Umbrella, Map, Snowflake, Car, Anchor, Tent, Theater,
  UtensilsCrossed, Hotel, Zap, Train,
  Coffee, Wine, Music, ShoppingBag, Dumbbell, PartyPopper, House, Sunset, Camera,
  MapPin, Trophy, Users, Ticket,
} from "lucide-react";

// ─── PALETTE ──────────────────────────────────────────────────────────────────

export const P = {
  outerBg:       "#0d1e28",
  phoneBg:       "#112233",
  surface1:      "#162c3a",
  surface2:      "#1c3448",
  surface3:      "#243d52",
  terracotta:    "#e4a576",
  orange:        "#f07340",
  slateBlue:     "#698ea2",
  lightBlue:     "#b8d4e0",
  textPrimary:   "#f0ebe4",
  textSecondary: "#9ab0bd",
  textMuted:     "#4e6b7a",
  danger:        "#e07070",
  dangerBg:      "#2a1515",
  success:       "#6bbf8a",
  successBg:     "#142a1e",
};

// ─── ITINERARY ────────────────────────────────────────────────────────────────

export const ITINERARY_COLORS = {
  flight:      { accent: P.lightBlue },
  transport:   { accent: "#a090d0" },
  stay:        { accent: "#6bbf8a" },
  restaurant:  { accent: "#e4a0b0" },
  drinks:      { accent: P.orange },
  activity:    { accent: P.terracotta },
  event:       { accent: "#f0c060" },
  gathering:   { accent: "#80c8a0" },
  celebration: { accent: "#f080c0" },
  shopping:    { accent: "#d4a0e0" },
  other:       { accent: P.slateBlue },
};

export const ITIN_TYPE_ICONS = {
  flight: Plane, transport: Train, stay: Hotel,
  restaurant: UtensilsCrossed, drinks: Wine,
  activity: Zap, event: Ticket, gathering: Users,
  celebration: PartyPopper, shopping: ShoppingBag, other: MapPin,
};

export const ITIN_TYPES = ["flight","transport","stay","restaurant","drinks","activity","event","gathering","celebration","shopping","other"];

export const TYPE_PLACEHOLDERS = {
  flight:      "e.g. PDX to LAX",
  transport:   "e.g. Dollar Car Rental",
  stay:        "e.g. Fairmont Lake Louise",
  restaurant:  "e.g. Nobu Houston",
  drinks:      "e.g. Teardrop Cocktail Lounge",
  activity:    "e.g. Museum of Fine Arts",
  event:       "e.g. Taylor Swift · MSG",
  gathering:   "e.g. Cookout at Derek's",
  celebration: "e.g. Sarah's 30th Birthday",
  shopping:    "e.g. Galleria Mall",
  other:       "e.g. Scenic overlook",
};

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

export const CATEGORY_META = {
  Dining:      { color: "#e4a0b0", bg: "#2a1520" },
  Drinks:      { color: P.orange,  bg: "#2a1c10" },
  Stay:        { color: "#6bbf8a", bg: "#142a1e" },
  Activity:    { color: P.lightBlue, bg: "#162840" },
  Event:       { color: "#f0c060", bg: "#2a2010" },
  Celebration: { color: "#f080c0", bg: "#2a1028" },
  Shopping:    { color: "#d4a0e0", bg: "#1e1a2a" },
  Travel:      { color: "#a090d0", bg: "#1a1e2a" },
  Flight:      { color: P.lightBlue, bg: "#102030" },
  Other:       { color: P.slateBlue, bg: "#162030" },
};

export const CAT_ICONS = {
  Dining: UtensilsCrossed, Drinks: Wine, Stay: Hotel,
  Activity: Zap, Event: Ticket, Celebration: PartyPopper,
  Shopping: ShoppingBag, Travel: Train, Flight: Plane, Other: MapPin,
};

export const CATS = ["Dining","Drinks","Stay","Activity","Event","Celebration","Shopping","Travel","Flight","Other"];

// ─── TRIPS ────────────────────────────────────────────────────────────────────

export const TRIP_ICONS = {
  "✈️": Plane, "🏔️": Mountain, "🚴": Bike, "🏖️": Umbrella,
  "🗾": Map, "🎿": Snowflake, "🚗": Car, "⛵": Anchor,
  "🏕️": Tent, "🎭": Theater, "☕": Coffee, "🍷": Wine,
  "🎵": Music, "🛍️": ShoppingBag, "💪": Dumbbell, "🎉": PartyPopper,
  "🏠": House, "🌅": Sunset, "📸": Camera, "🍽️": UtensilsCrossed,
  "🎊": PartyPopper, "🥂": Wine, "📍": MapPin, "🏆": Trophy, "🥗": UtensilsCrossed,
};

export const TRIP_ICON_LIST = [
  { key: "✈️", Icon: Plane,            label: "Flight" },
  { key: "🏔️", Icon: Mountain,         label: "Adventure" },
  { key: "🚴", Icon: Bike,             label: "Cycling" },
  { key: "🏖️", Icon: Umbrella,         label: "Beach" },
  { key: "🗾", Icon: Map,              label: "Explore" },
  { key: "🎿", Icon: Snowflake,        label: "Snow" },
  { key: "🚗", Icon: Car,              label: "Road trip" },
  { key: "⛵", Icon: Anchor,           label: "Sailing" },
  { key: "🏕️", Icon: Tent,            label: "Camping" },
  { key: "🎭", Icon: Theater,          label: "Culture" },
  { key: "☕", Icon: Coffee,           label: "Coffee" },
  { key: "🍷", Icon: Wine,             label: "Drinks" },
  { key: "🎵", Icon: Music,            label: "Concert" },
  { key: "🛍️", Icon: ShoppingBag,     label: "Shopping" },
  { key: "💪", Icon: Dumbbell,         label: "Active" },
  { key: "🎉", Icon: PartyPopper,      label: "Celebrate" },
  { key: "🏠", Icon: House,            label: "Staycation" },
  { key: "🌅", Icon: Sunset,           label: "Getaway" },
  { key: "📸", Icon: Camera,           label: "Photo trip" },
  { key: "🍽️", Icon: UtensilsCrossed, label: "Dinner" },
];

// ─── VIBES ────────────────────────────────────────────────────────────────────

export const VIBES = [
  { key: "trip",        label: "Trip",        emoji: "✈️", icon: Plane,           shortForm: false },
  { key: "road",        label: "Road Trip",   emoji: "🚗", icon: Car,             shortForm: false },
  { key: "staycation",  label: "Staycation",  emoji: "🏠", icon: House,           shortForm: false },
  { key: "hike",        label: "Hike",        emoji: "🏔️", icon: Mountain,        shortForm: false },
  { key: "camping",     label: "Camping",     emoji: "🏕️", icon: Tent,            shortForm: false },
  { key: "concert",     label: "Concert",     emoji: "🎵", icon: Music,           shortForm: true  },
  { key: "dinner",      label: "Dinner",      emoji: "🍽️", icon: UtensilsCrossed, shortForm: true  },
  { key: "brunch",      label: "Brunch",      emoji: "🥂", icon: UtensilsCrossed, shortForm: true  },
  { key: "lunch",       label: "Lunch",       emoji: "🥗", icon: UtensilsCrossed, shortForm: true  },
  { key: "coffee",      label: "Coffee",      emoji: "☕", icon: Coffee,          shortForm: true  },
  { key: "drinks",      label: "Drinks",      emoji: "🍷", icon: Wine,            shortForm: true  },
  { key: "nightout",    label: "Night Out",   emoji: "🎉", icon: PartyPopper,     shortForm: true  },
  { key: "active",      label: "Workout",     emoji: "💪", icon: Zap,             shortForm: true  },
  { key: "beach",       label: "Beach Day",   emoji: "🏖️", icon: Umbrella,        shortForm: false },
  { key: "celebration", label: "Celebration", emoji: "🎊", icon: PartyPopper,     shortForm: true  },
  { key: "gameday",     label: "Game Day",    emoji: "🏆", icon: Trophy,          shortForm: true  },
  { key: "getaway",     label: "Getaway",     emoji: "🌅", icon: Sunset,          shortForm: false },
  { key: "meetup",      label: "Meetup",      emoji: "📍", icon: MapPin,          shortForm: true  },
];

// ─── METRICS ──────────────────────────────────────────────────────────────────

export const METRIC_DEFS = [
  { key: "trips",       label: "trips",       tier: "Personal" },
  { key: "cities",      label: "cities",      tier: "Personal" },
  { key: "thisyear",    label: "this year",   tier: "Personal" },
  { key: "nights",      label: "nights away", tier: "Personal" },
  { key: "people",      label: "people",      tier: "Personal" },
  { key: "countries",   label: "countries",   tier: "Personal" },
  { key: "restaurants", label: "restaurants", tier: "Activity" },
  { key: "activities",  label: "activities",  tier: "Activity" },
  { key: "stays",       label: "stays",       tier: "Activity" },
  { key: "stops",       label: "stops",       tier: "Activity" },
  { key: "memories",    label: "memories",    tier: "Activity" },
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
  { key: "spent",       label: "total spent", tier: "Financial", prefix: "$" },
  { key: "expenses",    label: "expenses",    tier: "Financial" },
];

export const DEFAULT_METRICS = ["trips", "cities", "thisyear"];

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

export const S = {
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
  tripShell: { flex: 1, display: "flex", flexDirection: "column", height: "100%", position: "relative" },
  backBtn: { background: "rgba(255,255,255,0.08)", border: "none", color: P.textPrimary, fontSize: 20, cursor: "pointer", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  thIconWrap: { width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
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
  uploadDrop: { border: `1.5px dashed ${P.surface3}`, borderRadius: 18, padding: "28px", textAlign: "center", cursor: "pointer" },
  uploadIcon: { fontSize: 28, marginBottom: 8 },
  uploadText: { fontSize: 15, fontWeight: 700, color: P.textMuted, marginBottom: 4 },
  uploadSub: { fontSize: 13, color: P.textMuted },
  memberRow: { display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: `1px solid ${P.surface1}` },
  memberAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, flexShrink: 0 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: 700, color: P.textPrimary, display: "flex", alignItems: "center", gap: 6 },
  memberRight: {},
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
  settleRow: { background: P.surface2, borderRadius: 16, padding: "16px", marginBottom: 10, display: "flex", flexDirection: "column", transition: "opacity 0.2s", border: `1px solid ${P.surface3}` },
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