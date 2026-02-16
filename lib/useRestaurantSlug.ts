"use client";

import { useEffect, useState } from "react";

export function useRestaurantSlug() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const host = window.location.host;

    if (host.includes("localhost")) {
      setSlug("morsiburger");
      return;
    }

    const parts = host.split(".");

    if (parts.length >= 3) {
      setSlug(parts[0]);
    } else {
      setSlug(null);
    }
  }, []);

  return slug;
}
