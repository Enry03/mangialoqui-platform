"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        console.error(error);
        setError("Credenziali non valide. Controlla email e password.");
        setLoading(false);
        return;
      }

      router.replace("/card");
    } catch (err) {
      console.error(err);
      setError("Errore imprevisto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Accedi</h1>
        <p style={styles.subtitle}>
          Entra per vedere e usare la tua fidelity card.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@esempio.it"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <div style={styles.actionsRow}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => router.push("/forgot-password")}
          >
            Password dimenticata
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => router.push("/signup")}
          >
            Registrati
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle at top, #111827 0, #020617 55%)",
    padding: 24,
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "rgba(15,23,42,0.98)",
    borderRadius: 20,
    border: "1px solid rgba(55,65,81,0.9)",
    boxShadow: "0 24px 60px rgba(15,23,42,0.85)",
    padding: 24,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
    color: "#9ca3af",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  label: {
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  input: {
    borderRadius: 999,
    border: "1px solid rgba(55,65,81,0.9)",
    background: "rgba(15,23,42,0.85)",
    color: "#e5e7eb",
    padding: "8px 14px",
    fontSize: 14,
    outline: "none",
  },
  primaryButton: {
    marginTop: 6,
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(to right, #2563eb, #7c3aed)",
    color: "#f9fafb",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 10px 30px rgba(37,99,235,0.35)",
  },
  actionsRow: {
    marginTop: 18,
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
  },
  secondaryButton: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.6)",
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 13,
    textAlign: "center",
  },
  error: {
    fontSize: 13,
    color: "#f97373",
  },
};
