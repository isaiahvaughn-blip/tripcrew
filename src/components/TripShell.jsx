import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Calendar, DollarSign, Image, Users, BarChart2, Plane, Download } from "lucide-react";
import { P, S, TRIP_ICONS } from "../constants";
import { calcSettlements } from "../utils";
import ItineraryTab, { AddItinModal } from "./ItineraryTab";
import ExpensesTab, { AddExpenseModal } from "./ExpensesTab";
import UploadsTab from "./UploadsTab";
import MembersTab from "./MembersTab";
import SummaryTab from "./SummaryTab";
import SettleModal from "./SettleModal";
import ShareModal from "./ShareModal";
import EditTripModal from "./EditTripModal";

export default function TripShell({ trip, activeTab, setActiveTab, onBack, onModal, itinRefresh, modal, setModal, user, profile, onItinRefresh, onTripUpdate }) {
  const [expenses,       setExpenses]       = useState([]);
  const [profileMap,     setProfileMap]     = useState({});
  const [editingTrip,    setEditingTrip]    = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [previewPhoto,   setPreviewPhoto]   = useState(null);
  const [savingPhoto,    setSavingPhoto]    = useState(false);

  const IconComp  = TRIP_ICONS[trip.emoji] || Plane;
  const myName    = profile?.display_name || user?.email?.split("@")[0] || "Me";
  const nameFontSize = (trip.name?.length || 0) > 22 ? 15 : (trip.name?.length || 0) > 16 ? 17 : 19;

  useEffect(() => {
    const fetchAll = async () => {
      const { data: tmRows } = await supabase
        .from("trip_members").select("user_id").eq("trip_id", trip.id);
      const userIds = (tmRows || []).map(r => r.user_id).filter(Boolean);

      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles").select("id, display_name").in("id", userIds);
        const map = {};
        (profiles || []).forEach(p => { if (p.id && p.display_name) map[p.id] = p.display_name; });
        setProfileMap(map);
      }

      const { data } = await supabase
        .from("expenses").select("*").eq("trip_id", trip.id)
        .order("created_at", { ascending: false });
      setExpenses(data || []);
    };
    fetchAll();

    const sub = supabase.channel(`shell-expenses:${trip.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchAll)
      .subscribe();
    return () => sub.unsubscribe();
  }, [trip.id, itinRefresh]);

  const profileMapReady = Object.keys(profileMap).length > 0;
  const settlements = profileMapReady ? calcSettlements(expenses, profileMap) : [];

  // Fetch blob first so browser saves as a named file instead of opening raw Supabase URL
  const saveSinglePhoto = async (photo) => {
    setSavingPhoto(true);
    try {
      const res = await fetch(photo.url);
      const blob = await res.blob();
      const ext = photo.storage_path.split('.').pop() || 'jpg';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${photo.caption || 'photo'}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { console.error(e); } finally { setSavingPhoto(false); }
  };

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
          onSave={updated => { onTripUpdate?.(updated); setEditingTrip(false); }} />
      )}

      {/* Header */}
      <div style={{ background: P.surface1, borderBottom: `1px solid ${P.surface3}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 6px" }}>
          <button style={S.backBtn} onClick={() => { setModal(null); onBack(); }}>←</button>
          <div style={{ ...S.thIconWrap, background: P.terracotta + "20" }}>
            <IconComp size={20} color={P.terracotta} strokeWidth={1.5} />
          </div>
          <button style={{ ...S.shareHeaderBtn, color: P.terracotta }} onClick={() => onModal("share")}>↗ Share</button>
        </div>
        <div style={{ textAlign: "center", padding: "0 56px", cursor: "pointer" }} onClick={() => setEditingTrip(true)}>
          <div style={{ fontSize: nameFontSize, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.5px", whiteSpace: "nowrap", overflow: "hidden" }}>{trip.name}</div>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: P.textSecondary, padding: "3px 22px 12px", lineHeight: 1.4 }}>
          {trip.location}{trip.dates ? ` · ${trip.dates}` : ""}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ ...S.tabContent, position: "relative" }}>
        {activeTab === "itinerary" && <ItineraryTab trip={trip} onModal={onModal} refreshKey={itinRefresh} />}
        {activeTab === "expenses"  && <ExpensesTab  trip={trip} onModal={onModal} profile={profile} user={user} expenses={expenses} settlements={settlements} myName={myName} profileMap={profileMap} onEditExpense={setEditingExpense} />}
        {activeTab === "uploads"   && <UploadsTab   trip={trip} user={user} profile={profile} onPreview={setPreviewPhoto} />}
        {activeTab === "members"   && <MembersTab   trip={trip} profile={profile} expenses={expenses} profileMap={profileMap} />}
        {activeTab === "summary"   && <SummaryTab   trip={trip} settlements={settlements} myName={myName} expenses={expenses} />}

        {modal === "addExpense"   && <AddExpenseModal trip={trip} user={user} profile={profile} profileMap={profileMap} onClose={() => setModal(null)} onAdd={onItinRefresh} />}
        {modal === "addItinerary" && <AddItinModal    trip={trip} onClose={() => setModal(null)} onAdd={() => { setModal(null); onItinRefresh(); }} />}
        {modal === "settle"       && <SettleModal     settlements={settlements} myName={myName} myUserId={user?.id} trip={trip} profileMap={profileMap} onClose={() => setModal(null)} />}
        {modal === "share"        && <ShareModal      trip={trip} onClose={() => setModal(null)} />}
        {editingExpense && (
          <AddExpenseModal trip={trip} user={user} profile={profile} profileMap={profileMap}
            existingExpense={editingExpense}
            onClose={() => setEditingExpense(null)}
            onAdd={() => { setEditingExpense(null); onItinRefresh(); }} />
        )}
      </div>

      {/* Tab bar */}
      <div style={S.tabBar}>
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} style={S.tabBtn} onClick={() => { setActiveTab(id); setModal(null); }}>
            <Icon size={24} color={activeTab === id ? P.terracotta : P.textMuted} strokeWidth={activeTab === id ? 2 : 1.5} />
            <span style={{ ...S.tabLabel, ...(activeTab === id ? { color: P.terracotta } : {}) }}>{label}</span>
            {activeTab === id && <div style={{ ...S.tabDot, background: P.terracotta }} />}
          </button>
        ))}
      </div>

      {/* Photo preview overlay — covers tab bar at shell level */}
      {previewPhoto && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 300, background: P.outerBg, display: "flex", flexDirection: "column" }}
          onClick={() => setPreviewPhoto(null)}
        >
          {/* Top: uploader + close */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 16px", flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: P.textMuted }}>by {previewPhoto.uploader}</div>
            <button
              style={{ background: "rgba(255,255,255,0.1)", border: "none", color: P.textPrimary, borderRadius: 20, width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={e => { e.stopPropagation(); setPreviewPhoto(null); }}>
              ✕
            </button>
          </div>

          {/* Image */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
            <img
              src={previewPhoto.url}
              alt={previewPhoto.caption}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 12 }}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Bottom actions — two equal buttons, big tap targets */}
          <div
            style={{ display: "flex", gap: 12, padding: "20px 20px 48px", flexShrink: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Mark Sensitive — fixed: updates local state immediately after DB write */}
            <button
              onClick={() => {
                previewPhoto.onToggleSensitive?.();
                setPreviewPhoto(p => ({ ...p, sensitive: !p.sensitive }));
              }}
              style={{
                flex: 1, padding: "14px 0", fontSize: 14, fontWeight: 700,
                borderRadius: 14, cursor: "pointer", border: `1.5px solid ${previewPhoto.sensitive ? P.terracotta : "rgba(255,255,255,0.15)"}`,
                background: previewPhoto.sensitive ? "#2a1810" : "rgba(255,255,255,0.08)",
                color: previewPhoto.sensitive ? P.terracotta : P.textMuted,
                fontFamily: "'DM Sans', sans-serif",
              }}>
              {previewPhoto.sensitive ? "🔒 Sensitive" : "Mark 🔒"}
            </button>

            {/* Save — fixed: fetches blob so it saves as a file, not a raw URL tab */}
            <button
              onClick={() => saveSinglePhoto(previewPhoto)}
              disabled={savingPhoto}
              style={{
                flex: 1, padding: "14px 0", fontSize: 14, fontWeight: 700,
                borderRadius: 14, cursor: "pointer", border: `1.5px solid ${P.lightBlue}60`,
                background: P.lightBlue + "22", color: P.lightBlue,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "'DM Sans', sans-serif",
              }}>
              {savingPhoto ? "Saving..." : <><Download size={15} /> Save</>}
            </button>
          </div>

          {/* iOS hint */}
          <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", paddingBottom: 20, marginTop: -28, fontFamily: "'DM Sans', sans-serif" }}>
            On iPhone: hold the photo above to Save to Photos
          </div>
        </div>
      )}
    </div>
  );
}
