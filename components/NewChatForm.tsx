"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewChatForm({ brands, initialBrandId }: { brands: { id: string; name: string }[]; initialBrandId: string }) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(initialBrandId);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/chat/${data.chatId}`);
        return;
      }
      setError(data.error ?? `Request failed (${res.status})`);
    } catch {
      setError("Network error. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form className="card" onSubmit={submit}>
      <label htmlFor="brand">Brand</label>
      <select id="brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} required>
        {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <label htmlFor="msg">What do you want written?</label>
      <textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} required
        placeholder="e.g. Write a blog on how Hajj agencies in India can manage pilgrim documents with software. Add images." />
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="primary" disabled={busy || !brandId}>{busy ? "Writing..." : "Start chat"}</button>
        {busy && <span className="muted">This can take up to a minute. Keep this tab open.</span>}
      </div>
    </form>
  );
}
