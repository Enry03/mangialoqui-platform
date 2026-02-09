import { headers } from "next/headers";

export default async function Home() {
  // headers() ora è async
  const headersList = await headers();

  // Leggiamo il dominio richiesto
  const host = headersList.get("host") || "";

  // Esempi host:
  // morsiburger.mangialoqui.it
  // mangialoqui.it
  // www.mangialoqui.it

  let restaurantSlug: string | null = null;

  // Se è un sottodominio tipo xxx.mangialoqui.it
  if (host.endsWith(".mangialoqui.it")) {
    const parts = host.split(".");
    if (parts.length >= 3) {
      restaurantSlug = parts[0]; // morsiburger
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Mangialoqui Platform</h1>

      <p>
        <strong>Host:</strong> {host}
      </p>

      {restaurantSlug ? (
        <p>
          🍔 Ristorante identificato: <strong>{restaurantSlug}</strong>
        </p>
      ) : (
        <p>🌍 Sei sul dominio principale</p>
      )}
    </main>
  );
}
