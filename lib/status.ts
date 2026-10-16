// Approval workflow for a chat. Client-safe (no server imports).
export const STATUSES = ["draft", "in_review", "changes_requested", "approved", "ready_to_publish"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  ready_to_publish: "Ready to publish",
};

// Approved / ready chats are locked until someone reopens them.
export const LOCKED: string[] = ["approved", "ready_to_publish"];

export type ActionKey = "send_for_review" | "approve" | "request_changes" | "ready_to_publish" | "reopen";

export const ACTIONS: Record<ActionKey, { label: string; from: Status[]; to: Status; needsComment?: boolean }> = {
  send_for_review: { label: "Send for review", from: ["draft", "changes_requested"], to: "in_review" },
  approve: { label: "Approve", from: ["in_review"], to: "approved" },
  request_changes: { label: "Request changes", from: ["in_review"], to: "changes_requested", needsComment: true },
  ready_to_publish: { label: "Mark ready to publish", from: ["approved"], to: "ready_to_publish" },
  reopen: { label: "Reopen for editing", from: ["in_review", "approved", "ready_to_publish"], to: "draft" },
};

export function availableActions(status: string): ActionKey[] {
  return (Object.keys(ACTIONS) as ActionKey[]).filter((k) => (ACTIONS[k].from as string[]).includes(status));
}

export function applyAction(
  status: string,
  action: string,
  comment: string,
): { ok: true; to: Status } | { ok: false; error: string } {
  const def = ACTIONS[action as ActionKey];
  if (!def) return { ok: false, error: "Unknown action" };
  if (!(def.from as string[]).includes(status)) {
    return { ok: false, error: `"${def.label}" is not possible while the chat is "${STATUS_LABEL[status] ?? status}"` };
  }
  if (def.needsComment && !comment.trim()) return { ok: false, error: "A comment is required" };
  return { ok: true, to: def.to };
}
