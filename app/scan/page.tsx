"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  points: number;
  restaurant_id: string;
};

export default function ScanPage() {
  const html5Ref = useRef<any>(null);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState<number>(5);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  async function startScanner() {
    try {
      setStatus("");
      if (started) return;

      const mod = await import("html5-qrcode");
      const Html5Qrcode = mod.Html5Qrcode;

      const el = document.getElementById("reader");
      if (!el) {
        setStatus("Elemento reader non trovato");
        return;
      }

      if (!html5Ref.current) {
        html5Ref.current = new Html5Qrcode("reader");
      }

      setStarted(true);

      await html5Ref.current.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: { width: 260, height: 260 },
          disableFlip: true,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        async (decodedText: string) => {
          if (busy) return;
          setBusy(true);

          await stopScanner();

          const id = decodedText.trim();
          setScannedId(id);

          const { data, error } = await supabase
            .from("customers")
            .select("id, full_name, email, phone, points, restaurant_id")
            .eq("id", id)
            .single();

          if (error || !data) {
            setStatus("Cliente non trovato");
            setCustomer(null);
            setBusy(false);
            return;
          }

          setCustomer(data as Customer);
          setStatus("");
          setBusy(false);
        }
      );
    } catch (e: any) {
      setStarted(false);
      setStatus(e?.message ? String(e.message) : "Errore avvio fotocamera");
    }
  }

  async function stopScanner() {
    try {
      if (html5Ref.current) {
        const state = html5Ref.current.getState?.();
        if (state === 2) {
          await html5Ref.current.stop();
        }
        await html5Ref.current.clear();
      }
    } catch {}
    setStarted(false);
  }

  async function addPoints() {
    if (!customer) return;

    const add = Number(pointsToAdd);
    if (!Number.isFinite(add) || add <= 0) {
      alert("Inserisci punti validi");
      return;
    }

    const newPoints = (customer.points ?? 0) + add;

    const { error } = await supabase
      .from("customers")
      .update({ points: newPoints })
      .eq("id", customer.id);

    if (error) {
      alert("Errore aggiornamento punti");
      return;
    }

    setCustomer({ ...customer, points: newPoints });
    alert("Punti aggiunti!");
  }

  function reset() {
    setCustomer(null);
    setScannedId(null);
    setStatus("");
    setBusy(false);
    stopScanner();
  }

  return (
    <main style={{ padding: 30, color: "white", fontFamily: "sans-serif" }}>
      <h1>Scanner Fidelity</h1>

      {!customer && (
        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <button onClick={startScanner} disabled={started}>
              Avvia fotocamera
            </button>
            <button onClick={reset} style={{ marginLeft: 10 }}>
              Reset
            </button>
          </div>

          <div
            id="reader"
            style={{
              width: 320,
              maxWidth: "100%",
              borderRadius: 12,
              overflow: "hidden",
              background: "#111",
              padding: 8,
            }}
          />

          {status && (
            <div style={{ marginTop: 12, color: "#ffb4b4" }}>{status}</div>
          )}

          {scannedId && (
            <div style={{ marginTop: 12, opacity: 0.9 }}>
              Letto: <b>{scannedId}</b>
            </div>
          )}
        </div>
      )}

      {customer && (
        <div style={{ marginTop: 24 }}>
          <h2>Cliente trovato</h2>
          <div style={{ marginTop: 10 }}>
            <div>
              Nome: <b>{customer.full_name ?? "-"}</b>
            </div>
            <div>
              Email: <b>{customer.email ?? "-"}</b>
            </div>
            <div>
              Telefono: <b>{customer.phone ?? "-"}</b>
            </div>
            <div style={{ marginTop: 8 }}>
              Punti attuali: <b>{customer.points}</b>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button onClick={() => setPointsToAdd(5)}>+5</button>

            <input
              type="number"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(Number(e.target.value))}
              style={{ width: 90, marginLeft: 10, marginRight: 10 }}
            />

            <button onClick={addPoints}>Aggiungi punti</button>
            <button onClick={reset} style={{ marginLeft: 10 }}>
              Scansiona altro
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
