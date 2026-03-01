"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseClient";
import { getSubdomainFromHost } from "@/lib/getSubdomain";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 0) ricava subdominio e restaurant_id
      const host =
        typeof window !== "undefined" ? window.location.host : undefined;
      const subdomain = getSubdomainFromHost(host);

      if (!subdomain) {
        setError("Ristorante non riconosciuto dall'indirizzo.");
        setLoading(false);
        return;
      }

      const { data: restaurant, error: restError } = await supabase
        .from("restaurants")
        .select("id")
        .eq("subdomain", subdomain)
        .single();

      if (restError || !restaurant) {
        console.error("restError", restError);
        setError("Ristorante non configurato.");
        setLoading(false);
        return;
      }

      const restaurantId = restaurant.id as string;

      // 1) crea utente auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError || !signUpData.user) {
        console.error(signUpError);
        setError("Errore nella registrazione. Controlla i dati inseriti.");
        setLoading(false);
        return;
      }

      const userId = signUpData.user.id;

      // 2) crea customer collegato
      const tempQr = `pending:${Date.now()}`;

      const { data: created, error: custError } = await supabase
        .from("customers")
        .insert({
          user_id: userId,
          full_name: fullName,
          phone,
          email,
          restaurant_id: restaurantId,
          qr_code: tempQr,
        })
        .select("id")
        .single();

      if (custError || !created) {
        console.error(custError);
        setError(
          "Registrazione completata ma errore nella creazione della card."
        );
        setLoading(false);
        return;
      }

      const customerId = created.id as string;

      // 3) aggiorna qr_code definitivo
      const realQr = `cust:${customerId}`;
      const { error: qrError } = await supabase
        .from("customers")
        .update({ qr_code: realQr })
        .eq("id", customerId);

      if (qrError) {
        console.error(qrError);
      }

      // 4) +5 punti di benvenuto
      const { error: txError } = await supabase
        .from("loyalty_transactions")
        .insert({
          customer_id: customerId,
          restaurant_id: restaurantId,
          points_delta: 5,
          reason: "welcome",
        });

      if (txError) {
        console.error(txError);
      }

      // 5) vai alla card
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
        <h1 style={styles.title}>Crea il tuo account</h1>
        <p style={styles.subtitle}>
          Registrati per ottenere la tua fidelity card con subito +5 punti di
          benvenuto.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Nome e cognome
            <input
              style={styles.input}
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Es. Mario Rossi"
            />
          </label>

          <label style={styles.label}>
            Telefono
            <input
              style={styles.input}
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Es. 333 1234567"
            />
          </label>

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
            {loading ? "Registrazione in corso..." : "Registrati e crea card"}
          </button>
        </form>
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
    maxWidth: 520,
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
  error: {
    marginTop: 4,
    fontSize: 13,
    color: "#f97373",
  },
};
