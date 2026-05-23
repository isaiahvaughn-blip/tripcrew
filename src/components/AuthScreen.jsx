import { useState } from "react";
import { supabase } from "../supabase";
import { P, S } from "../constants";
import { Eye, EyeOff } from "lucide-react";

const SA = {
  backBtn: { background: "transparent", border: "none", color: P.slateBlue, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 32, fontFamily: "'DM Sans', sans-serif" },
  wordmark: { fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 900, letterSpacing: "-2px", color: P.textPrimary, marginBottom: 8, fontStyle: "italic" },
  subtitle: { fontSize: 16, color: P.slateBlue, fontFamily: "'DM Sans', sans-serif" },
};

export default function AuthScreen({ onAuth, onBack }) {
  const [mode,          setMode]          = useState("login");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [resetSent,     setResetSent]     = useState(false);
  const [resetMode,     setResetMode]     = useState(false);

  const handle = async () => {
    setLoading(true); setError("");
    const { data, error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    onAuth(data.user);
  };

  const handleReset = async () => {
    if (!email) { setError("Enter your email above first."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/",
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setResetSent(true);
  };

  return (
    <div style={S.root}>
      <div style={S.phone}>
        <div style={{ padding: "52px 28px 0" }}>
          <button style={SA.backBtn} onClick={resetMode ? () => { setResetMode(false); setResetSent(false); setError(""); } : onBack}>
            ← Back
          </button>
          <div style={SA.wordmark}>vouze</div>
          <div style={SA.subtitle}>
            {resetMode ? "Reset your password" : mode === "login" ? "Welcome back" : "Create your account"}
          </div>
        </div>

        <div style={{ padding: "32px 28px 0" }}>

          {/* RESET MODE */}
          {resetMode ? (
            <>
              {resetSent ? (
                <div style={{ background: P.surface2, border: `1px solid ${P.surface3}`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
                  <div style={{ color: P.textPrimary, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Check your email</div>
                  <div style={{ color: P.slateBlue, fontSize: 14, lineHeight: 1.5 }}>We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link.</div>
                </div>
              ) : (
                <>
                  <div style={S.field}>
                    <div style={S.fieldLbl}>EMAIL</div>
                    <input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  {error && <div style={{ color: P.danger, fontSize: 13, marginBottom: 14 }}>{error}</div>}
                  <button
                    style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, marginBottom: 14 }}
                    onClick={handleReset} disabled={loading}>
                    {loading ? "..." : "Send Reset Link"}
                  </button>
                </>
              )}
            </>
          ) : (

          /* LOGIN / SIGNUP MODE */
          <>
            <div style={S.field}>
              <div style={S.fieldLbl}>EMAIL</div>
              <input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={S.field}>
              <div style={S.fieldLbl}>PASSWORD</div>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...S.input, paddingRight: 44 }}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: P.slateBlue, display: "flex", alignItems: "center" }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div style={{ textAlign: "right", marginTop: -8, marginBottom: 16 }}>
                <span
                  style={{ fontSize: 13, color: P.terracotta, cursor: "pointer", fontWeight: 700 }}
                  onClick={() => { setResetMode(true); setError(""); }}>
                  Forgot password?
                </span>
              </div>
            )}

            {error && <div style={{ color: P.danger, fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <button
              style={{ ...S.primaryBtn, background: loading ? P.surface2 : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})`, marginBottom: 14 }}
              onClick={handle} disabled={loading}>
              {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>

            <div style={{ display: "flex", alignItems: "center", margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: P.surface3 }} />
              <span style={{ color: P.textMuted, fontSize: 13, padding: "0 14px" }}>or</span>
              <div style={{ flex: 1, height: 1, background: P.surface3 }} />
            </div>

            <button style={{ ...S.primaryBtn, background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 18 }}
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/" } });
                if (error) console.error(error);
              }}>
              <img src="https://www.google.com/favicon.ico" style={{ width: 18, height: 18 }} alt="Google" />
              Continue with Google
            </button>

            <div style={{ textAlign: "center", fontSize: 14, color: P.slateBlue }}>
              {mode === "login" ? "No account? " : "Have an account? "}
              <span style={{ color: P.terracotta, cursor: "pointer", fontWeight: 700 }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
                {mode === "login" ? "Sign up" : "Sign in"}
              </span>
            </div>

            {mode === "signup" && (
              <div style={{ textAlign: "center", fontSize: 12, color: P.textMuted, marginTop: 14, lineHeight: 1.6 }}>
                By creating an account you agree to our{" "}
                <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: P.terracotta, textDecoration: "none", fontWeight: 700 }}>Terms</a>
                {" "}and{" "}
                <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: P.terracotta, textDecoration: "none", fontWeight: 700 }}>Privacy Policy</a>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}