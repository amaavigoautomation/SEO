"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Login failed");
      setBusy(false);
    }
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h1>Growth OS</h1>
      <label htmlFor="name">Your name</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      <label htmlFor="pw">Team password</label>
      <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="primary" disabled={busy}>{busy ? "Checking..." : "Enter"}</button>
      </div>
      <p className="muted">Your name is saved with every draft you create, approve or revise.</p>
    </form>
  );
}
