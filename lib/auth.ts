// Shared-password team login. Cookie = base64url(payload).HMAC-SHA256 signature.
// Uses Web Crypto only, so it works in both middleware (edge) and route handlers (node).
export const COOKIE = "gos_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set (16+ characters)");
  return s;
}

function toB64Url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toB64Url(new Uint8Array(sig));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(name: string): Promise<string> {
  const payload = toB64Url(
    new TextEncoder().encode(JSON.stringify({ n: name, e: Date.now() + MAX_AGE_SECONDS * 1000 })),
  );
  return `${payload}.${await sign(payload)}`;
}

export async function verifySession(token: string): Promise<{ name: string } | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!safeEqual(sig, await sign(payload))) return null;
  try {
    const { n, e } = JSON.parse(new TextDecoder().decode(fromB64Url(payload)));
    if (typeof n !== "string" || typeof e !== "number" || e < Date.now()) return null;
    return { name: n };
  } catch {
    return null;
  }
}
