"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { WORKFLOWS, getWorkflow } from "@/lib/workflows";

function defaults(key: string): Record<string, string> {
  const wf = getWorkflow(key);
  return Object.fromEntries((wf?.fields ?? []).map((f) => [f.name, f.defaultValue ?? ""]));
}

export default function NewChatForm({ brands, initialBrandId }: { brands: { id: string; name: string }[]; initialBrandId: string }) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(initialBrandId);
  const [workflowKey, setWorkflowKey] = useState(WORKFLOWS[0].key);
  const [values, setValues] = useState<Record<string, string>>(defaults(WORKFLOWS[0].key));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const workflow = getWorkflow(workflowKey)!;

  function pick(key: string) {
    setWorkflowKey(key);
    setValues(defaults(key));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, workflow: workflowKey, values }),
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

      <label>Content type</label>
      <div className="chips" style={{ marginBottom: 4 }}>
        {WORKFLOWS.map((w) => (
          <button
            type="button"
            key={w.key}
            className={`pill choice${w.key === workflowKey ? " on" : ""}`}
            onClick={() => pick(w.key)}
          >
            {w.label}
          </button>
        ))}
      </div>
      <p className="muted" style={{ margin: "0 0 4px" }}>{workflow.description}</p>

      {workflow.fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`f-${f.name}`}>{f.label}{f.required ? " *" : ""}</label>
          {f.type === "textarea" ? (
            <textarea
              id={`f-${f.name}`}
              value={values[f.name] ?? ""}
              placeholder={f.placeholder}
              required={f.required}
              style={{ minHeight: workflow.key === "free" ? 140 : 80 }}
              onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
            />
          ) : f.type === "select" ? (
            <select id={`f-${f.name}`} value={values[f.name] ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
              {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              id={`f-${f.name}`}
              value={values[f.name] ?? ""}
              placeholder={f.placeholder}
              required={f.required}
              onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
            />
          )}
        </div>
      ))}

      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="primary" disabled={busy || !brandId}>{busy ? "Writing..." : "Start chat"}</button>
        {busy && <span className="muted">This can take up to a minute. Keep this tab open.</span>}
      </div>
    </form>
  );
}
