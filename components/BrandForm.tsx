"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BrandForm({ brand }: { brand?: { id: string; name: string; context: string } }) {
  const router = useRouter();
  const [name, setName] = useState(brand?.name ?? "");
  const [context, setContext] = useState(brand?.context ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(brand ? `/api/brands/${brand.id}` : "/api/brands", {
      method: brand ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, context }),
    });
    if (res.ok) {
      router.push("/brands");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save");
      setBusy(false);
    }
  }

  // test

  return (
    <form className="card" onSubmit={submit}>
      <label htmlFor="name">Brand name</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      <label htmlFor="ctx">Full brand context</label>
      <p className="muted" style={{ margin: "0 0 6px" }}>
        Everything the AI should know: what the brand is, audience, voice, services, CTA, what it must never say, approved facts.
        This whole text is sent with every prompt for this brand.
      </p>
      <textarea id="ctx" className="tall" value={context} onChange={(e) => setContext(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="primary" disabled={busy}>{busy ? "Saving..." : "Save brand"}</button>
        <span className="muted">{context.length.toLocaleString()} characters</span>
      </div>
    </form>
  );
}
