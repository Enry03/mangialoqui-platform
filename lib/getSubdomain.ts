// lib/getSubdomain.ts
export function getSubdomainFromHost(host?: string | null) {
  if (!host) return null;
  const parts = host.split(".");
  if (parts.length < 3) return null; // es. mangialoqui.it → nessun subdomain
  return parts[0]; // es. morsiburger.mangialoqui.it → "morsiburger"
}
