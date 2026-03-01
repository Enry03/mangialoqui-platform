"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useRouter, useParams } from "next/navigation";

type Transaction = {
  id: string;
  points_delta: number;
  reason: string;
  created_at: string;
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customPoints, setCustomPoints] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: customerData } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (!customerData) {
      setLoading(false);
      return;
    }

    const { data: txData } = await supabase
      .from("loyalty_transactions")
      .select("id, points_delta, reason, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    setCustomer(customerData);
    console.log("CUSTOMER FROM DB:", customerData.id, customerData.points);
    setTransactions(txData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addPoints(amount: number) {
  if (!customer || amount === 0) return;

  setSaving(true);

  try {
    const supa = supabase;
    const newTotal = (customer.points || 0) + amount;

    console.log("UPDATING CUSTOMER ID:", customer.id);
    console.log("NEW TOTAL:", newTotal);

    // 1) aggiorna il saldo nel DB
    const { error: updateError } = await supa
      .from("customers")
      .update({ points: newTotal })
      .eq("id", customer.id);

    console.log("UPDATE ERROR:", updateError);

    if (updateError) {
      alert("Errore aggiornamento punti");
      return;
    }

    // 2) registra la transazione nello storico
    const { error: insertError } = await supa
      .from("loyalty_transactions")
      .insert({
        customer_id: customer.id,
        restaurant_id: customer.restaurant_id,
        points_delta: amount,
        reason: "dashboard",
      });

    console.log("INSERT ERROR:", insertError);

    if (insertError) {
      alert("Errore salvataggio transazione");
      return;
    }

    // 3) aggiorna UI locale
    setCustomer((prev: any) =>
      prev ? { ...prev, points: newTotal } : prev
    );

    // 4) ricarica lo storico movimenti
    const { data: txData } = await supa
      .from("loyalty_transactions")
      .select("id, points_delta, reason, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    setTransactions(txData || []);
    setCustomPoints("");
  } finally {
    setSaving(false);
  }
}


  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Caricamento...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Cliente non trovato</div>
      </div>
    );
  }

  const joinedAt = new Date(customer.created_at).toLocaleDateString("it-IT");
  const currentPoints = transactions.reduce(
  (acc, tx) => acc + (tx.points_delta || 0),
  0
);


  return (
    <div style={styles.page}>
      <button
        onClick={() => router.push("/dashboard/customers")}
        style={styles.backButton}
      >
        ← Indietro
      </button>

      <div style={styles.layout}>
        {/* COLONNA SINISTRA: INFO CLIENTE */}
        <section style={styles.leftColumn}>
          <div style={styles.cardPrimary}>
            <div style={styles.customerHeader}>
              <div style={styles.avatarCircle}>
                {(customer.full_name || "?")
                  .toString()
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <h1 style={styles.customerName}>
                  {customer.full_name || "Cliente senza nome"}
                </h1>
                <div style={styles.customerMeta}>
                  {customer.email && <span>{customer.email}</span>}
                  {customer.phone && (
                    <>
                      <span style={styles.dot}>•</span>
                      <span>{customer.phone}</span>
                    </>
                  )}
                </div>
                <div style={styles.customerMetaSmall}>
                  Iscritto il {joinedAt}
                </div>
              </div>
            </div>

            <div style={styles.pointsRow}>
              <div>
                <div style={styles.pointsLabel}>Saldo punti</div>
                <div style={styles.pointsValue}>{currentPoints}</div>
              </div>
              <div style={styles.pointsChip}>Fidelity attiva</div>
            </div>
          </div>

          {/* AZIONI PUNTI */}
          <div style={styles.cardSecondary}>
            <h2 style={styles.sectionTitle}>Aggiungi punti</h2>

            <div style={styles.addPointsRow}>
              <button
                style={styles.primaryButton}
                onClick={() => addPoints(5)}
                disabled={saving}
              >
                +5 punti
              </button>

              <div style={styles.customPointsWrapper}>
                <input
                  type="number"
                  placeholder="Punti custom"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  style={styles.input}
                />
                <button
                  style={styles.secondaryButton}
                  onClick={() => {
                    const amount = parseInt(customPoints, 10);
                    if (!isNaN(amount)) {
                      addPoints(amount);
                    }
                  }}
                  disabled={saving}
                >
                  Aggiungi
                </button>
              </div>
            </div>

            {saving && (
              <div style={styles.savingLabel}>Salvataggio in corso...</div>
            )}
          </div>
        </section>

        {/* COLONNA DESTRA: STORICO */}
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
                    <div style={styles.txReason}>{tx.reason}</div>
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
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #111827 0, #020617 55%)",
    padding: "28px 40px 40px",
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loading: {
    paddingTop: 80,
    textAlign: "center",
    color: "#9ca3af",
  },
  backButton: {
    marginBottom: 16,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.6)",
    background: "rgba(15,23,42,0.8)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 13,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
    gap: 24,
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
  },
  cardPrimary: {
    background: "rgba(15,23,42,0.96)",
    borderRadius: 20,
    border: "1px solid rgba(55,65,81,0.9)",
    padding: 22,
    boxShadow: "0 24px 60px rgba(15,23,42,0.9)",
  },
  cardSecondary: {
    background: "rgba(15,23,42,0.96)",
    borderRadius: 20,
    border: "1px solid rgba(55,65,81,0.85)",
    padding: 20,
  },
  customerHeader: {
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: "999px",
    background:
      "conic-gradient(from 140deg, #2563eb, #7c3aed, #f97316, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 22,
    color: "#0b1120",
  },
  customerName: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
  },
  customerMeta: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 14,
    color: "#cbd5f5",
    marginTop: 4,
  },
  dot: {
    opacity: 0.6,
  },
  customerMetaSmall: {
    marginTop: 4,
    fontSize: 12,
    color: "#9ca3af",
  },
  pointsRow: {
    marginTop: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.12,
    color: "#9ca3af",
  },
  pointsValue: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: 800,
  },
  pointsChip: {
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(22,163,74,0.12)",
    color: "#4ade80",
    fontSize: 12,
    fontWeight: 600,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 14,
  },
  addPointsRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  customPointsWrapper: {
    display: "flex",
    gap: 8,
    flex: 1,
  },
  primaryButton: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(to right, #2563eb, #7c3aed)",
    color: "#f9fafb",
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  secondaryButton: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.7)",
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  input: {
    flex: 1,
    borderRadius: 999,
    border: "1px solid rgba(55,65,81,0.9)",
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    padding: "8px 12px",
    outline: "none",
    fontSize: 14,
  },
  savingLabel: {
    marginTop: 10,
    fontSize: 12,
    color: "#9ca3af",
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
};
