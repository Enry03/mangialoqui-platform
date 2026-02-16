"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScanPage() {
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [pointsAdded, setPointsAdded] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
      }
    }

    checkAuth();
  }, []);

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
        setScannedId(decodedText);

        await scanner.clear();

        await handleAddPoints(decodedText);
      },
      (error) => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scannedId]);

  async function handleAddPoints(customerId: string) {
    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (error || !customer) {
      alert("Cliente non trovato");
      return;
    }

    const newPoints = customer.points + 10;

    const { error: updateError } = await supabase
      .from("customers")
      .update({ points: newPoints })
      .eq("id", customerId);

    if (updateError) {
      alert("Errore aggiornamento punti");
      return;
    }

    setPointsAdded(true);
    alert("Punti aggiunti! Totale: " + newPoints);
  }

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "sans-serif",
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      <h1>Scanner Fidelity</h1>

      {!scannedId && (
        <>
          <p>Inquadra il QR Code del cliente</p>
          <div id="reader" style={{ width: 400 }} />
        </>
      )}

      {pointsAdded && scannedId && (
        <p style={{ marginTop: 30, fontSize: 20 }}>
          ✅ Cliente aggiornato con successo
        </p>
      )}
    </main>
  );
}
