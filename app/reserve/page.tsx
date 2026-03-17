"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { getSubdomainFromHost } from "@/lib/getSubdomain";

export default function ReservePage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("20:00");
  const [people, setPeople] = useState(2);
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Carica restaurant_id dallo slug del dominio
  useEffect(() => {
    async function loadRestaurant() {
      try {
        const host =
          typeof window !== "undefined" ? window.location.hostname : null;
        const slug = getSubdomainFromHost(host);

        if (!slug) {
          setRestaurantError("Ristorante non riconosciuto dall'URL.");
          setLoadingRestaurant(false);
          return;
        }
        console.log("HOST RESERVE:", host);
        console.log("SLUG RESERVE:", slug);


        const { data, error } = await supabase
          .from("restaurants")
          .select("id, name, slug")
          .ilike("slug", slug); // case-insensitive

        console.log("DEBUG restaurants by slug:", data, error);

        if (error || !data || data.length === 0) {
          console.error("restaurant_load_error", error);
          setRestaurantError("Ristorante non trovato.");
          setLoadingRestaurant(false);
          return;
        }

        const rest = data[0];
        setRestaurantId(rest.id as string);
        setLoadingRestaurant(false);

      } catch (err) {
        console.error(err);
        setRestaurantError("Errore nel caricamento del ristorante.");
        setLoadingRestaurant(false);
      }
    }

    loadRestaurant();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!restaurantId) {
      setError("Ristorante non valido.");
      return;
    }

    if (!customerName || !customerEmail || !customerPhone || !bookingDate) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from("reservations")
        .insert({
          restaurant_id: restaurantId,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_name: customerName,
          booking_date: bookingDate,
          booking_time: bookingTime,
          people,
          note: note || null,
        });

      if (insertError) {
        console.error(insertError);
        setError("Errore nell'invio della prenotazione.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Errore imprevisto.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingRestaurant) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>Caricamento ristorante...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Prenota un tavolo</h1>
        <p style={styles.subtitle}>
          Inserisci i tuoi dati, ti confermeremo la prenotazione appena
          possibile.
        </p>

        {restaurantError && <div style={styles.error}>{restaurantError}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Nome e cognome *
            <input
              style={styles.input}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Es. Mario Rossi"
            />
          </label>

          <label style={styles.label}>
            Email *
            <input
              style={styles.input}
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="nome@example.com"
            />
          </label>

          <label style={styles.label}>
            Telefono *
            <input
              style={styles.input}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Es. 3331234567"
            />
          </label>

          <label style={styles.label}>
            Data prenotazione *
            <input
              style={styles.input}
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </label>

          <label style={styles.label}>
            Orario *
            <select
              style={styles.input}
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
            >
              <option value="19:00">19:00</option>
              <option value="20:00">20:00</option>
              <option value="21:00">21:00</option>
            </select>
          </label>

          <label style={styles.label}>
            Numero di persone *
            <input
              style={styles.input}
              type="number"
              min={1}
              max={20}
              value={people}
              onChange={(e) => setPeople(parseInt(e.target.value || "1", 10))}
            />
          </label>

          <label style={styles.label}>
            Note (opzionale)
            <textarea
              style={{ ...styles.input, minHeight: 80, borderRadius: 12 }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Intolleranze, richieste particolari..."
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}
          {success && (
            <div style={styles.success}>
              Prenotazione inviata, ti arriverà una conferma via email.
            </div>
          )}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={submitting || !restaurantId}
          >
            {submitting ? "Invio in corso..." : "Invia prenotazione"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #111827 0, #020617 55%)",
    padding: "28px 16px 40px",
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    display: "flex",
    justifyContent: "center",
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
    marginTop: 10,
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
  success: {
    marginTop: 4,
    fontSize: 13,
    color: "#4ade80",
  },
};
