import { P, S } from "../constants";

const SW = {
  container: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(170deg, ${P.outerBg} 0%, #0f2030 50%, #162535 100%)`, position: "relative", overflow: "hidden", padding: "0 0 40px" },
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
  ctaBtn: { width: "100%", background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", border: "none", borderRadius: 18, padding: "18px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px", boxShadow: `0 8px 24px rgba(240,115,64,0.35)` },
};

export default function WelcomeScreen({ onGetStarted }) {
  return (
    <div style={S.root}>
      <div style={S.phone}>
        <div style={SW.container}>
          <div style={SW.topBand} />
          <div style={SW.brandWrap}>
            <div style={SW.wordmark}>vouze</div>
            <div style={SW.tagline}>Plan it, track it, remember it.</div>
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
            <button style={SW.ctaBtn} onClick={onGetStarted}>Let's plan something</button>
          </div>
          <div style={SW.bottomBand} />
        </div>
      </div>
    </div>
  );
}
