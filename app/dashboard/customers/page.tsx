"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  full_name: string;
  email: string;
  points: number;
  created_at: string;
};

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "created_at" | "full_name">("points");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.restaurant_id) {
        router.replace("/login");
        return;
      }

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", profile.restaurant_id)
        .single();

      setRestaurantName(restaurant?.name || "");

      const { data: customersData } = await supabase
        .from("customers")
        .select("id, full_name, email, points, created_at")
        .eq("restaurant_id", profile.restaurant_id);

      setCustomers(customersData || []);
      setLoading(false);
    }

    load();
  }, [router]);

  const filtered = useMemo(() => {
    let list = [...customers];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "points") {
      list.sort((a, b) => b.points - a.points);
    }

    if (sortBy === "created_at") {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    }

    if (sortBy === "full_name") {
      list.sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "")
      );
    }

    return list;
  }, [customers, search, sortBy]);

  if (loading) {
    return <div style={{ padding: 40, color: "#fff" }}>Caricamento clienti...</div>;
  }

  return (
    <div style={{ padding: 40, color: "#fff" }}>
      <h1 style={{ marginBottom: 20 }}>
        Clienti · {restaurantName}
      </h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Cerca per nome o email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 10, width: 300, marginRight: 20 }}
        />

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "points" | "created_at" | "full_name")
          }
          style={{ padding: 10 }}
        >
          <option value="points">Ordina per punti</option>
          <option value="created_at">Ordina per data</option>
          <option value="full_name">Ordina per nome</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        Totale clienti: {filtered.length}
      </div>

      <div style={{ borderTop: "1px solid #333", marginTop: 20 }}>
        {filtered.map((c) => (
          <div
            key={c.id}
            style={{
              padding: 15,
              borderBottom: "1px solid #222",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{c.full_name}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>{c.email}</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>
                Iscritto: {new Date(c.created_at).toLocaleDateString("it-IT")}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {c.points} pt
              </div>
              <button
                onClick={() =>
                  router.push(`/dashboard/customers/${c.id}`)
                }
                style={{
                  marginTop: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                Dettaglio
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}