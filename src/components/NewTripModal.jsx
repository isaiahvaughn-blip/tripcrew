import { useState, useRef } from "react";
import { supabase } from "../supabase";
import { P, S, VIBES, TRIP_ICONS } from "../constants";
import { formatDates, formatTime12 } from "../utils";
import DateTimePicker from "./DateTimePicker";

const SN = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px 8px" },
  backBtn: { background: "transparent", border: "none", color: P.slateBlue, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif" },
  stepIndicator: { display: "flex", gap: 6 },
  stepPip: { width: 6, height: 6, borderRadius: "50%", background: P.surface3 },
  stepPipOn: { background: P.terracotta },
  stepWrap: { paddingBottom: 12 },
  receipt: { background: P.surface2, borderRadius: 14, padding: "12px 16px", marginBottom: 24, border: `1px solid ${P.surface3}` },
  receiptRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${P.surface3}` },
  receiptLabel: { fontSize: 10, fontWeight: 800, color: P.textMuted, letterSpacing: "2px" },
  receiptValue: { fontSize: 14, fontWeight: 700, color: P.textPrimary },
  question: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 900, color: P.textPrimary, letterSpacing: "-0.8px", marginBottom: 4 },
  subQuestion: { fontSize: 13, color: P.slateBlue, marginBottom: 18, fontFamily: "'DM Sans', sans-serif" },
  vibeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 },
  vibeTile: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "8px 4px", cursor: "pointer", minHeight: 74 },
  vibeTileOn: { background: P.terracotta + "18", border: `1px solid ${P.terracotta}70` },
  vibeLabel: { fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  nextBtn: { width: "100%", background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, color: "#fff", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px" },
  whoRow: { display: "flex", gap: 10, marginTop: 16 },
  whoChip: { flex: 1, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, color: P.textMuted, cursor: "pointer", textAlign: "center", fontFamily: "'DM Sans', sans-serif" },
  whoChipOn: { background: P.terracotta + "18", border: `1px solid ${P.terracotta}60`, color: P.terracotta },
  emailRow: { display: "flex", gap: 8 },
  addEmailBtn: { background: P.surface3, border: "none", color: P.textPrimary, borderRadius: 12, padding: "0 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  emailTag: { display: "flex", alignItems: "center", gap: 6, background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 22, padding: "6px 12px", fontSize: 13, color: P.textSecondary },
  removeEmail: { background: "transparent", border: "none", color: P.textMuted, cursor: "pointer", fontSize: 11, padding: 0, lineHeight: 1 },
  confirmCard: { background: `linear-gradient(135deg, ${P.surface1}, ${P.surface2})`, border: `1px solid ${P.surface3}`, borderRadius: 20, padding: "24px", marginBottom: 16, textAlign: "center" },
  confirmIcon: { width: 52, height: 52, borderRadius: 16, background: P.terracotta + "20", border: `1px solid ${P.terracotta}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  nameInput: { background: "transparent", border: "none", borderBottom: `1px solid ${P.surface3}`, color: P.textPrimary, fontSize: 22, fontWeight: 900, letterSpacing: "-0.8px", width: "100%", textAlign: "center", outline: "none", marginBottom: 12, fontFamily: "'Syne', sans-serif", padding: "4px 0" },
  confirmMeta: { fontSize: 13, color: P.textSecondary, marginBottom: 6 },
  confirmPeople: { fontSize: 13, color: P.slateBlue },
  stepOuter: { display: "flex", flexDirection: "column", flex: 1 },
  stepContent: { flex: 1 },
  stepFooter: { paddingTop: 16, paddingBottom: 8 },
};

export default function NewTripModal({ onClose, onSave, userId, userProfile }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    vibe: null, location: "", who: [], guests: [], solo: false,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "", time: "", generatedName: "", editedName: "", emoji: "",
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const isShortForm = answers.vibe?.shortForm || false;

  // Email input refs — avoids re-render lag
  const emailInputRef = useRef(null);
  const guestInputRef = useRef(null);
  const [emailTags, setEmailTags] = useState([]);
  const [guestTags, setGuestTags] = useState([]);
  const [whoMode, setWhoMode] = useState("email"); // "email" | "guest"

  const addEmail = () => {
    const val = emailInputRef.current?.value?.trim();
    if (!val) return;
    const updated = [...emailTags, val];
    setEmailTags(updated);
    setAnswers(a => ({ ...a, who: updated }));
    if (emailInputRef.current) emailInputRef.current.value = "";
  };

  const removeEmail = (i) => {
    const updated = emailTags.filter((_, j) => j !== i);
    setEmailTags(updated);
    setAnswers(a => ({ ...a, who: updated }));
  };

  const addGuest = () => {
    const val = guestInputRef.current?.value?.trim();
    if (!val) return;
    const updated = [...guestTags, val];
    setGuestTags(updated);
    setAnswers(a => ({ ...a, guests: updated }));
    if (guestInputRef.current) guestInputRef.current.value = "";
  };

  const removeGuest = (i) => {
    const updated = guestTags.filter((_, j) => j !== i);
    setGuestTags(updated);
    setAnswers(a => ({ ...a, guests: updated }));
  };

  const Receipt = () => {
    const items = [];
    if (step > 1 && answers.vibe) items.push({ label: "vibe", value: `${answers.vibe.emoji} ${answers.vibe.label}` });
    if (step > 2 && answers.location) items.push({ label: "where", value: answers.location });
    if (step > 3) {
      const total = (answers.who?.length || 0) + (answers.guests?.length || 0);
      items.push({ label: "who", value: answers.solo ? "Just me" : total ? `${total} people` : "Just me" });
    }
    if (step > 4 && answers.startDate) {
      const d = new Date(answers.startDate + "T12:00:00");
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const timeStr = answers.time ? ` · ${formatTime12(answers.time)}` : "";
      items.push({ label: "when", value: `${dateStr}${timeStr}` });
    }
    if (!items.length) return null;
    return (
      <div style={SN.receipt}>
        {items.map((item, i) => (
          <div key={i} style={{ ...SN.receiptRow, ...(i === items.length - 1 ? { borderBottom: "none", marginBottom: 0, paddingBottom: 0 } : {}) }}>
            <span style={SN.receiptLabel}>{item.label}</span>
            <span style={SN.receiptValue}>{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const goBack = () => setStep(s => Math.max(1, s - 1));

  // Step 1 — Vibe
  const StepVibe = () => (
    <div style={SN.stepWrap}>
      <Receipt />
      <div style={SN.question}>What's the vibe?</div>
      <div style={SN.vibeGrid}>
        {VIBES.map(v => {
          const Icon = v.icon;
          const selected = answers.vibe?.key === v.key;
          return (
            <button key={v.key} style={{ ...SN.vibeTile, ...(selected ? SN.vibeTileOn : {}) }}
              onClick={() => { setAnswers(a => ({ ...a, vibe: v, emoji: v.emoji })); setTimeout(() => setStep(2), 180); }}>
              <Icon size={26} color={selected ? P.terracotta : P.textSecondary} strokeWidth={1.5} />
              <span style={{ ...SN.vibeLabel, color: selected ? P.terracotta : P.textSecondary }}>{v.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Step 2 — Where
  const locationRef = useRef(null);
  const [locationInput, setLocationInput] = useState(answers.location || "");
  const StepWhere = () => (
    <div style={SN.stepOuter}>
      <div style={SN.stepContent}>
        <Receipt />
        <div style={SN.question}>Where to?</div>
        <div style={SN.subQuestion}>{isShortForm ? "Name the spot" : "City or destination"}</div>
        <input ref={locationRef}
          style={{ ...S.input, fontSize: 20, padding: "20px", marginBottom: 12, minHeight: 64 }}
          placeholder={isShortForm ? "e.g. Barista, Ox Restaurant" : "e.g. Tokyo, Banff, Portland"}
          defaultValue={locationInput} onBlur={e => setLocationInput(e.target.value)} autoFocus />
      </div>
      <div style={SN.stepFooter}>
        <button style={SN.nextBtn} onClick={() => {
          const loc = locationRef.current?.value || locationInput;
          if (!loc.trim()) return;
          setAnswers(a => ({ ...a, location: loc })); setStep(3);
        }}>Next →</button>
      </div>
    </div>
  );

  // Step 3 — Who
  const StepWho = () => (
    <div style={SN.stepOuter}>
      <div style={SN.stepContent}>
        <Receipt />
        <div style={SN.question}>Who's coming?</div>

        {/* Solo / Add people */}
        <div style={SN.whoRow}>
          <button style={{ ...SN.whoChip, ...(answers.solo ? SN.whoChipOn : {}) }}
            onClick={() => setAnswers(a => ({ ...a, solo: true, who: [], guests: [] }))}>Just me</button>
          <button style={{ ...SN.whoChip, ...(!answers.solo ? SN.whoChipOn : {}) }}
            onClick={() => setAnswers(a => ({ ...a, solo: false }))}>+ Add people</button>
        </div>

        {!answers.solo && (
          <div style={{ marginTop: 16 }}>
            {/* Email / Guest toggle */}
            <div style={{ display: "flex", gap: 0, marginBottom: 14, background: P.surface2, borderRadius: 12, padding: 3, border: `1px solid ${P.surface3}` }}>
              {[["email", "By email"], ["guest", "By name"]].map(([mode, label]) => (
                <button key={mode} onClick={() => setWhoMode(mode)}
                  style={{ flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    background: whoMode === mode ? P.surface3 : "transparent",
                    color: whoMode === mode ? P.textPrimary : P.textMuted }}>
                  {label}
                </button>
              ))}
            </div>

            {whoMode === "email" ? (
              <>
                <div style={SN.emailRow}>
                  <input ref={emailInputRef} style={{ ...S.input, flex: 1, fontSize: 15 }}
                    placeholder="friend@email.com" type="email" autoComplete="off"
                    onKeyDown={e => { if (e.key === "Enter") addEmail(); }} />
                  <button style={SN.addEmailBtn} onClick={addEmail}>Add</button>
                </div>
                <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8 }}>
                  They'll see this trip when they sign in.
                </div>
                {emailTags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {emailTags.map((email, i) => (
                      <div key={i} style={SN.emailTag}>
                        <span>{email}</span>
                        <button style={SN.removeEmail} onClick={() => removeEmail(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={SN.emailRow}>
                  <input ref={guestInputRef} style={{ ...S.input, flex: 1, fontSize: 15 }}
                    placeholder="e.g. Zane, Aunt Carol" autoComplete="off"
                    onKeyDown={e => { if (e.key === "Enter") addGuest(); }} />
                  <button style={SN.addEmailBtn} onClick={addGuest}>Add</button>
                </div>
                <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8 }}>
                  No account needed — just a name for splitting expenses.
                </div>
                {guestTags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {guestTags.map((name, i) => (
                      <div key={i} style={{ ...SN.emailTag, borderColor: P.slateBlue + "50", color: P.slateBlue }}>
                        <span>{name}</span>
                        <button style={SN.removeEmail} onClick={() => removeGuest(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <div style={SN.stepFooter}>
        <button style={SN.nextBtn} onClick={() => setStep(4)}>Next →</button>
      </div>
    </div>
  );

  // Step 4 — When
  const handleGenerateName = async () => {
    setGenerating(true);
    try {
      const whoStr  = answers.solo ? "just me" : answers.who.length ? `with ${answers.who.join(", ")}` : "just me";
      const dateStr = formatDates(answers.startDate, answers.endDate);
      const timeStr = answers.time ? ` at ${answers.time}` : "";
      const prompt  = `Generate a short, natural trip name (max 5 words) for: ${answers.vibe?.label} at ${answers.location}${timeStr}, ${dateStr}, ${whoStr}. Examples: "Coffee at Barista with Derek", "Tokyo October", "Banff Long Weekend". Only return the name, nothing else.`;
      const res  = await fetch("/api/parse-trip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, mode: "name" }) });
      const data = await res.json();
      const name = (data.content?.[0]?.text || "").trim().replace(/^"|"$/g, "").slice(0, 30);
      setAnswers(a => ({ ...a, generatedName: name, editedName: name }));
    } catch {
      const fallback = `${answers.vibe?.label} at ${answers.location}`;
      setAnswers(a => ({ ...a, generatedName: fallback, editedName: fallback }));
    } finally { setGenerating(false); setStep(5); }
  };

  const StepWhen = () => (
    <div style={SN.stepOuter}>
      <div style={SN.stepContent}>
        <Receipt />
        <div style={SN.question}>When?</div>

        <div style={S.field}>
          <DateTimePicker
            day={answers.startDate}
            time={answers.time}
            onDayChange={d => setAnswers(a => ({ ...a, startDate: d }))}
            onTimeChange={t => setAnswers(a => ({ ...a, time: t }))}
          />
        </div>

        {!isShortForm && (
          <div style={S.field}>
            <div style={{ ...S.fieldLbl, marginBottom: 8 }}>END DATE <span style={{ fontWeight: 400, color: P.textMuted }}>(optional)</span></div>
            <DateTimePicker
              day={answers.endDate}
              time=""
              onDayChange={d => setAnswers(a => ({ ...a, endDate: d }))}
              onTimeChange={() => {}}
              hideTime
              minDate={answers.startDate}
            />
          </div>
        )}
      </div>
      <div style={SN.stepFooter}>
        <button style={{ ...SN.nextBtn, opacity: answers.startDate ? 1 : 0.4 }}
          disabled={!answers.startDate || generating}
          onClick={handleGenerateName}>
          {generating ? "Working on it..." : "Next →"}
        </button>
      </div>
    </div>
  );

  // Step 5 — Confirm
  const nameInputRef = useRef(null);
  const handleSave = async () => {
    const finalName = nameInputRef.current?.value || answers.editedName;
    if (!finalName) return;
    setSaving(true);
    try {
      const dates = formatDates(answers.startDate, answers.endDate);
      const { data: tripData, error: tripError } = await supabase.from("trips").insert([{
        name: finalName, location: answers.location,
        city: !answers.vibe?.shortForm ? answers.location : "",
        emoji: answers.emoji || "✈️", dates,
        start_date: answers.startDate || null, end_date: answers.endDate || null,
        time: answers.time || null, total_spent: 0, settled: false,
        solo: answers.solo || answers.who.length === 0, user_id: userId,
      }]).select();
      if (tripError) throw tripError;
      const trip = tripData[0];
      await supabase.from("trip_members").insert([{ trip_id: trip.id, user_id: userId, role: "owner", status: "accepted" }]);
      const creatorName = userProfile?.display_name || "Me";
      const { data: existingMember } = await supabase.from("members").select("id").eq("trip_id", trip.id).eq("name", creatorName).single();
      if (!existingMember) await supabase.from("members").insert([{ trip_id: trip.id, name: creatorName }]);
      for (const email of answers.who) {
        const { data: existingUser } = await supabase.rpc("get_user_id_by_email", { email_input: email.toLowerCase() });
        const linkedUserId = existingUser?.[0]?.id || null;
        const { error: tmError } = await supabase.from("trip_members").insert([{ trip_id: trip.id, user_id: linkedUserId, invited_email: email.toLowerCase(), role: "member", status: linkedUserId ? "accepted" : "pending" }]);
        if (tmError && tmError.code !== '23505') throw tmError;
        // Use security-definer RPC to bypass RLS on profiles table
        let displayName = null;
        if (linkedUserId) {
          const { data: dn } = await supabase.rpc("get_display_name_by_user_id", { user_uuid: linkedUserId });
          if (dn) displayName = dn;
        }
        if (displayName) {
          const { data: existingMemberInvite } = await supabase.from("members").select("id")
            .eq("trip_id", trip.id).eq("name", displayName).maybeSingle();
          if (!existingMemberInvite) {
            await supabase.from("members").insert([{ trip_id: trip.id, name: displayName }]);
          }
        }
      }
      if (answers.guests?.length) {
        for (const guestName of answers.guests) {
          const { data: existing } = await supabase.from("members").select("id")
            .eq("trip_id", trip.id).eq("name", guestName).maybeSingle();
          if (!existing) await supabase.from("members").insert([{ trip_id: trip.id, name: guestName }]);
        }
      }
      if (answers.vibe?.shortForm && answers.location) {
        const itinType = ["dinner","coffee","drinks"].includes(answers.vibe.key) ? "restaurant" : "activity";
        await supabase.from("itinerary").insert([{ trip_id: trip.id, day: answers.startDate, time: answers.time || "", type: itinType, title: answers.location, detail: "", icon: answers.vibe.emoji, visibility: "group" }]);
      }
      onSave(trip);
    } catch (e) { console.error(e); setSaving(false); }
  };

  const StepConfirm = () => {
    const IconComp = TRIP_ICONS[answers.emoji] || (() => null);
    const dateStr = formatDates(answers.startDate, answers.endDate);
    const timeStr = formatTime12(answers.time);
    return (
      <div style={SN.stepOuter}>
        <div style={SN.stepContent}>
          <Receipt />
          <div style={SN.question}>Looks good?</div>
          <div style={SN.confirmCard}>
            <div style={SN.confirmIcon}><IconComp size={28} color={P.terracotta} strokeWidth={1.5} /></div>
            <input ref={nameInputRef} key="name-input" style={SN.nameInput} defaultValue={answers.editedName} maxLength={30}
              onBlur={e => setAnswers(a => ({ ...a, editedName: e.target.value }))} />
            <div style={SN.confirmMeta}>{answers.location}{dateStr ? ` · ${dateStr}` : ""}{timeStr ? ` · ${timeStr}` : ""}</div>
            <div style={SN.confirmPeople}>{answers.solo ? "Just you" : answers.who.length ? `You + ${answers.who.length} others` : "Just you"}</div>
          </div>
          <div style={{ fontSize: 12, color: P.textMuted, textAlign: "center", marginBottom: 16 }}>Tap the name to edit it</div>
        </div>
        <div style={SN.stepFooter}>
          <button style={{ ...SN.nextBtn, background: saving ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={handleSave} disabled={saving}>
            {saving ? "Working on it..." : "Let's go ✓"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: P.phoneBg, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ ...SN.header, paddingTop: 32, flexShrink: 0 }}>
        {step > 1 ? <button style={SN.backBtn} onClick={goBack}>← Back</button> : <div />}
        <div style={SN.stepIndicator}>
          {[1,2,3,4,5].map(n => <div key={n} style={{ ...SN.stepPip, ...(n <= step ? SN.stepPipOn : {}) }} />)}
        </div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ flex: 1, padding: "0 22px 16px", display: "flex", flexDirection: "column" }}>
        {step === 1 && <StepVibe />}
        {step === 2 && <StepWhere />}
        {step === 3 && <StepWho />}
        {step === 4 && <StepWhen />}
        {step === 5 && <StepConfirm />}
      </div>
    </div>
  );
}