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

        const { data, error } = await supabase
          .from("restaurants")
          .select("id, name, slug")
          .ilike("slug", slug);

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
          // status, id, created_at usano i default del db
        });

      if (insertError) {
        console.error(insertError);
        setError("Errore nell'invio della richiesta.");
        return;
      }

      // Qui in futuro agganceremo una Edge Function che manda la mail al cliente

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
        <div style={styles.loading}>Caricamento ristorante...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <button
            type="button"
            onClick={() => history.back()}
            style={styles.backButton}
          >
            ←
          </button>
          <div style={styles.headerInfo}>
            <div style={styles.headerTitle}>Prenota un tavolo</div>
            <div style={styles.headerSub}>
              Questa è una richiesta di prenotazione.
            </div>
          </div>
        </header>

        <main style={styles.main}>
          {restaurantError && <div style={styles.error}>{restaurantError}</div>}

          <p style={styles.subtitle}>
            Inserisci i tuoi dati: la richiesta verrà inviata al ristorante e
            sarà valida solo dopo la conferma.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Quando */}
            <section style={styles.group}>
              <h2 style={styles.groupTitle}>Quando</h2>

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
                  onChange={(e) =>
                    setPeople(parseInt(e.target.value || "1", 10))
                  }
                />
              </label>
            </section>

            {/* Dati cliente */}
            <section style={styles.group}>
              <h2 style={styles.groupTitle}>I tuoi dati</h2>

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
            </section>

            {/* Note */}
            <section style={styles.group}>
              <h2 style={styles.groupTitle}>Note (opzionale)</h2>
              <label style={styles.label}>
                Richieste particolari
                <textarea
                  style={styles.textarea}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Intolleranze, allergie, occasioni speciali..."
                />
              </label>
            </section>

            {error && <div style={styles.error}>{error}</div>}
            {success && (
              <div style={styles.success}>
                Richiesta inviata. Riceverai una email di conferma appena il
                ristorante approverà la prenotazione.
              </div>
            )}

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={submitting || !restaurantId}
            >
              {submitting
                ? "Invio in corso..."
                : "Invia richiesta di prenotazione"}
            </button>

            <p style={styles.footerNote}>
              Nessun addebito ora. La prenotazione sarà effettiva solo dopo la
              conferma del ristorante.
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #020617 0%, #02091b 35%, #020617 100%)",
    display: "flex",
    justifyContent: "center",
    padding: "16px 12px 24px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loading: {
    color: "#e5e7eb",
  },
  wrapper: {
    width: "100%",
    maxWidth: 520,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "4px 4px 0",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.5)",
    backgroundColor: "rgba(15,23,42,0.95)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: "30px",
    textAlign: "center",
  },
  headerInfo: {
    display: "flex",
    flexDirection: "column",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#e5e7eb",
  },
  headerSub: {
    fontSize: 12,
    color: "#9ca3af",
  },
  main: {
    marginTop: 4,
    backgroundColor: "#f9fafb",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 18px 50px rgba(15,23,42,0.65)",
  },
  subtitle: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 16,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  group: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
  },
  label: {
    fontSize: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#4b5563",
  },
  input: {
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#f9fafb",
    color: "#0f172a",
    padding: "8px 14px",
    fontSize: 14,
    outline: "none",
  },
  textarea: {
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    background: "#f9fafb",
    color: "#0f172a",
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    minHeight: 80,
    resize: "vertical",
  },
  primaryButton: {
    marginTop: 4,
    padding: "12px 18px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background:
      "linear-gradient(90deg, #0f172a 0%, #1d3557 40%, #e36414 100%)",
    color: "#f9fafb",
    fontWeight: 600,
    fontSize: 15,
    boxShadow: "0 14px 30px rgba(15,23,42,0.55)",
  },
  error: {
    marginBottom: 8,
    fontSize: 13,
    color: "#dc2626",
  },
  success: {
    marginBottom: 8,
    fontSize: 13,
    color: "#15803d",
  },
  footerNote: {
    marginTop: 8,
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
};
