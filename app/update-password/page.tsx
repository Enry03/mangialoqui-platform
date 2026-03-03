"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseClient";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // opzionale: verifica che arrivi da link valido
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        // se proprio vuoi, potresti mostrare un messaggio,
        // ma per il flusso base non è obbligatorio fare redirect
        console.log("No active session for password reset");
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    setUpdating(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
      setUpdating(false);
      return;
    }

    setMessage("Password aggiornata correttamente. Ora puoi accedere.");
    setUpdating(false);

    // dopo qualche secondo torna al login
    setTimeout(() => {
      router.replace("/login");
    }, 2000);
  }

  return (
    <div style={pageStyle2}>
      <div style={cardStyle2}>
        <h1 style={titleStyle2}>Imposta una nuova password</h1>
        <p style={subtitleStyle2}>
          Inserisci la nuova password per il tuo account.
        </p>

        <form onSubmit={handleSubmit} style={formStyle2}>
          <input
            type="password"
            required
            placeholder="Nuova password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle2}
          />

          <input
            type="password"
            required
            placeholder="Ripeti password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={inputStyle2}
          />

          {error && <div style={errorStyle2}>{error}</div>}
          {message && <div style={successStyle2}>{message}</div>}

          <button type="submit" disabled={updating} style={buttonStyle2}>
            {updating ? "Aggiornamento..." : "Salva nuova password"}
          </button>
        </form>
      </div>
    </div>
  );
}

const pageStyle2: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "radial-gradient(circle at top, #111827 0, #020617 55%)",
  color: "#e5e7eb",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const cardStyle2: React.CSSProperties = {
  maxWidth: 420,
  width: "100%",
  padding: 24,
  background: "rgba(15,23,42,0.98)",
  borderRadius: 20,
  border: "1px solid rgba(55,65,81,0.9)",
};

const titleStyle2: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
};

const subtitleStyle2: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: "#9ca3af",
};

const formStyle2: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const inputStyle2: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(55,65,81,0.9)",
  background: "rgba(15,23,42,0.85)",
  color: "#e5e7eb",
  padding: "9px 14px",
  fontSize: 14,
  outline: "none",
};

const buttonStyle2: React.CSSProperties = {
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

const errorStyle2: React.CSSProperties = {
  fontSize: 13,
  color: "#f97373",
};

const successStyle2: React.CSSProperties = {
  fontSize: 13,
  color: "#4ade80",
};
