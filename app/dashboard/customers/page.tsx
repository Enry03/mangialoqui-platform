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
    } else if (sortBy === "created_at") {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    } else if (sortBy === "full_name") {
      list.sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "")
      );
    }

    return list;
  }, [customers, search, sortBy]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Caricamento clienti...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Clienti</h1>
          <p style={styles.subtitle}>
            {restaurantName
              ? `Ristorante · ${restaurantName}`
              : "Ristorante non impostato"}
          </p>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Totale clienti</span>
            <span style={styles.statValue}>{filtered.length}</span>
          </div>
          <button
            style={styles.primaryButton}
            onClick={() => router.push("/register")}
          >
            + Nuova fidelity card
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <section style={styles.filtersRow}>
        <div style={{ flex: 1 }}>
          <label style={styles.fieldLabel}>Cerca</label>
          <div style={styles.inputWrapper}>
            <input
              placeholder="Nome o email cliente"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={{ width: 220 }}>
          <label style={styles.fieldLabel}>Ordina per</label>
          <div style={styles.inputWrapper}>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "points" | "created_at" | "full_name"
                )
              }
              style={styles.select}
            >
              <option value="points">Punti</option>
              <option value="created_at">Data iscrizione</option>
              <option value="full_name">Nome</option>
            </select>
          </div>
        </div>
      </section>

      {/* TABLE */}
      <section style={styles.tableCard}>
        <div style={styles.tableHeaderRow}>
          <div style={{ flex: 3 }}>Cliente</div>
          <div style={{ flex: 2 }}>Email</div>
          <div style={{ flex: 1, textAlign: "right" }}>Punti</div>
          <div style={{ flex: 1, textAlign: "right" }}>Iscritto</div>
          <div style={{ width: 120 }} />
        </div>

        <div>
          {filtered.length === 0 && (
            <div style={styles.emptyRow}>
              Nessun cliente trovato con questi filtri.
            </div>
          )}

          {filtered.map((c) => (
            <div key={c.id} style={styles.tableRow}>
              <div style={{ flex: 3 }}>
                <div style={styles.customerName}>{c.full_name || "Senza nome"}</div>
              </div>

              <div style={{ flex: 2 }}>
                <div style={styles.customerEmail}>{c.email || "-"}</div>
              </div>

              <div style={{ flex: 1, textAlign: "right" }}>
                <span style={styles.pointsBadge}>{c.points} pt</span>
              </div>

              <div style={{ flex: 1, textAlign: "right", fontSize: 12, opacity: 0.7 }}>
                {new Date(c.created_at).toLocaleDateString("it-IT")}
              </div>

              <div style={{ width: 120, textAlign: "right" }}>
                <button
                  style={styles.secondaryButton}
                  onClick={() =>
                    router.push(`/dashboard/customers/${c.id}`)
                  }
                >
                  Dettaglio
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #111827 0, #020617 55%)",
    padding: "32px 40px",
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loading: {
    paddingTop: 80,
    textAlign: "center",
    color: "#9ca3af",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 0,
    fontSize: 14,
    color: "#9ca3af",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  statCard: {
    padding: "10px 16px",
    borderRadius: 999,
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(148,163,184,0.3)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.08,
    color: "#9ca3af",
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
  },
  primaryButton: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background:
      "linear-gradient(to right, #2563eb, #7c3aed)",
    color: "#f9fafb",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 10px 30px rgba(37,99,235,0.35)",
  },
  filtersRow: {
    display: "flex",
    gap: 16,
    marginBottom: 20,
    alignItems: "flex-end",
  },
  fieldLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.12,
    color: "#9ca3af",
    marginBottom: 6,
    display: "block",
  },
  inputWrapper: {
    borderRadius: 999,
    background: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(55,65,81,0.9)",
    paddingInline: 14,
    display: "flex",
    alignItems: "center",
    height: 40,
  },
  input: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#e5e7eb",
    fontSize: 14,
  },
  select: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#e5e7eb",
    fontSize: 14,
  },
  tableCard: {
    marginTop: 10,
    background: "rgba(15,23,42,0.98)",
    borderRadius: 18,
    border: "1px solid rgba(55,65,81,0.9)",
    boxShadow: "0 24px 60px rgba(15,23,42,0.85)",
    overflow: "hidden",
  },
  tableHeaderRow: {
    display: "flex",
    padding: "14px 18px",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.12,
    color: "#9ca3af",
    borderBottom: "1px solid rgba(31,41,55,0.9)",
    background:
      "linear-gradient(to right, rgba(15,23,42,0.98), rgba(30,64,175,0.25))",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid rgba(31,41,55,0.9)",
    transition: "background 0.15s ease, transform 0.1s ease",
  },
  emptyRow: {
    padding: 18,
    fontSize: 14,
    color: "#9ca3af",
  },
  customerName: {
    fontSize: 15,
    fontWeight: 600,
  },
  customerEmail: {
    fontSize: 13,
    color: "#9ca3af",
  },
  pointsBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(22,163,74,0.14)",
    color: "#4ade80",
    fontWeight: 600,
    fontSize: 13,
  },
  secondaryButton: {
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.5)",
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 13,
  },
};
