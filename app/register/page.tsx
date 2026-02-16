"use client";

import { useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";
import { useRestaurantSlug } from "@/lib/useRestaurantSlug";

export default function RegisterPage() {
  const restaurantSlug = useRestaurantSlug();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [createdQr, setCreatedQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const qrValue = useMemo(() => {
    if (!createdQr) return null;
    return createdQr;
  }, [createdQr]);

  async function handleCreateCard() {
    if (!restaurantSlug) {
      alert("Ristorante non trovato");
      return;
    }

    setLoading(true);

    const qrCodeValue = crypto.randomUUID();

    const { data: restaurant, error: restError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", restaurantSlug)
      .single();

    if (restError || !restaurant) {
      alert("Ristorante non esiste nel database");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("customers").insert([
      {
        restaurant_id: restaurant.id,
        full_name: fullName,
        email,
        phone,
        qr_code: qrCodeValue,
        points: 0,
      },
    ]);

    if (error) {
      console.log(error);
      alert("Errore creazione cliente");
      setLoading(false);
      return;
    }

    setCreatedQr(qrCodeValue);
    setLoading(false);
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Registrazione Fidelity Card</h1>

      <p>
        Ristorante (da dominio): <strong>{restaurantSlug}</strong>
      </p>

      <input
        placeholder="Nome completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 10 }}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 10 }}
      />

      <input
        placeholder="Telefono"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ display: "block", marginBottom: 20, padding: 10 }}
      />

      <button
        onClick={handleCreateCard}
        disabled={loading}
        style={{ padding: 15, fontSize: 16 }}
      >
        {loading ? "Creazione..." : "Crea la mia Card"}
      </button>

      {qrValue && (
        <div style={{ marginTop: 30 }}>
          <h2>Il tuo QR Code</h2>
          <QRCodeCanvas value={qrValue} size={200} />
          <p>{qrValue}</p>
        </div>
      )}
    </main>
  );
}
