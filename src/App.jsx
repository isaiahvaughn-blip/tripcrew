import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { S } from "./constants";
import WelcomeScreen  from "./components/WelcomeScreen";
import AuthScreen     from "./components/AuthScreen";
import ProfileScreen  from "./components/ProfileScreen";
import SettingsScreen from "./components/SettingsScreen";
import TripShell        from "./components/TripShell";
import OnboardingScreen from "./components/OnboardingScreen";

// Inject Google Fonts
const fontLink = document.createElement("link");
fontLink.rel  = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&display=swap";
document.head.appendChild(fontLink);

function PWABanner({ triggered }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!triggered) return;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("pwa_banner_dismissed");
    if (isIOS && !isStandalone && !dismissed) setShow(true);
  }, [triggered]);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem("pwa_banner_dismissed", "1");
    setShow(false);
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "#162c3a", borderTop: "1px solid #243d52",
      padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: "#0d1e28",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, border: "1px solid #243d52",
      }}>
        <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 900, color: "#e4a576", fontSize: 22 }}>v</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#f0ebe4", fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
          Add Vouze to your Home Screen
        </div>
        <div style={{ color: "#9ab0bd", fontSize: 12, lineHeight: 1.3, marginTop: 2 }}>
          Tap the share icon then "Add to Home Screen"
        </div>
      </div>
      <button onClick={dismiss} style={{
        background: "none", border: "none", color: "#698ea2",
        fontSize: 20, cursor: "pointer", padding: "4px 8px", flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

export default function App() {
  const [user,        setUser]        = useState(null);
  const [view,        setView]        = useState("welcome");
  const [activeTrip,  setActiveTrip]  = useState(null);
  const [activeTab,   setActiveTab]   = useState("itinerary");
  const [modal,       setModal]       = useState(null);
  const [itinRefresh, setItinRefresh] = useState(0);
  const [profile,     setProfile]     = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tripListKey, setTripListKey] = useState(0);
  const [pwaBannerTriggered, setPwaBannerTriggered] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => {
            setProfile(data);
            setView(data?.onboarded ? "profile" : "onboarding");
          });
      }
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => {
            setProfile(data);
            setView(data?.onboarded ? "profile" : "onboarding");
          });
      } else {
        setProfile(null);
        setView("welcome");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Link pending invites + migrate guest expenses when user logs in
  useEffect(() => {
    if (!user) return;
    const linkPending = async () => {
      const { data: pending } = await supabase
        .from("trip_members").select("*")
        .eq("invited_email", user.email).eq("status", "pending");
      if (!pending?.length) return;

      for (const invite of pending) {
        await supabase.from("trip_members")
          .update({ user_id: user.id, status: "accepted" })
          .eq("id", invite.id);

        const { data: memberRow } = await supabase
          .from("members").select("name")
          .eq("trip_id", invite.trip_id)
          .eq("name", user.email.split("@")[0])
          .maybeSingle();

        const guestName = memberRow?.name || user.email.split("@")[0];

        await supabase.rpc("migrate_guest_to_uuid", {
          p_trip_id:    invite.trip_id,
          p_guest_name: guestName,
          p_user_uuid:  user.id,
        });
      }
    };
    linkPending();
  }, [user]);

  if (!authChecked) return (
  <div style={{ ...S.root }}>
    <div style={{ ...S.phone, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: `3px solid #243d52`,
          borderTopColor: "#e4a576",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 900, fontSize: 24, color: "#e4a576", letterSpacing: "-1px" }}>vouze</div>
      </div>
    </div>
  </div>
);

  if (!user) {
    if (view === "welcome") return <WelcomeScreen onGetStarted={() => setView("auth")} />;
    return <AuthScreen onAuth={setUser} onBack={() => setView("welcome")} />;
  }

  const openTrip = trip => {
    const today = new Date(); today.setHours(0,0,0,0);
    const defaultTab = trip.start_date
      ? (new Date((trip.end_date || trip.start_date) + "T12:00:00") < today ? "summary" : "itinerary")
      : "itinerary";
    setActiveTrip(trip);
    setActiveTab(defaultTab);
    setView("trip");
  };

  const handleTripUpdate = updated => {
    setActiveTrip(updated);
    setTripListKey(k => k + 1);
  };

  return (
    <div style={S.root}>
      <div style={S.phone}>
        {view === "onboarding" && (
          <OnboardingScreen user={user} onComplete={profile => { setProfile(profile); setView("profile"); }} />
        )}
        {view === "profile" && (
          <ProfileScreen key={tripListKey} onOpen={openTrip} user={user} profile={profile}
            onSignOut={async () => { await supabase.auth.signOut(); }}
            onSettings={() => setView("settings")}
            onProfileUpdate={updated => setProfile(updated)}
            onFirstTripCreated={() => setPwaBannerTriggered(true)} />
        )}
        {view === "settings" && (
          <SettingsScreen user={user} profile={profile} onBack={() => setView("profile")}
            onProfileUpdate={updated => setProfile(updated)} />
        )}
        {view === "trip" && activeTrip && (
          <TripShell
            trip={activeTrip} activeTab={activeTab} setActiveTab={setActiveTab}
            onBack={() => { setView("profile"); }}
            onModal={setModal}
            itinRefresh={itinRefresh} modal={modal} setModal={setModal}
            user={user} profile={profile}
            onItinRefresh={() => setItinRefresh(r => r + 1)}
            onTripUpdate={handleTripUpdate}
          />
        )}
      </div>
      <PWABanner triggered={pwaBannerTriggered} />
    </div>
  );
}