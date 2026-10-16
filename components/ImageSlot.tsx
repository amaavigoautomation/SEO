"use client";
import { useState } from "react";

export default function ImageSlot({
  messageId, slot, prompt, alt, imageId, onGenerated,
}: {
  messageId: string; slot: number; prompt: string; alt: string; imageId?: string;
  onGenerated: (slot: number, imageId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/messages/${messageId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onGenerated(slot, data.id);
      else setError(data.error ?? `Failed (${res.status})`);
    } catch {
      setError("Network error. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className="imgslot">
      {imageId && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/images/${imageId}`} alt={alt} />
      )}
      <p className="small"><strong>Image {slot + 1}</strong> · alt: {alt}</p>
      {!imageId && <p className="small">Prompt: {prompt}</p>}
      <div style={{ marginTop: 8 }}>
        <button onClick={generate} disabled={busy}>
          {busy ? "Generating image..." : imageId ? "Regenerate" : "Generate image"}
        </button>
        {imageId && <a className="btn" href={`/api/images/${imageId}?download=1`}>Download image-{slot + 1}.png</a>}
      </div>
      {error && <p className="error" style={{ margin: "8px 0 0" }}>{error}</p>}
    </div>
  );
}
