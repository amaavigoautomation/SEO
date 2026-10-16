"use client";
import { useEffect, useRef, useState } from "react";
import MessageBody from "./MessageBody";
import { toHtmlBody, toHtmlDocument, toMarkdown } from "@/lib/export";

export type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  model: string | null;
  createdBy: string | null;
  images: { slot: number; id: string }[];
};

export default function ChatView({ chatId, initial }: { chatId: string; initial: Msg[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, busy]);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsgs((m) => [...m, data.user, data.assistant]);
        setInput("");
      } else {
        setError(data.error ?? `Request failed (${res.status})`);
      }
    } catch {
      setError("Network error. Your message is still in the box; try again.");
    }
    setBusy(false);
  }

  function onGenerated(messageId: string, slot: number, imageId: string) {
    setMsgs((all) =>
      all.map((m) =>
        m.id === messageId ? { ...m, images: [...m.images.filter((i) => i.slot !== slot), { slot, id: imageId }] } : m,
      ),
    );
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNote(`${label} copied`);
    } catch {
      setNote("Could not copy. Select the text manually.");
    }
    setTimeout(() => setNote(""), 1800);
  }

  function download(content: string) {
    const blob = new Blob([toHtmlDocument(content)], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "article.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <div className="chat">
        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} style={{ alignSelf: "flex-end", maxWidth: "80%" }}>
              <div className="msg user">{m.content}</div>
              {m.createdBy && <div className="meta" style={{ textAlign: "right", fontSize: 12, color: "var(--muted)" }}>{m.createdBy}</div>}
            </div>
          ) : (
            <div key={m.id} className="msg assistant">
              <MessageBody
                messageId={m.id}
                content={m.content}
                images={m.images}
                onGenerated={(slot, id) => onGenerated(m.id, slot, id)}
              />
              <div className="toolbar">
                <button onClick={() => copy(m.content.replace(/\[\[IMAGE:[\s\S]*?\]\]/g, "").trim(), "Text")}>Copy text</button>
                <button onClick={() => copy(toMarkdown(m.content), "Markdown")}>Copy Markdown</button>
                <button onClick={() => copy(toHtmlBody(m.content), "HTML")}>Copy HTML</button>
                <button onClick={() => download(m.content)}>Download .html</button>
                {m.model && <span className="muted" style={{ alignSelf: "center" }}>{m.model}</span>}
              </div>
            </div>
          ),
        )}
        {busy && <div className="muted">Writing... this can take up to a minute. Keep this tab open.</div>}
        <div ref={endRef} />
      </div>

      <div className="composer">
        {note && <p className="muted" style={{ margin: "0 0 6px" }}>{note}</p>}
        {error && <p className="error" style={{ margin: "0 0 6px" }}>{error}</p>}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
          }}
          placeholder="Ask for changes, or a new topic. e.g. make the intro shorter / now write a blog on Umrah package management software"
        />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="primary" onClick={send} disabled={busy || !input.trim()}>{busy ? "Writing..." : "Send"}</button>
          <span className="muted">Ctrl+Enter to send</span>
        </div>
      </div>
    </>
  );
}
