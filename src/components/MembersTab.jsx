import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { P, S } from "../constants";

function MembersTab({ trip, profile, expenses }) {
  const [members, setMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [showInvite, setShowInvite] = useState(false);
  const [newName, setNewName] = useState("");
  const myName = profile?.display_name || "";

  const memberBalances = {};
  expenses.forEach(exp => {
    const paidBy = exp.paid_by;
    const splitWith = exp.split_with || [];
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
        supabase.from('trip_members').select('user_id, invited_email').eq('trip_id', trip.id),
      ]);

      setMembers(memberRows || []);

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

  return (
    <div style={S.tabScroll}>
      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Members</div>
        <button style={S.newBtn} onClick={() => setShowInvite(true)}>+ Invite</button>
      </div>
      {showInvite && (
        <div style={{ background: P.surface1, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${P.surface3}` }}>
          <div style={S.fieldLbl}>INVITE BY EMAIL</div>
          <input style={S.input} placeholder="friend@email.com" value={newName} onChange={e => setNewName(e.target.value)} type="email" />
          <div style={{ fontSize: 12, color: P.textMuted, marginTop: 8, marginBottom: 12 }}>They'll see this trip when they sign in.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.secondaryBtn} onClick={() => setShowInvite(false)}>Cancel</button>
            <button style={{ ...S.primaryBtn, background: `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={async () => {
              if (!newName) return;
              const email = newName.trim().toLowerCase();
              const { data: existingUser } = await supabase.rpc('get_user_id_by_email', { email_input: email });
              const linkedUserId = existingUser?.[0]?.id || null;
              const { error: tmError } = await supabase.from('trip_members').insert([{ trip_id: trip.id, user_id: linkedUserId, invited_email: email, role: 'member', status: linkedUserId ? 'accepted' : 'pending' }]).select();
              if (tmError && tmError.code !== '23505') { console.error(tmError); return; }
              let displayName = email.split('@')[0];
              if (linkedUserId) {
                const { data: profileData } = await supabase.from('profiles').select('display_name').eq('id', linkedUserId).single();
                if (profileData?.display_name) displayName = profileData.display_name;
              }
              const { data: memberData, error: memberError } = await supabase.from('members').insert([{ trip_id: trip.id, name: displayName }]).select();
              if (memberError) console.error(memberError);
              else if (memberData) setMembers(prev => [...prev, memberData[0]]);
              setNewName(""); setShowInvite(false);
            }}>Invite</button>
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
                  <button style={S.rowDeleteBtn} onClick={async () => {
                    if (!window.confirm(`Remove ${m.name} from this trip?`)) return;
                    const { error } = await supabase.from('members').delete().eq('id', m.id);
                    if (!error) setMembers(prev => prev.filter(mb => mb.id !== m.id));
                  }}>✕</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ height: 20 }} />
    </div>
  );
}


export default MembersTab;
