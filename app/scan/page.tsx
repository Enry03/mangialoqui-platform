"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScanPage() {
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [pointsToAdd, setPointsToAdd] = useState<number>(5);

  useEffect(() => {
    if (scannedId) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();

        setScannedId(decodedText);

        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", decodedText)
          .single();

        if (error) {
          alert("Cliente non trovato");
          return;
        }

        setCustomer(data);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scannedId]);

  async function addPoints() {
    if (!customer) return;

    const newPoints = customer.points + pointsToAdd;

    const { error } = await supabase
      .from("customers")
      .update({ points: newPoints })
      .eq("id", customer.id);

    if (error) {
      alert("Errore aggiornamento punti");
      return;
    }

    alert("Punti aggiunti!");

    setCustomer({ ...customer, points: newPoints });
  }

  return (
    <main style={{ padding: 30, color: "white" }}>
      <h1>Scanner Fidelity</h1>

      {!customer && (
        <div>
          <p>Inquadra il QR Code cliente</p>
          <div
            id="reader"
            style={{
              width: "300px",
              marginTop: "20px",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          />
        </div>
      )}

      {customer && (
        <div style={{ marginTop: 30 }}>
          <h2>Cliente trovato</h2>
          <p>
            Nome: <b>{customer.full_name}</b>
          </p>
          <p>
            Punti attuali: <b>{customer.points}</b>
          </p>

          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => setPointsToAdd(5)}
              style={{ marginRight: 10 }}
            >
              +5 punti
            </button>

            <input
              type="number"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(Number(e.target.value))}
              style={{ width: 80, marginRight: 10 }}
            />

            <button onClick={addPoints}>Aggiungi punti</button>
          </div>
        </div>
      )}
    </main>
  );
}
