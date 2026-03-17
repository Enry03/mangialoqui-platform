import Link from "next/link";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase/supabaseClient";

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") || "";

  let slug: string | null = null;

  if (host.endsWith(".mangialoqui.it")) {
    const parts = host.split(".");
    if (parts.length >= 3) {
      slug = parts[0]; // es: morsiburger
    }
  }

  const { data: restaurant } = slug
    ? await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single()
    : { data: null };

  // Se non c'è ristorante (es. dominio principale) puoi mostrare
  // una landing generica o un messaggio di errore.
  if (!restaurant) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Mangialoqui Platform</h1>
        <p>🌍 Dominio principale (nessun ristorante selezionato).</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050814",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          padding: 24,
          borderRadius: 20,
          background: "#0d1222",
          boxShadow: "0 18px 60px rgba(0,0,0,0.6)",
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: "#B9C3E6",
            marginBottom: 6,
          }}
        >
          Sei su
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {restaurant.name}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#8E9AC5",
            marginBottom: 24,
          }}
        >
          Powered by Mangialoqui
        </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Fidelity */}
          <Link
            href="/card"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 48,
              borderRadius: 999,
              background:
                "linear-gradient(135deg, #1E66FF 0%, #4F46E5 50%, #EC4899 100%)",
              color: "white",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Fidelity / Accedi o Registrati
          </Link>

          {/* Menu */}
          <Link
            href="/menu"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 48,
              borderRadius: 999,
              backgroundColor: "#111827",
              border: "1px solid #1F2937",
              color: "white",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Vedi il menù
          </Link>

          {/* Prenotazioni */}
          <Link
            href="/reserve"   // <-- cambiato da /prenota a /reserve
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 48,
              borderRadius: 999,
              backgroundColor: "#0B1120",
              border: "1px solid #1F2937",
              color: "#E5E7EB",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Prenota un tavolo
          </Link>
        </div>
        
        <p
          style={{
            marginTop: 18,
            fontSize: 12,
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          Host: {host}
        </p>
      </div>
    </main>
  );
}
