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
    setTransactions(txData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addPoints(amount: number) {
    if (!customer) return;

    const newTotal = customer.points + amount;

    const { error: updateError } = await supabase
      .from("customers")
      .update({ points: newTotal })
      .eq("id", customer.id);

    if (updateError) {
      alert("Errore aggiornamento punti");
      return;
    }

    await supabase.from("loyalty_transactions").insert({
      customer_id: customer.id,
      restaurant_id: customer.restaurant_id,
      points_delta: amount,
      reason: "dashboard",
    });

    await loadData();
    setCustomPoints("");
  }

  if (loading) {
    return <div style={{ padding: 40, color: "#fff" }}>Caricamento...</div>;
  }

  if (!customer) {
    return <div style={{ padding: 40, color: "#fff" }}>Cliente non trovato</div>;
  }

  return (
    <div style={{ padding: 40, color: "#fff" }}>
      <button onClick={() => router.back()} style={{ marginBottom: 20 }}>
        ← Indietro
      </button>

      <h1>{customer.full_name}</h1>
      <div style={{ marginTop: 5, opacity: 0.7 }}>{customer.email}</div>
      <div style={{ marginTop: 5, opacity: 0.7 }}>{customer.phone}</div>

      <div
        style={{
          marginTop: 30,
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        {customer.points} punti
      </div>

      <div style={{ marginTop: 30 }}>
        <button
          onClick={() => addPoints(5)}
          style={{ padding: "10px 20px", marginRight: 10 }}
        >
          +5 punti
        </button>

        <input
          type="number"
          placeholder="Punti custom"
          value={customPoints}
          onChange={(e) => setCustomPoints(e.target.value)}
          style={{ padding: 10, width: 120, marginRight: 10 }}
        />

        <button
          onClick={() => {
            const amount = parseInt(customPoints);
            if (!isNaN(amount)) addPoints(amount);
          }}
          style={{ padding: "10px 20px" }}
        >
          Aggiungi
        </button>
      </div>

      <div style={{ marginTop: 50 }}>
        <h2>Storico movimenti</h2>

        <div style={{ marginTop: 20, borderTop: "1px solid #333" }}>
          {transactions.length === 0 && (
            <div style={{ padding: 15, opacity: 0.6 }}>
              Nessuna transazione
            </div>
          )}

          {transactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                padding: 15,
                borderBottom: "1px solid #222",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div>{tx.reason}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {new Date(tx.created_at).toLocaleString("it-IT")}
                </div>
              </div>

              <div
                style={{
                  fontWeight: 700,
                  color: tx.points_delta > 0 ? "#4ade80" : "#f87171",
                }}
              >
                {tx.points_delta > 0 ? "+" : ""}
                {tx.points_delta}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}