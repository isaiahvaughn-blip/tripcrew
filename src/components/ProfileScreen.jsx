import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { ChevronRight, Plane, Coffee, PartyPopper } from "lucide-react";
import { P, S, TRIP_ICONS, TRIP_ICON_LIST, METRIC_DEFS, DEFAULT_METRICS } from "../constants";
import { computeMetric, renderAvatarContent } from "../utils";
import NewTripModal from "./NewTripModal";
import EditTripModal from "./EditTripModal";
import ConfirmModal from "./ConfirmModal";

function AvatarEditSheet({ profile, user, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarVal, setAvatarVal] = useState(() => {
    const av = profile?.avatar;
    if (av?.startsWith("emoji:"))    return av.slice(6);
    if (av?.startsWith("initials:")) return av.slice(9);
    if (av?.startsWith("name:"))     return av.slice(5);
    if (av?.startsWith("photo:"))    return "";
    return (profile?.display_name || user?.email || "").slice(0, 2).toUpperCase();
  });
  const [photoUrl, setPhotoUrl] = useState(() => profile?.avatar?.startsWith("photo:") ? profile.avatar.slice(6) : null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef(null);

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('trip-photos').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('trip-photos').getPublicUrl(path);
      // Append cache-buster so browser fetches the new image instead of serving cached old one
      setPhotoUrl(`${publicUrl}?t=${Date.now()}`);
      setAvatarVal(""); // clear initials/emoji if photo is set
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    let avatarStr;
    if (photoUrl) {
      avatarStr = `photo:${photoUrl}`;
    } else {
      avatarStr = avatarVal.trim() ? `initials:${avatarVal.trim().slice(0, 5)}` : null;
    }
    const { data, error } = await supabase.from("profiles")
      .update({ display_name: displayName, avatar: avatarStr }).eq("id", user.id).select().single();
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
          {/* Avatar preview + photo upload */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, gap: 12 }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => photoInputRef.current?.click()}>
              <div style={{ ...S.profileAvatar, width: 84, height: 84, overflow: "hidden" }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: previewContent.length === 1 ? 36 : 22, fontWeight: 900, letterSpacing: previewContent.length > 1 ? "-1px" : 0 }}>{previewContent}</span>
                )}
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, background: P.surface2, border: `2px solid ${P.phoneBg}`, borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: P.textSecondary }}>
                {uploading ? "…" : "📷"}
              </div>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => handlePhotoUpload(e.target.files[0])} />
            {photoUrl && (
              <button onClick={() => setPhotoUrl(null)}
                style={{ background: "transparent", border: "none", color: P.textMuted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                Remove photo
              </button>
            )}
          </div>

          <div style={S.field}>
            <div style={S.fieldLbl}>DISPLAY NAME</div>
            <input style={S.input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          {!photoUrl && (
            <div style={S.field}>
              <div style={S.fieldLbl}>AVATAR — EMOJI OR INITIALS (UP TO 5)</div>
              <input style={{ ...S.input, fontSize: 22, textAlign: "center", letterSpacing: "2px" }} value={avatarVal} maxLength={5} onChange={e => setAvatarVal(e.target.value)} placeholder="🌊 or IVJ" />
              <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8 }}>Paste an emoji, type initials, or anything up to 5 characters</div>
            </div>
          )}
          <button style={{ ...S.primaryBtn, background: saving ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={handleSave} disabled={saving || uploading}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricPickerSheet({ current, userId, onClose, onSave }) {
  const [selected, setSelected] = useState(current || DEFAULT_METRICS);
  const [saving, setSaving] = useState(false);

  const toggle = key => {
    if (selected.includes(key)) { setSelected(prev => prev.filter(k => k !== key)); }
    else { setSelected(prev => selected.length >= 3 ? [...prev.slice(0, 2), key] : [...prev, key]); }
  };

  const handleSave = async () => {
    setSaving(true);
    const prefs = selected.slice(0, 3);
    const { error } = await supabase.from("profiles").update({ metric_prefs: prefs }).eq("id", userId);
    if (!error) onSave(prefs);
    setSaving(false);
  };

  return (
    <div style={S.overlay}>
      <div style={{ ...S.sheet, maxHeight: "85%" }}>
        <div style={S.sheetHandle} />
        <div style={S.sheetHeader}>
          <div style={S.sheetTitle}>Customize Stats</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "0 22px 8px" }}>
          <div style={{ fontSize: 13, color: P.slateBlue, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>Pick 3 stats to show on your profile.</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[0,1,2].map(i => {
              const key = selected[i];
              const def = key ? METRIC_DEFS.find(m => m.key === key) : null;
              return (
                <div key={i} style={{ flex: 1, background: def ? P.terracotta + "18" : P.surface2, border: `1px solid ${def ? P.terracotta + "60" : P.surface3}`, borderRadius: 12, padding: "10px 8px", textAlign: "center", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: def ? P.terracotta : P.textMuted }}>{def ? def.label : `slot ${i+1}`}</span>
                </div>
              );
            })}
          </div>
          {["Personal","Activity","Vibes","Financial"].map(tier => (
            <div key={tier} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: P.textMuted, letterSpacing: "2px", marginBottom: 10 }}>{tier.toUpperCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {METRIC_DEFS.filter(m => m.tier === tier).map(m => {
                  const isOn = selected.includes(m.key);
                  return (
                    <button key={m.key} onClick={() => toggle(m.key)}
                      style={{ background: isOn ? P.terracotta + "18" : P.surface2, border: `1px solid ${isOn ? P.terracotta : P.surface3}`, borderRadius: 22, padding: "8px 14px", fontSize: 13, fontWeight: 700, color: isOn ? P.terracotta : P.textMuted, cursor: "pointer" }}>
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

function TripCard({ trip, onOpen, onDelete, onEdit, selecting, selected, onLongPress, onToggleSelect }) {
  const IconComp = TRIP_ICONS[trip.emoji] || (() => null);
  const showTime = trip.time && !trip.dates?.includes("–");
  const formatTime12 = t => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    if (isNaN(h)) return t;
    return `${h % 12 || 12}:${String(m).padStart(2,"0")}${h >= 12 ? "pm" : "am"}`;
  };
  const longPressTimer = useRef(null);
  const handlePressStart = () => { longPressTimer.current = setTimeout(() => onLongPress?.(), 500); };
  const handlePressEnd   = () => clearTimeout(longPressTimer.current);
  const handleTap        = () => selecting ? onToggleSelect?.() : onOpen(trip);

  return (
    <div style={{ ...S.tripCard, opacity: selected ? 0.75 : 1, outline: selected ? `2px solid ${P.terracotta}` : "none" }}
      onClick={handleTap} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}>
      {selecting && (
        <div style={{ position: "absolute", top: 14, right: 14, zIndex: 10, width: 22, height: 22, borderRadius: "50%", border: `2px solid ${selected ? P.terracotta : P.surface3}`, background: selected ? P.terracotta : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
          <ChevronRight size={18} color={P.terracotta + "80"} />
        </div>
      </div>
    </div>
  );
}

function EmptyTripsState({ onNew }) {
  return (
    <div style={{ background: P.surface1, border: `1px dashed ${P.surface3}`, borderRadius: 24, padding: "40px 28px", textAlign: "center", marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 18 }}>
        <Plane size={28} color={P.terracotta} strokeWidth={1.5} />
        <Coffee size={28} color={P.terracotta} strokeWidth={1.5} />
        <PartyPopper size={28} color={P.terracotta} strokeWidth={1.5} />
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: P.textPrimary, marginBottom: 8 }}>Nothing planned yet</div>
      <div style={{ fontSize: 14, color: P.slateBlue, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, marginBottom: 24 }}>Your next trip, dinner, or night out starts here.</div>
      <button style={{ background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", border: "none", borderRadius: 14, padding: "13px 24px", fontSize: 15, fontWeight: 800, cursor: "pointer" }} onClick={onNew}>Plan something →</button>
    </div>
  );
}

export default function ProfileScreen({ onOpen, user, onSignOut, onSettings, profile, onProfileUpdate, onFirstTripCreated }) {
  const [trips,       setTrips]       = useState([]);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showAvatarEdit,    setShowAvatarEdit]    = useState(false);
  const [showMetricPicker,  setShowMetricPicker]  = useState(false);
  const [selecting,    setSelecting]   = useState(false);
  const [selectedIds,  setSelectedIds] = useState([]);
  const [confirmDeleteTrip, setConfirmDeleteTrip] = useState(null);
  const [itinItems,  setItinItems]  = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [photos,     setPhotos]     = useState([]);
  const [members,    setMembers]    = useState([]);

  const metricPrefs = profile?.metric_prefs || DEFAULT_METRICS;

  useEffect(() => {
    const fetchAll = async () => {
      const { data: memberRows } = await supabase.from("trip_members").select("trip_id").eq("user_id", user.id);
      if (!memberRows?.length) { setTrips([]); return; }
      const tripIds = memberRows.map(r => r.trip_id);
      const [tripsRes, itinRes, expRes, photoRes, memberRes] = await Promise.all([
        supabase.from("trips").select("*").in("id", tripIds).is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("itinerary").select("type").in("trip_id", tripIds),
        supabase.from("expenses").select("amount").in("trip_id", tripIds),
        supabase.from("photos").select("id").in("trip_id", tripIds),
        supabase.from("members").select("name").in("trip_id", tripIds).neq("name", profile?.display_name || ""),
      ]);
      setTrips(tripsRes.data || []);
      setItinItems(itinRes.data || []);
      setExpenses(expRes.data || []);
      setPhotos(photoRes.data || []);
      setMembers(memberRes.data || []);
    };
    fetchAll();
  }, []);

  const handleDeleteTrip = async trip => {
    setConfirmDeleteTrip(trip);
  };

  const confirmDeleteTripAction = async () => {
    if (!confirmDeleteTrip) return;
    const { error } = await supabase.from("trips").update({ deleted_at: new Date().toISOString() }).eq("id", confirmDeleteTrip.id);
    if (!error) setTrips(prev => prev.filter(t => t.id !== confirmDeleteTrip.id));
    setConfirmDeleteTrip(null);
  };

  const metricData = { trips, itinItems, expenses, photos, members };
  const { text: avatarText, fontSize: avatarFontSize, photoUrl: avatarPhotoUrl } = renderAvatarContent(profile, user);

  return (
    <div style={S.screen}>
      <div style={{ ...S.profileHero, padding: "52px 28px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <div style={{ position: "relative", flexShrink: 0, cursor: "pointer" }} onClick={() => setShowAvatarEdit(true)}>
            <div style={{ ...S.profileAvatar, width: 100, height: 100, overflow: "hidden" }}>
              {avatarPhotoUrl
                ? <img src={avatarPhotoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: avatarFontSize, fontWeight: 900 }}>{avatarText}</span>
              }
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 2, background: P.surface2, border: `2px solid ${P.phoneBg}`, borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: P.textSecondary, cursor: "pointer" }}>✎</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...S.profileName, fontSize: 22 }}>{profile?.display_name || user.email}</div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ ...S.profileStats, padding: "12px 0" }}>
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
          <button onClick={() => setShowMetricPicker(true)}
            style={{ position: "absolute", top: -8, right: -8, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>
            ⚙
          </button>
        </div>
      </div>

      {confirmDeleteTrip && (
        <ConfirmModal
          message={`Delete "${confirmDeleteTrip.name}"? You can restore it from settings.`}
          onConfirm={confirmDeleteTripAction}
          onCancel={() => setConfirmDeleteTrip(null)}
          confirmLabel="Delete"
          danger
        />
      )}
      {showAvatarEdit && <AvatarEditSheet profile={profile} user={user} onClose={() => setShowAvatarEdit(false)} onSave={updated => { onProfileUpdate?.(updated); setShowAvatarEdit(false); }} />}
      {editingTrip && <EditTripModal trip={editingTrip} onClose={() => setEditingTrip(null)} onSave={updated => { setTrips(prev => prev.map(t => t.id === updated.id ? updated : t)); setEditingTrip(null); }} />}
      {showMetricPicker && <MetricPickerSheet current={metricPrefs} userId={user.id} onClose={() => setShowMetricPicker(false)} onSave={updated => { onProfileUpdate?.({ ...profile, metric_prefs: updated }); setShowMetricPicker(false); }} />}

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
                      for (const id of selectedIds) await supabase.from("trips").update({ deleted_at: new Date().toISOString() }).eq("id", id);
                      setTrips(prev => prev.filter(t => !selectedIds.includes(t.id)));
                      setSelectedIds([]); setSelecting(false);
                    }}>Delete ({selectedIds.length})</button>
                )}
              </div>
            : <button style={S.newBtn} onClick={() => setShowNewTrip(true)}>+ New</button>
          }
        </div>
        {selecting && <div style={{ fontSize: 12, color: P.textMuted, textAlign: "center", marginBottom: 12 }}>Hold to select · Tap to toggle · Delete when ready</div>}
        {showNewTrip && <NewTripModal onClose={() => setShowNewTrip(false)} userId={user.id} userProfile={profile}
          onSave={trip => {
            const updatedTrips = [trip, ...trips];
            setTrips(updatedTrips);
            setShowNewTrip(false);
            if (updatedTrips.length === 1) onFirstTripCreated?.();
          }} />}
        {trips.length === 0 && !showNewTrip && <EmptyTripsState onNew={() => setShowNewTrip(true)} />}
        {trips.map(t => (
          <TripCard key={t.id} trip={t} onOpen={onOpen}
            onDelete={handleDeleteTrip} onEdit={setEditingTrip}
            selecting={selecting} selected={selectedIds.includes(t.id)}
            onLongPress={() => { setSelecting(true); setSelectedIds([t.id]); }}
            onToggleSelect={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])} />
        ))}
      </div>
    </div>
  );
}