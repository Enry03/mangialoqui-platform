"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseClient";

export default function RegisterCustomerPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) utente loggato
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Sessione scaduta, effettua di nuovo il login.");
        setLoading(false);
        return;
      }

      // 2) profilo → restaurant_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.restaurant_id) {
        setError("Profilo non valido, nessun ristorante collegato.");
        setLoading(false);
        return;
      }

      const restaurantId = profile.restaurant_id;

      // 3) genera subito il valore di qr_code
// (usiamo una stringa basata sul tempo; poi nel dettaglio userai questo nel QR)
const tempQrCode = `pending:${Date.now()}`;

// 4) crea customer con qr_code valorizzato
const { data: createdCustomer, error: customerError } = await supabase
  .from("customers")
  .insert({
    full_name: fullName || null,
    email: email || null,
    phone: phone || null,
    restaurant_id: restaurantId,
    qr_code: tempQrCode, // <--- IMPORTANTISSIMO: niente più null
  })
  .select("id")
  .single();

if (customerError || !createdCustomer) {
  console.error("customerError", customerError);
  setError("Errore nella creazione del cliente.");
  setLoading(false);
  return;
}

const customerId = createdCustomer.id;

// 5) (opzionale) se vuoi che qr_code sia proprio cust:<id>, puoi fare un update dopo:
const realQrCode = `cust:${customerId}`;
const { error: qrError } = await supabase
  .from("customers")
  .update({ qr_code: realQrCode })
  .eq("id", customerId);

if (qrError) {
  console.error("qrError", qrError);
}


      // 6) vai al dettaglio cliente
      router.replace(`/dashboard/customers/${customerId}`);
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
        <h1 style={styles.title}>Nuova fidelity card</h1>
        <p style={styles.subtitle}>
          Crea una nuova card, al cliente verranno assegnati subito +5 punti di
          benvenuto.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Nome e cognome
            <input
              style={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Es. Mario Rossi"
            />
          </label>

          <label style={styles.label}>
            Email (opzionale)
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="email@esempio.it"
            />
          </label>

          <label style={styles.label}>
            Telefono (opzionale)
            <input
              style={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Es. 333 1234567"
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading ? "Creazione in corso..." : "Crea card (+5 punti)"}
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
  error: {
    marginTop: 4,
    fontSize: 13,
    color: "#f97373",
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
};
