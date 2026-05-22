import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Calendar, DollarSign, Image, Users, BarChart2 } from "lucide-react";
import { P, S, TRIP_ICONS } from "../constants";
import { calcSettlements } from "../utils";
import { Plane } from "lucide-react";
import ItineraryTab, { AddItinModal } from "./ItineraryTab";
import ExpensesTab, { AddExpenseModal } from "./ExpensesTab";
import UploadsTab from "./UploadsTab";
import MembersTab from "./MembersTab";
import SummaryTab from "./SummaryTab";
import SettleModal from "./SettleModal";
import ShareModal from "./ShareModal";
import EditTripModal from "./EditTripModal";
import NewTripModal from "./NewTripModal";

export default function TripShell({ trip, activeTab, setActiveTab, onBack, onModal, itinRefresh, modal, setModal, user, profile, onItinRefresh, onTripUpdate }) {
  const [expenses, setExpenses] = useState([]);
  const [editingTrip, setEditingTrip] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const myName = profile?.display_name || user?.email?.split("@")[0] || "Me";
  const IconComp = TRIP_ICONS[trip.emoji] || Plane;
  const settlements = calcSettlements(expenses);
  const nameFontSize = (trip.name?.length || 0) > 22 ? 15 : (trip.name?.length || 0) > 16 ? 17 : 19;

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("expenses").select("*").eq("trip_id", trip.id).order("created_at", { ascending: false });
      setExpenses(data || []);
    };
    fetch();
    const sub = supabase.channel(`shell-expenses:${trip.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetch).subscribe();
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
        {activeTab === "expenses"  && <ExpensesTab  trip={trip} onModal={onModal} profile={profile} user={user} expenses={expenses} settlements={settlements} myName={myName} onEditExpense={setEditingExpense} />}
        {activeTab === "uploads"   && <UploadsTab   trip={trip} user={user} profile={profile} />}
        {activeTab === "members"   && <MembersTab   trip={trip} profile={profile} expenses={expenses} />}
        {activeTab === "summary"   && <SummaryTab   trip={trip} settlements={settlements} myName={myName} expenses={expenses} />}
        {modal === "addExpense"    && <AddExpenseModal trip={trip} user={user} profile={profile} onClose={() => setModal(null)} onAdd={onItinRefresh} />}
        {modal === "addItinerary"  && <AddItinModal trip={trip} onClose={() => setModal(null)} onAdd={() => { setModal(null); onItinRefresh(); setTimeout(onItinRefresh, 100); }} />}
        {modal === "settle"        && <SettleModal settlements={settlements} myName={myName} trip={trip} onClose={() => setModal(null)} />}
        {modal === "share"         && <ShareModal trip={trip} onClose={() => setModal(null)} />}
        {editingExpense && <AddExpenseModal trip={trip} user={user} profile={profile} existingExpense={editingExpense} onClose={() => setEditingExpense(null)} onAdd={() => { setEditingExpense(null); onItinRefresh(); }} />}
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
    </div>
  );
}
