import { headers } from "next/headers";
import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  // Next.js 16: headers() va awaitato
  const headersList = await headers();
  const host = headersList.get("host") || "";

  // Estraiamo slug dal sottodominio
  let slug: string | null = null;

  if (host.endsWith(".mangialoqui.it")) {
    const parts = host.split(".");
    if (parts.length >= 3) {
      slug = parts[0]; // es: test
    }
  }

  // Se esiste slug → carichiamo quel ristorante
  const { data: restaurant } = slug
    ? await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single()
    : { data: null };

  return (
    <main style={{ padding: 40 }}>
      <h1>Mangialoqui Platform</h1>

      <p>
        <strong>Host:</strong> {host}
      </p>

      {restaurant ? (
        <>
          <h2>🍽️ Ristorante attivo:</h2>
          <p>
            Nome: <strong>{restaurant.name}</strong>
          </p>
          <p>
            Slug: <strong>{restaurant.slug}</strong>
          </p>
        </>
      ) : (
        <p>🌍 Dominio principale (nessun ristorante selezionato)</p>
      )}
    </main>
  );
}
