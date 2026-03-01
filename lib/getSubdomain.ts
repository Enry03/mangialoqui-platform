export function getSubdomainFromHost(host?: string | null): string | null {
  if (!host) return null;

  // es: morsiburger.mangialoqui.com
  const parts = host.split(".");
  if (parts.length < 3) return null; // niente subdominio

  return parts[0]; // "morsiburger"
}
