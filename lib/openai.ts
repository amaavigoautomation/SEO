import OpenAI from "openai";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function client(timeout = 120_000) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey, timeout, maxRetries: 1 });
}

// Tries OPENAI_MODEL first, then OPENAI_FALLBACK_MODEL. Never returns empty output silently.
export async function generate(messages: ChatMessage[]): Promise<{ text: string; model: string }> {
  const models = [process.env.OPENAI_MODEL, process.env.OPENAI_FALLBACK_MODEL].filter(
    (m, i, arr): m is string => !!m && arr.indexOf(m) === i,
  );
  if (models.length === 0) throw new Error("OPENAI_MODEL is not set");

  const c = client();
  const errors: string[] = [];
  for (const model of models) {
    try {
      const res = await c.chat.completions.create({ model, messages });
      const text = res.choices[0]?.message?.content?.trim();
      if (!text) throw new Error("empty response");
      return { text, model };
    } catch (e) {
      const status = (e as { status?: number }).status;
      errors.push(`${model}: ${e instanceof Error ? e.message : String(e)}`);
      if (status === 401) break; // bad key: a fallback model will not help
    }
  }
  throw new Error(errors.join(" | "));
}

// ---------- Images ----------

export async function generateImage(prompt: string): Promise<{ data: Buffer; mime: string }> {
  if ((process.env.IMAGE_PROVIDER || "openai").toLowerCase() === "gemini") return generateGeminiImage(prompt);
  return generateOpenAIImage(prompt);
}

async function generateOpenAIImage(prompt: string): Promise<{ data: Buffer; mime: string }> {
  const model = process.env.OPENAI_IMAGE_MODEL;
  if (!model) throw new Error("OPENAI_IMAGE_MODEL is not set. Add an image model id to .env (see npm run check:models).");

  const res = await client(180_000).images.generate({
    model,
    prompt,
    size: (process.env.OPENAI_IMAGE_SIZE || "1536x1024") as "1024x1024",
  });
  const item = res.data?.[0];
  if (item?.b64_json) return { data: Buffer.from(item.b64_json, "base64"), mime: "image/png" };
  if (item?.url) {
    const r = await fetch(item.url);
    if (!r.ok) throw new Error(`could not download generated image (${r.status})`);
    return { data: Buffer.from(await r.arrayBuffer()), mime: r.headers.get("content-type") ?? "image/png" };
  }
  throw new Error("image API returned no image");
}

// Finds the first base64 image block anywhere in a Gemini JSON response
// (works for both the Interactions API and generateContent response shapes).
function findImage(node: unknown): { data: string; mime: string } | null {
  if (!node || typeof node !== "object") return null;
  const o = node as Record<string, unknown>;
  const mime = o.mime_type ?? o.mimeType;
  if (
    typeof o.data === "string" &&
    o.data.length > 100 &&
    ((typeof mime === "string" && mime.startsWith("image/")) || o.type === "image")
  ) {
    return { data: o.data, mime: typeof mime === "string" ? mime : "image/png" };
  }
  for (const v of Object.values(o)) {
    const found = findImage(v);
    if (found) return found;
  }
  return null;
}

async function generateGeminiImage(prompt: string): Promise<{ data: Buffer; mime: string }> {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_IMAGE_MODEL;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  if (!model) throw new Error("GEMINI_IMAGE_MODEL is not set");
  const aspect = process.env.GEMINI_IMAGE_ASPECT || "16:9";

  const base = "https://generativelanguage.googleapis.com/v1beta";
  const headers = { "Content-Type": "application/json", "x-goog-api-key": key };
  const attempts = [
    {
      name: "interactions",
      url: `${base}/interactions`,
      body: { model, input: [{ type: "text", text: prompt }], response_format: { type: "image", aspect_ratio: aspect } },
    },
    {
      name: "generateContent",
      url: `${base}/models/${model}:generateContent`,
      body: {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect } },
      },
    },
  ];

  const errors: string[] = [];
  for (const a of attempts) {
    try {
      const res = await fetch(a.url, {
        method: "POST",
        headers,
        body: JSON.stringify(a.body),
        signal: AbortSignal.timeout(180_000),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        errors.push(`${a.name} ${res.status}: ${json?.error?.message ?? res.statusText}`);
        if (res.status === 401 || res.status === 403 || res.status === 429) break; // key/quota problem: retrying another endpoint won't help
        continue;
      }
      const found = findImage(json);
      if (found) return { data: Buffer.from(found.data, "base64"), mime: found.mime };
      errors.push(`${a.name}: response contained no image`);
    } catch (e) {
      errors.push(`${a.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(errors.join(" | "));
}