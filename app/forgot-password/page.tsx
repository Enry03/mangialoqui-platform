"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `http://localhost:3000/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "Se l'email è registrata, ti abbiamo inviato un link per impostare una nuova password."
      );
    }
    setSending(false);
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Password dimenticata</h1>
        <p style={subtitleStyle}>
          Inserisci la tua email. Ti invieremo un link per creare una nuova password.
        </p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type="email"
            required
            placeholder="nome@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          {error && <div style={errorStyle}>{error}</div>}
          {message && <div style={successStyle}>{message}</div>}

          <button type="submit" disabled={sending} style={buttonStyle}>
            {sending ? "Invio in corso..." : "Invia link di reset"}
          </button>
        </form>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "radial-gradient(circle at top, #111827 0, #020617 55%)",
  color: "#e5e7eb",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const cardStyle: React.CSSProperties = {
  maxWidth: 420,
  width: "100%",
  padding: 24,
  background: "rgba(15,23,42,0.98)",
  borderRadius: 20,
  border: "1px solid rgba(55,65,81,0.9)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
};

const subtitleStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: "#9ca3af",
};

const formStyle: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(55,65,81,0.9)",
  background: "rgba(15,23,42,0.85)",
  color: "#e5e7eb",
  padding: "9px 14px",
  fontSize: 14,
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 4,
  padding: "9px 16px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(to right, #2563eb, #7c3aed)",
  color: "#f9fafb",
  fontWeight: 600,
  fontSize: 14,
};

const errorStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#f97373",
};

const successStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#4ade80",
};
