"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Errore login: " + error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/scan";
  }

  return (
    <main
      style={{
        padding: 50,
        fontFamily: "sans-serif",
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      <h1>Login Staff</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          display: "block",
          marginTop: 20,
          padding: 10,
          width: 300,
        }}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          display: "block",
          marginTop: 20,
          padding: 10,
          width: 300,
        }}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          marginTop: 30,
          padding: 15,
          width: 300,
          cursor: "pointer",
        }}
      >
        {loading ? "Accesso..." : "Accedi"}
      </button>
    </main>
  );
}
