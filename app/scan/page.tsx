"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/lib/supabaseClient";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [scannedId, setScannedId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [pointsToAdd, setPointsToAdd] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scannedId) return;

    const codeReader = new BrowserMultiFormatReader();
    let controls: any;

    async function startScanner() {
      if (!videoRef.current) return;

      try {
        controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) {
              const text = result.getText();
              setScannedId(text);
              loadCustomer(text);

              if (controls) controls.stop();
            }
          }
        );
      } catch (err) {
        alert("Errore fotocamera");
      }
    }

    startScanner();

    return () => {
      if (controls) controls.stop();
    };
  }, [scannedId]);

  async function loadCustomer(id: string) {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Cliente non trovato");
      return;
    }

    setCustomer(data);
  }

  async function addPoints(amount: number) {
    if (!customer) return;

    setLoading(true);

    const newPoints = customer.points + amount;

    const { error } = await supabase
      .from("customers")
      .update({ points: newPoints })
      .eq("id", customer.id);

    if (error) {
      alert("Errore aggiornamento punti");
      setLoading(false);
      return;
    }

    setCustomer({ ...customer, points: newPoints });
    alert(`Aggiunti ${amount} punti`);

    setLoading(false);
  }

  return (
    <main style={{ padding: 30, fontFamily: "sans-serif", color: "white" }}>
      <h1>Scanner Fidelity</h1>

      {!customer && (
        <div style={{ marginTop: 20 }}>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 12,
            }}
          />
          <p style={{ marginTop: 10 }}>Inquadra il QR Code del cliente</p>
        </div>
      )}

      {customer && (
        <div style={{ marginTop: 30 }}>
          <h2>Cliente trovato</h2>

          <p>
            <strong>Nome:</strong> {customer.full_name}
          </p>

          <p>
            <strong>Punti:</strong> {customer.points}
          </p>

          <button
            onClick={() => addPoints(5)}
            disabled={loading}
            style={{ marginTop: 20, padding: 12 }}
          >
            +5 punti
          </button>

          <div style={{ marginTop: 20 }}>
            <input
              type="number"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(Number(e.target.value))}
              style={{ padding: 8, width: 80 }}
            />

            <button
              onClick={() => addPoints(pointsToAdd)}
              disabled={loading}
              style={{ marginLeft: 10, padding: 12 }}
            >
              Aggiungi custom
            </button>
          </div>

          <button
            onClick={() => {
              setCustomer(null);
              setScannedId(null);
            }}
            style={{ marginTop: 30, padding: 12 }}
          >
            Scansiona un altro
          </button>
        </div>
      )}
    </main>
  );
}
