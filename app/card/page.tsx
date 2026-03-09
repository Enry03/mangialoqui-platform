"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseClient";
import { QRCodeSVG } from "qrcode.react";

type Transaction = {
  id: string;
  points_delta: number;
  reason: string | null;
  created_at: string;
};

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  qr_code: string;
  created_at: string;
  restaurant_id: string | null;
};

type Restaurant = {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
};

export default function CardPage() {
  const router = useRouter();

  const [sessionChecked, setSessionChecked] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // 1) Controllo sessione
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      // 2) Carico il customer legato all'utente
      const { data: cust, error: custError } = await supabase
        .from("customers")
        .select(
          `
          id,
          full_name,
          email,
          phone,
          qr_code,
          created_at,
          restaurant_id
        `
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (custError) {
        console.error("custError", custError);
        setError("Errore nel caricamento della card.");
        setLoading(false);
        setSessionChecked(true);
        return;
      }

      if (cust) {
        const loadedCustomer: Customer = {
          id: cust.id as string,
          full_name: cust.full_name ?? null,
          email: cust.email ?? null,
          phone: cust.phone ?? null,
          qr_code: cust.qr_code,
          created_at: cust.created_at,
          restaurant_id: cust.restaurant_id ?? null,
        };

        setCustomer(loadedCustomer);
        console.log("customer loaded in card page:", loadedCustomer);

        // 3) Carico il ristorante dalla FK restaurant_id (se presente)
        if (loadedCustomer.restaurant_id) {
          console.log(
            "loading restaurant by id from customer.restaurant_id:",
            loadedCustomer.restaurant_id
          );

          const { data: rest, error: restError } = await supabase
            .from("restaurants")
            .select("id, name, logo_url, primary_color, accent_color")
            .eq("id", loadedCustomer.restaurant_id)
            .maybeSingle();

          if (!restError && rest) {
            console.log("restaurant loaded for card:", rest);

            setRestaurant({
              name: rest.name,
              logo_url: rest.logo_url,
              primary_color: rest.primary_color,
              accent_color: rest.accent_color,
            });
          } else if (restError) {
            console.error("restaurantError in card:", restError);
          } else {
            console.warn(
              "no restaurant found with id from customer.restaurant_id:",
              loadedCustomer.restaurant_id
            );
          }
        } else {
          console.warn(
            "customer.restaurant_id is null/undefined in card page, cannot load restaurant"
          );
        }

        // 4) Carico lo storico transazioni
        await loadTransactions(loadedCustomer.id);
        setLoading(false);
        setSessionChecked(true);
      } else {
        // Nessun customer → mostro form di creazione
        setLoading(false);
        setSessionChecked(true);
      }
    }

    init();
  }, [router]);

  async function loadTransactions(customerId: string) {
    const { data: txData, error: txError } = await supabase
      .from("loyalty_transactions")
      .select("id, points_delta, reason, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (txError) {
      console.error("txError", txError);
      return;
    }

    setTransactions((txData || []) as Transaction[]);
  }

  async function handleCreateCard(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const user = session.user;
      const userId = user.id;
      const email = user.email;

      const restaurantId = null; // nessun ristorante associato alla creazione
      const tempQr = `pending:${Date.now()}`;

      const { data: created, error: createError } = await supabase
        .from("customers")
        .insert({
          user_id: userId,
          full_name: fullName || null,
          phone: phone || null,
          email: email || null,
          restaurant_id: restaurantId,
          qr_code: tempQr,
        })
        .select(
          `
          id,
          full_name,
          email,
          phone,
          qr_code,
          created_at,
          restaurant_id
        `
        )
        .single();

      if (createError || !created) {
        console.error("createError", createError);
        setError("Errore nella creazione della card.");
        setCreating(false);
        return;
      }

      const customerId = created.id as string;
      const realQr = `cust:${customerId}`;

      const { error: qrError } = await supabase
        .from("customers")
        .update({ qr_code: realQr })
        .eq("id", customerId);

      if (qrError) {
        console.error("qrError", qrError);
      }

      const finalCustomer: Customer = {
        id: created.id as string,
        full_name: created.full_name ?? null,
        email: created.email ?? null,
        phone: created.phone ?? null,
        qr_code: realQr,
        created_at: created.created_at,
        restaurant_id: created.restaurant_id ?? null,
      };

      setCustomer(finalCustomer);

      // Bonus di benvenuto
      const { error: txError } = await supabase
        .from("loyalty_transactions")
        .insert({
          customer_id: customerId,
          restaurant_id: restaurantId,
          points_delta: 5,
          reason: "welcome",
        });

      if (txError) {
        console.error("txWelcomeError", txError);
      }

      await loadTransactions(customerId);
    } catch (err) {
      console.error(err);
      setError("Errore imprevisto.");
    } finally {
      setCreating(false);
    }
  }

  if (!sessionChecked || loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Caricamento card...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Crea la tua fidelity card</h1>
          <p style={styles.subtitle}>
            Inserisci i tuoi dati: ti verranno assegnati subito +5 punti di
            benvenuto.
          </p>

          <form onSubmit={handleCreateCard} style={styles.form}>
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
              disabled={creating}
            >
              {creating ? "Creazione in corso..." : "Crea card (+5 punti)"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentPoints = transactions.reduce(
    (acc, tx) => acc + (tx.points_delta || 0),
    0
  );
  const joinedAt = new Date(customer.created_at).toLocaleDateString("it-IT");

  const cardBg = restaurant?.primary_color || "#06327c";
  const cardBorder = restaurant?.accent_color || "#a855f7";
  const qrBg = restaurant?.primary_color || "#06327c";

  return (
    <div style={styles.page}>
      <div style={styles.cardWide}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>La tua fidelity card</h1>
          <button
            style={styles.logoutButton}
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
          >
            Esci
          </button>
        </div>

        <p style={styles.subtitle}>
          Mostra questa schermata (o il QR) al ristorante per accumulare punti.
        </p>

        <div style={styles.cardLayout}>
          {/* Card verticale */}
          <section style={styles.leftColumn}>
            <div
              style={{
                ...styles.verticalCard,
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <div style={styles.topRow}>
                <div>
                  <div style={styles.cardNameLine}>
                    {customer.full_name || "Cliente senza nome"}
                  </div>
                  <div style={styles.customerMetaSmall}>
                    Iscritto il {joinedAt}
                  </div>
                </div>

                <div style={styles.pointsBlock}>
                  <div style={styles.pointsLabelSmall}>Saldo punti</div>
                  <div style={styles.pointsBig}>{currentPoints}</div>
                </div>
              </div>

              <div style={styles.qCenter}>
                <div style={styles.qrWhiteBox}>
                  <QRCodeSVG
                    value={customer.qr_code}
                    size={140}
                    bgColor={qrBg}
                    fgColor="#ffffff"
                    level="M"
                  />
                </div>
              </div>

              <div style={styles.bottomLogoRow}>
                <div style={styles.restaurantLogoCircle}>
                  {restaurant?.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name || "Logo ristorante"}
                      style={styles.restaurantLogoImage}
                    />
                  ) : (
                    <span style={styles.restaurantLogoText}>
                      {(restaurant?.name || "R").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Storico movimenti */}
          <section style={styles.rightColumn}>
            <div style={styles.cardSecondary}>
              <h2 style={styles.sectionTitle}>Storico movimenti</h2>

              <div style={styles.transactionsList}>
                {transactions.length === 0 && (
                  <div style={styles.emptyState}>
                    Nessuna transazione ancora registrata.
                  </div>
                )}

                {transactions.map((tx) => (
                  <div key={tx.id} style={styles.txRow}>
                    <div>
                      <div style={styles.txReason}>
                        {tx.reason || "Movimento punti"}
                      </div>
                      <div style={styles.txDate}>
                        {new Date(tx.created_at).toLocaleString("it-IT")}
                      </div>
                    </div>

                    <div
                      style={{
                        ...styles.txAmount,
                        color: tx.points_delta > 0 ? "#4ade80" : "#f97373",
                      }}
                    >
                      {tx.points_delta > 0 ? "+" : ""}
                      {tx.points_delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
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
  loading: {
    paddingTop: 80,
    textAlign: "center",
    color: "#9ca3af",
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
  cardWide: {
    width: "100%",
    maxWidth: 960,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  logoutButton: {
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.7)",
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 13,
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
  cardLayout: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
    gap: 20,
  } as any,
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
  },
  cardSecondary: {
    background: "rgba(15,23,42,0.96)",
    borderRadius: 20,
    border: "1px solid rgba(55,65,81,0.85)",
    padding: 20,
    height: "100%",
  },
  customerMetaSmall: {
    marginTop: 4,
    fontSize: 12,
    color: "#cbd5f5",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 14,
  },
  transactionsList: {
    marginTop: 8,
    maxHeight: 420,
    overflowY: "auto",
  },
  emptyState: {
    padding: 16,
    fontSize: 14,
    color: "#9ca3af",
  },
  txRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(31,41,55,0.9)",
  },
  txReason: {
    fontSize: 14,
    fontWeight: 500,
  },
  txDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  txAmount: {
    fontWeight: 700,
    fontSize: 14,
  },
  verticalCard: {
    width: "100%",
    maxWidth: 280,
    height: 430,
    borderRadius: 18,
    backgroundColor: "#06327c",
    border: "2px solid #a855f7",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    color: "#ffffff",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardNameLine: {
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.3,
  },
  pointsBlock: {
    textAlign: "right",
  },
  pointsLabelSmall: {
    fontSize: 11,
    marginBottom: 4,
  },
  pointsBig: {
    fontSize: 30,
    fontWeight: 700,
  },
  qCenter: {
    flexGrow: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  qrWhiteBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  bottomLogoRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: 10,
  },
  restaurantLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: "999px",
    border: "2px solid #ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantLogoText: {
    fontSize: 18,
    fontWeight: 700,
  },
  restaurantLogoImage: {
    width: "70%",
    height: "70%",
    objectFit: "contain",
  },
};
