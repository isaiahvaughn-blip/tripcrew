import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { P, S } from "../constants";

const SA = {
  backBtn: { background: "transparent", border: "none", color: P.slateBlue, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 0, fontFamily: "'DM Sans', sans-serif" },
};

export default function SettingsScreen({ user, profile, onBack, onProfileUpdate }) {
  const [displayName,    setDisplayName]    = useState(profile?.display_name   || "");
  const [venmoHandle,    setVenmoHandle]    = useState(profile?.venmo_handle   || "");
  const [cashappHandle,  setCashappHandle]  = useState(profile?.cashapp_handle || "");
  const [zelleHandle,    setZelleHandle]    = useState(profile?.zelle_handle   || "");
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [savingPayment,  setSavingPayment]  = useState(false);
  const [savedPayment,   setSavedPayment]   = useState(false);
  const [deletedTrips,   setDeletedTrips]   = useState([]);
  const [restoring,      setRestoring]      = useState(null);

  useEffect(() => {
    supabase.from("trips").select("*").eq("user_id", user.id)
      .not("deleted_at", "is", null).order("deleted_at", { ascending: false })
      .then(({ data }) => setDeletedTrips(data || []));
  }, [user.id]);

  const handleSaveName = async () => {
    setSaving(true);
    const { data, error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id).select().single();
    if (!error) { onProfileUpdate(data); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  const handleSavePayment = async () => {
    setSavingPayment(true);
    const { data, error } = await supabase.from("profiles").update({
      venmo_handle:   venmoHandle.replace(/^@/, "").trim()   || null,
      cashapp_handle: cashappHandle.replace(/^\$/, "").trim() || null,
      zelle_handle:   zelleHandle.trim() || null,
    }).eq("id", user.id).select().single();
    if (!error) { onProfileUpdate(data); setSavedPayment(true); setTimeout(() => setSavedPayment(false), 2000); }
    setSavingPayment(false);
  };

  const handleRestore = async trip => {
    setRestoring(trip.id);
    const { error } = await supabase.from("trips").update({ deleted_at: null }).eq("id", trip.id);
    if (!error) setDeletedTrips(prev => prev.filter(t => t.id !== trip.id));
    setRestoring(null);
  };

  const handlePermanentDelete = async trip => {
    if (!window.confirm(`Permanently delete "${trip.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("trips").delete().eq("id", trip.id);
    if (!error) setDeletedTrips(prev => prev.filter(t => t.id !== trip.id));
  };

  return (
    <div style={S.screen}>
      <div style={{ padding: "52px 24px 0", display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <button style={SA.backBtn} onClick={onBack}>← Back</button>
        <div style={{ fontSize: 24, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px" }}>Settings</div>
      </div>
      <div style={{ padding: "0 24px 40px" }}>

        {/* Profile */}
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

        {/* Payment handles */}
        <div style={S.settingsSection}>
          <div style={S.settingsSectionLabel}>PAYMENT HANDLES</div>
          <div style={{ fontSize: 12, color: P.textMuted, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
            Used to generate payment links in Settle Up. Without these, buttons link to each app's homepage.
          </div>
          <div style={S.settingsCard}>
            <div style={S.field}>
              <div style={S.fieldLbl}>VENMO</div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: P.textMuted, fontSize: 15, fontWeight: 700 }}>@</span>
                <input style={{ ...S.input, paddingLeft: 30 }} value={venmoHandle.replace(/^@/, "")} onChange={e => setVenmoHandle(e.target.value)} placeholder="your-venmo-username" />
              </div>
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>CASH APP</div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: P.textMuted, fontSize: 15, fontWeight: 700 }}>$</span>
                <input style={{ ...S.input, paddingLeft: 30 }} value={cashappHandle.replace(/^\$/, "")} onChange={e => setCashappHandle(e.target.value)} placeholder="your-cashtag" />
              </div>
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>ZELLE</div>
              <input style={S.input} value={zelleHandle} onChange={e => setZelleHandle(e.target.value)} placeholder="Phone number or email" />
              <div style={{ fontSize: 11, color: P.textMuted, marginTop: 6 }}>Zelle doesn't support deep links — this will copy to clipboard instead.</div>
            </div>
            <button style={{ ...S.primaryBtn, background: savedPayment ? P.successBg : savingPayment ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: savedPayment ? P.success : "#fff" }}
              onClick={handleSavePayment} disabled={savingPayment}>
              {savedPayment ? "✓ Saved" : savingPayment ? "Saving..." : "Save Payment Info"}
            </button>
          </div>
        </div>

        {/* Recently deleted */}
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
