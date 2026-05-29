import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { P, S } from "../constants";
import { resolveName } from "../utils";
import ConfirmModal from "./ConfirmModal";

function MembersTab({ trip, profile, expenses, profileMap = {} }) {
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);
  const [confirmRemoveInvite, setConfirmRemoveInvite] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [showInvite, setShowInvite] = useState(false);  // email invite panel
  const [showGuest, setShowGuest] = useState(false);    // guest name panel
  const [inviteEmail, setInviteEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const myName = profile?.display_name || "";

  // Build balances keyed by resolved display name
  const memberBalances = {};
  expenses.forEach(exp => {
    const paidBy    = resolveName(exp.paid_by, profileMap);
    const splitWith = (exp.split_with || []).map(e => resolveName(e, profileMap));
    if (!splitWith.length) return;
    const share = exp.amount / splitWith.length;
    if (!memberBalances[paidBy]) memberBalances[paidBy] = 0;
    memberBalances[paidBy] += exp.amount;
    splitWith.forEach(p => { if (!memberBalances[p]) memberBalances[p] = 0; memberBalances[p] -= share; });
  });

  const getBalanceLabel = (name) => {
    const bal = memberBalances[name];
    if (!bal || Math.abs(bal) < 0.5) return { text: "even", color: P.textMuted };
    if (bal > 0) return { text: `owed $${Math.round(bal)}`, color: P.success };
    return { text: `owes $${Math.round(Math.abs(bal))}`, color: P.danger };
  };

  useEffect(() => {
    const fetchMembers = async () => {
      const [{ data: memberRows }, { data: tmRows }] = await Promise.all([
        supabase.from('members').select('*').eq('trip_id', trip.id),
        supabase.from('trip_members').select('user_id, invited_email, status').eq('trip_id', trip.id),
      ]);

      setMembers(memberRows || []);

      // Pending invites — status=pending, has invited_email
      setPendingInvites((tmRows || []).filter(r => r.status === 'pending' && r.invited_email));

      const userIds = (tmRows || []).map(r => r.user_id).filter(Boolean);
      if (!userIds.length) return;

      const { data: profileRows } = await supabase
        .from('profiles').select('id, display_name, avatar').in('id', userIds);

      const nameMap = {};
      (profileRows || []).forEach(p => {
        const entry = { display_name: p.display_name, avatar: p.avatar };
        if (p.display_name) nameMap[p.display_name.toLowerCase()] = entry;
        const tm = (tmRows || []).find(r => r.user_id === p.id);
        if (tm?.invited_email) {
          nameMap[tm.invited_email.split('@')[0].toLowerCase()] = entry;
        }
      });

      setMemberProfiles(nameMap);
    };
    fetchMembers();
  }, [trip.id]);

  const avatarColors = [P.terracotta, P.lightBlue, P.orange, P.slateBlue, P.success];

  const getAvatarContent = (memberName) => {
    const p = memberProfiles[memberName.toLowerCase()];
    if (p?.avatar) {
      const av = p.avatar;
      if (av.startsWith('emoji:')) return { content: av.slice(6), isEmoji: true };
      if (av.startsWith('initials:')) return { content: av.slice(9).slice(0,3).toUpperCase(), isEmoji: false };
      if (av.startsWith('name:')) return { content: av.slice(5).slice(0,3).toUpperCase(), isEmoji: false };
    }
    const parts = memberName.trim().split(/\s+/);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
      : memberName.slice(0,2).toUpperCase();
    return { content: initials, isEmoji: false };
  };

  const getDisplayName = (memberName) => {
    const p = memberProfiles[memberName.toLowerCase()];
    return p?.display_name || memberName;
  };

  // Email invite handler (existing logic + RLS fix)
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const email = inviteEmail.trim().toLowerCase();
    const { data: existingUser } = await supabase.rpc('get_user_id_by_email', { email_input: email });
    const linkedUserId = existingUser?.[0]?.id || null;
    const { error: tmError } = await supabase.from('trip_members').insert([{
      trip_id: trip.id, user_id: linkedUserId, invited_email: email,
      role: 'member', status: linkedUserId ? 'accepted' : 'pending'
    }]);
    if (tmError && tmError.code !== '23505') { console.error(tmError); return; }
    // Use security-definer RPC to bypass RLS on profiles table
    let displayName = null;
    if (linkedUserId) {
      const { data: dn } = await supabase.rpc("get_display_name_by_user_id", { user_uuid: linkedUserId });
      if (dn) displayName = dn;
    }
    if (displayName) {
      const { data: existing } = await supabase.from('members').select('id')
        .eq('trip_id', trip.id).eq('name', displayName).maybeSingle();
      if (!existing) {
        const { data: md } = await supabase.from('members').insert([{ trip_id: trip.id, name: displayName }]).select();
        if (md) setMembers(prev => [...prev, md[0]]);
      }
    }
    setInviteEmail(""); setShowInvite(false);
  };

  // Guest add handler — name only, no account needed
  const handleAddGuest = async () => {
    const name = guestName.trim();
    if (!name) return;
    // Dedup check
    const { data: existing } = await supabase.from('members').select('id')
      .eq('trip_id', trip.id).eq('name', name).maybeSingle();
    if (existing) { setGuestName(""); setShowGuest(false); return; }
    const { data: md, error } = await supabase.from('members')
      .insert([{ trip_id: trip.id, name }]).select();
    if (error) { console.error(error); return; }
    if (md) setMembers(prev => [...prev, md[0]]);
    setGuestName(""); setShowGuest(false);
  };

  return (
    <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {confirmRemoveMember && (
        <ConfirmModal
          message={`Remove ${confirmRemoveMember.name} from this trip?`}
          onConfirm={async () => {
            await supabase.from("members").delete().eq("id", confirmRemoveMember.id);
            setMembers(prev => prev.filter(mem => mem.id !== confirmRemoveMember.id));
            setConfirmRemoveMember(null);
          }}
          onCancel={() => setConfirmRemoveMember(null)}
          confirmLabel="Remove"
          danger
        />
      )}
      {confirmRemoveInvite && (
        <ConfirmModal
          message={`Cancel invite to ${confirmRemoveInvite.invited_email}?`}
          onConfirm={async () => {
            await supabase.from("trip_members").delete()
              .eq("trip_id", trip.id).eq("invited_email", confirmRemoveInvite.invited_email).eq("status", "pending");
            setPendingInvites(prev => prev.filter(i => i.invited_email !== confirmRemoveInvite.invited_email));
            setConfirmRemoveInvite(null);
          }}
          onCancel={() => setConfirmRemoveInvite(null)}
          confirmLabel="Cancel Invite"
          danger
        />
      )}
      <div style={S.tabScroll}>
        <div style={S.tabTopRow}>
          <div style={S.tabTitle}>Members</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.actionBtn, color: P.slateBlue, borderColor: P.slateBlue + "50" }}
              onClick={() => { setShowGuest(true); setShowInvite(false); }}>+ Guest</button>
            <button style={S.newBtn}
              onClick={() => { setShowInvite(true); setShowGuest(false); }}>+ Invite</button>
          </div>
        </div>

        {/* Email invite panel */}
        {showInvite && (
          <div style={{ background: P.surface1, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${P.surface3}` }}>
            <div style={S.fieldLbl}>INVITE BY EMAIL</div>
            <input style={S.input} placeholder="friend@email.com" value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)} type="email"
              onKeyDown={e => { if (e.key === "Enter") handleInvite(); }} />
            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8, marginBottom: 12 }}>
              They'll see this trip when they sign in.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.secondaryBtn} onClick={() => { setShowInvite(false); setInviteEmail(""); }}>Cancel</button>
              <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }}
                onClick={handleInvite}>Invite</button>
            </div>
          </div>
        )}

        {/* Guest name panel */}
        {showGuest && (
          <div style={{ background: P.surface1, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${P.slateBlue}40` }}>
            <div style={S.fieldLbl}>ADD GUEST</div>
            <input style={S.input} placeholder="e.g. Zane, Aunt Carol" value={guestName}
              onChange={e => setGuestName(e.target.value)} autoFocus
              onKeyDown={e => { if (e.key === "Enter") handleAddGuest(); }} />
            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8, marginBottom: 12 }}>
              No account needed — just a name for splitting expenses.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.secondaryBtn} onClick={() => { setShowGuest(false); setGuestName(""); }}>Cancel</button>
              <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.lightBlue}, ${P.slateBlue})` }}
                onClick={handleAddGuest}>Add Guest</button>
            </div>
          </div>
        )}

        {members.map((m, i) => {
          const { content, isEmoji } = getAvatarContent(m.name);
          const displayName = getDisplayName(m.name);
          const color = avatarColors[i % avatarColors.length];
          const balance = getBalanceLabel(m.name);
          return (
            <div key={m.id} style={S.memberRow}>
              <div style={{ ...S.memberAvatar, background: color + "25", color }}>
                <span style={{ fontSize: isEmoji ? 22 : 16, fontWeight: isEmoji ? 400 : 900, letterSpacing: "-0.5px" }}>{content}</span>
              </div>
              <div style={S.memberInfo}>
                <div style={S.memberName}>{displayName}</div>
              </div>
              <div style={S.memberRight}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ background: P.surface2, border: `1px solid ${balance.color}30`, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: balance.color, minWidth: 80, textAlign: "center" }}>{balance.text}</div>
                  {m.name !== myName && (
                    <button style={S.rowDeleteBtn} onClick={() => setConfirmRemoveMember(m)}>✕</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Pending invites section */}
        {pendingInvites.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.textMuted, letterSpacing: "1.5px", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>WAITING TO JOIN</div>
            {pendingInvites.map((invite, i) => (
              <div key={i} style={{ ...S.memberRow, opacity: 0.7 }}>
                <div style={{ ...S.memberAvatar, background: P.surface3, color: P.textMuted }}>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>?</span>
                </div>
                <div style={S.memberInfo}>
                  <div style={{ ...S.memberName, fontSize: 14, color: P.textSecondary }}>{invite.invited_email}</div>
                  <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>Invite sent · hasn't signed up yet</div>
                </div>
                <div style={S.memberRight}>
                  <button style={S.rowDeleteBtn} onClick={() => setConfirmRemoveInvite(invite)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

export default MembersTab;