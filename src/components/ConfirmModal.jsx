import { P, S } from "../constants";

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "Confirm", danger = false }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <div style={{ background: P.surface1, border: `1px solid ${P.surface3}`, borderRadius: 20, padding: "24px 22px", width: "100%" }}>
        <div style={{ fontSize: 15, color: P.textPrimary, fontWeight: 600, marginBottom: 20, lineHeight: 1.5, textAlign: "center" }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.secondaryBtn, flex: 1 }} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.primaryBtn, flex: 1, background: danger ? P.danger : `linear-gradient(135deg, ${P.orange}, ${P.terracotta})` }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
