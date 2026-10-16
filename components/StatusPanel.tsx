"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACTIONS, STATUS_LABEL, availableActions, type ActionKey } from "@/lib/status";
import { fmt } from "@/lib/format";

export type EventRow = {
  id: string;
  action: string;
  actor: string;
  fromStatus: string | null;
  toStatus: string | null;
  comment: string | null;
  createdAt: string;
};

export default function StatusPanel({
  chatId, status, events, hasDraft, onApplyFeedback,
}: {
  chatId: string; status: string; events: EventRow[]; hasDraft: boolean; onApplyFeedback: (text: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [askingChanges, setAskingChanges] = useState(false);
  const [comment, setComment] = useState("");

  const actions = availableActions(status).filter((a) => a !== "send_for_review" || hasDraft);
  const feedback = status === "changes_requested" ? events.find((e) => e.action === "request_changes") : undefined;

  async function run(action: ActionKey, text = "") {
    setBusy(action);
    setError("");
    try {
      const res = await fetch(`/api/chats/${chatId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: text }),
      });
      if (res.ok) {
        setAskingChanges(false);
        setComment("");
        router.refresh();
      } else {
        setError((await res.json().catch(() => ({}))).error ?? `Failed (${res.status})`);
      }
    } catch {
      setError("Network error. Try again.");
    }
    setBusy("");
  }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="row" style={{ marginTop: 0 }}>
        <span className={`pill ${status}`}>{STATUS_LABEL[status] ?? status}</span>
        {actions.map((a) =>
          a === "request_changes" ? (
            <button key={a} disabled={!!busy} onClick={() => setAskingChanges((v) => !v)}>{ACTIONS[a].label}</button>
          ) : (
            <button
              key={a}
              className={a === "approve" || a === "send_for_review" ? "primary" : ""}
              disabled={!!busy}
              onClick={() => run(a)}
            >
              {busy === a ? "Please wait..." : ACTIONS[a].label}
            </button>
          ),
        )}
      </div>

      {askingChanges && (
        <>
          <label htmlFor="chg">What needs to change?</label>
          <textarea id="chg" value={comment} onChange={(e) => setComment(e.target.value)} style={{ minHeight: 80 }} />
          <div className="row">
            <button className="primary" disabled={!!busy || !comment.trim()} onClick={() => run("request_changes", comment)}>
              Send feedback
            </button>
          </div>
        </>
      )}

      {feedback?.comment && (
        <p style={{ marginBottom: 0 }}>
          <strong>Changes requested by {feedback.actor}:</strong> {feedback.comment}{" "}
          <button style={{ padding: "3px 9px", fontSize: 13 }} onClick={() => onApplyFeedback(feedback.comment ?? "")}>
            Use as instruction
          </button>
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <details style={{ borderTop: "none", paddingBottom: 0 }}>
        <summary>History ({events.length})</summary>
        <ul className="timeline">
          {events.map((e) => (
            <li key={e.id}>
              <strong>{e.action.replace(/_/g, " ")}</strong> · {e.actor} · {fmt(e.createdAt)}
              {e.toStatus ? <span className="muted"> → {STATUS_LABEL[e.toStatus] ?? e.toStatus}</span> : null}
              {e.comment ? <span className="muted"> — {e.comment}</span> : null}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
