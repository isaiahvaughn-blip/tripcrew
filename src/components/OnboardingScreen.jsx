import { useState, useRef } from "react";
import { supabase } from "../supabase";
import { P } from "../constants";
import { Plane, DollarSign, Image, Map as MapIcon, Scale, Coffee, PartyPopper } from "lucide-react";

const ICON_MAP = { plane: Plane, coffee: Coffee, party: PartyPopper, map: MapIcon, dollar: DollarSign, image: Image, scale: Scale };

const CARDS = [
  {
    icons: ["plane", "coffee", "party"],
    headline: "Every plan starts here",
    sub: "The trips, dinners, and nights out worth remembering — all in one place.",
    accent: P.terracotta,
  },
  {
    icons: ["map", "dollar", "image"],
    headline: "Every detail, every memory",
    sub: "Itinerary, expenses, and photos — all in one place, always in sync.",
    accent: P.lightBlue,
  },
  {
    icons: ["scale"],
    headline: "Settle up, simply",
    sub: "See who owes what. No spreadsheets.",
    accent: P.success,
  },
];

function OnboardingCards({ onDone }) {
  const [card, setCard] = useState(0);
  const startX = useRef(null);

  const next = () => card < CARDS.length - 1 ? setCard(c => c + 1) : onDone();
  const skip = () => onDone();

  const handleTouchStart = e => { startX.current = e.touches[0].clientX; };
  const handleTouchEnd   = e => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 40)       next();
    else if (diff < -40) setCard(c => Math.max(0, c - 1));
    startX.current = null;
  };

  const c = CARDS[card];
  const isLast = card === CARDS.length - 1;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, background: P.phoneBg, display: "flex", flexDirection: "column", overflow: "hidden" }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* Skip */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "52px 24px 0", flexShrink: 0 }}>
        <button onClick={skip} style={{ background: "transparent", border: "none", color: P.textMuted, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Skip
        </button>
      </div>

      {/* Card content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 36px", textAlign: "center" }}>
        {/* Icon cluster */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 40, alignItems: "center" }}>
          {c.icons.map((icon, i) => {
            const Icon = ICON_MAP[icon];
            if (!Icon) return null;
            const isCenter = i === 1 || c.icons.length === 1;
            return (
              <div key={i} style={{ width: isCenter ? 72 : 52, height: isCenter ? 72 : 52, borderRadius: 20, background: c.accent + "18", border: `1px solid ${c.accent}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={isCenter ? 32 : 22} color={c.accent} strokeWidth={1.5} />
              </div>
            );
          })}
        </div>

        {/* Headline */}
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: P.textPrimary, letterSpacing: "-1.5px", marginBottom: 16, fontStyle: "italic", lineHeight: 1.15 }}>
          {c.headline}
        </div>

        {/* Sub */}
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: P.textSecondary, lineHeight: 1.6, maxWidth: 300 }}>
          {c.sub}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ padding: "0 28px 48px", flexShrink: 0 }}>
        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          {CARDS.map((_, i) => (
            <div key={i} onClick={() => setCard(i)}
              style={{ width: i === card ? 24 : 8, height: 8, borderRadius: 4, background: i === card ? c.accent : P.surface3, transition: "all 0.3s", cursor: "pointer" }} />
          ))}
        </div>

        {/* CTA */}
        <button onClick={next} style={{ width: "100%", background: isLast ? `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` : P.surface2, color: isLast ? "#fff" : P.textPrimary, border: "none", borderRadius: 18, padding: "18px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px", boxShadow: isLast ? `0 8px 24px rgba(240,115,64,0.35)` : "none", transition: "all 0.3s" }}>
          {isLast ? "Get Started →" : "Next →"}
        </button>
      </div>
    </div>
  );
}

function NamePrompt({ user, onDone }) {
  const [name,   setName]   = useState(user?.email?.split("@")[0] || "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Please enter your name"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("profiles")
      .update({ display_name: name.trim(), onboarded: true })
      .eq("id", user.id).select().single();
    if (error) { setError("Something went wrong"); setSaving(false); return; }
    onDone(data);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, background: P.phoneBg, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 62, fontWeight: 900, color: P.textPrimary, letterSpacing: "-2px", marginBottom: 48, fontStyle: "italic" }}>
          vouze
        </div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 900, color: P.textPrimary, letterSpacing: "-1px", marginBottom: 8 }}>
          What should we call you?
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: P.textMuted, marginBottom: 32 }}>
          This is how you'll appear to your travel crew
        </div>
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError(""); }}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
          placeholder="Your name"
          autoFocus
          style={{ background: P.surface1, border: `1px solid ${error ? P.danger : P.surface3}`, borderRadius: 16, padding: "16px 20px", color: P.textPrimary, fontSize: 20, fontWeight: 700, width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "'Syne', sans-serif", textAlign: "center", letterSpacing: "-0.5px" }}
        />
        {error && <div style={{ color: P.danger, fontSize: 13, marginTop: 8 }}>{error}</div>}
      </div>

      <div style={{ padding: "0 32px 48px", flexShrink: 0 }}>
        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", background: saving ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", border: "none", borderRadius: 18, padding: "18px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px", boxShadow: `0 8px 24px rgba(240,115,64,0.35)` }}>
          {saving ? "..." : "Let's go ✓"}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingScreen({ user, onComplete }) {
  const [phase, setPhase] = useState("cards");
  return (
    <>
      {phase === "cards" && <OnboardingCards onDone={() => setPhase("name")} />}
      {phase === "name"  && <NamePrompt user={user} onDone={profile => onComplete(profile)} />}
    </>
  );
}
