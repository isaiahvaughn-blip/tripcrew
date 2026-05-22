import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { S } from "./constants";
import WelcomeScreen  from "./components/WelcomeScreen";
import AuthScreen     from "./components/AuthScreen";
import ProfileScreen  from "./components/ProfileScreen";
import SettingsScreen from "./components/SettingsScreen";
import TripShell      from "./components/TripShell";

// Inject Google Fonts
const fontLink = document.createElement("link");
fontLink.rel  = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&display=swap";
document.head.appendChild(fontLink);

export default function App() {
  const [user,        setUser]        = useState(null);
  const [view,        setView]        = useState("welcome");
  const [activeTrip,  setActiveTrip]  = useState(null);
  const [activeTab,   setActiveTab]   = useState("itinerary");
  const [modal,       setModal]       = useState(null);
  const [itinRefresh, setItinRefresh] = useState(0);
  const [profile,     setProfile]     = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
        setView("profile");
      }
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
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
    const linkPending = async () => {
      const { data: pending } = await supabase.from("trip_members").select("*").eq("invited_email", user.email).eq("status", "pending");
      if (!pending?.length) return;
      for (const invite of pending) {
        await supabase.from("trip_members").update({ user_id: user.id, status: "accepted" }).eq("id", invite.id);
      }
    };
    linkPending();
  }, [user]);

  if (!authChecked) return null;

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

  return (
    <div style={S.root}>
      <div style={S.phone}>
        {view === "profile" && (
          <ProfileScreen onOpen={openTrip} user={user} profile={profile}
            onSignOut={async () => { await supabase.auth.signOut(); }}
            onSettings={() => setView("settings")}
            onProfileUpdate={updated => setProfile(updated)} />
        )}
        {view === "settings" && (
          <SettingsScreen user={user} profile={profile} onBack={() => setView("profile")}
            onProfileUpdate={updated => setProfile(updated)} />
        )}
        {view === "trip" && activeTrip && (
          <TripShell
            trip={activeTrip} activeTab={activeTab} setActiveTab={setActiveTab}
            onBack={() => setView("profile")} onModal={setModal}
            itinRefresh={itinRefresh} modal={modal} setModal={setModal}
            user={user} profile={profile}
            onItinRefresh={() => setItinRefresh(r => r + 1)}
            onTripUpdate={updated => setActiveTrip(updated)}
          />
        )}
      </div>
    </div>
  );
}
