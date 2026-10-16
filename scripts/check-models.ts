// Usage: npm run check:models            (tests all chat-capable gpt/o-series models on your key)
//        npm run check:models -- "gpt-6"  (only model ids matching this regex)
// Sends one tiny request per model and prints the rate limits OpenAI reports for YOUR key.
import OpenAI from "openai";

const EXCLUDE = /(audio|realtime|image|tts|transcribe|embedding|search|moderation|instruct|codex|diarize|vision|whisper|dall)/i;

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set. Fill it in .env first.");
    process.exit(1);
  }
  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 60_000 });
  const filter = process.argv[2] ? new RegExp(process.argv[2], "i") : /^(gpt-|o\d)/i;

  const ids: string[] = [];
  const imageIds: string[] = [];
  for await (const m of client.models.list()) {
    if (/(image|dall)/i.test(m.id)) imageIds.push(m.id);
    if (filter.test(m.id) && !EXCLUDE.test(m.id)) ids.push(m.id);
  }
  ids.sort();
  console.log("Image models on your key (use one for OPENAI_IMAGE_MODEL):", imageIds.sort().join(", ") || "none found");
  console.log();
  console.log(`Testing ${ids.length} models...\n`);
  console.log("MODEL".padEnd(36), "RESULT".padEnd(8), "REQ/MIN".padEnd(10), "TOKENS/MIN");

  for (const model of ids) {
    try {
      const { response } = await client.chat.completions
        .create({ model, messages: [{ role: "user", content: "Say OK" }], max_completion_tokens: 16 })
        .withResponse();
      const h = response.headers;
      console.log(
        model.padEnd(36),
        "ok".padEnd(8),
        (h.get("x-ratelimit-limit-requests") ?? "?").padEnd(10),
        h.get("x-ratelimit-limit-tokens") ?? "?",
      );
    } catch (e) {
      const status = (e as { status?: number }).status ?? "";
      const msg = (e instanceof Error ? e.message : String(e)).replace(/\s+/g, " ").slice(0, 70);
      console.log(model.padEnd(36), `fail ${status}`.padEnd(8), msg);
    }
  }
}

main();
