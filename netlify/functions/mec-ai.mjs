// MEC-AI on Netlify: the site sends the conversation here and this function asks Claude.
// The key lives in the ANTHROPIC_API_KEY environment variable (Netlify dashboard), never in the code.
import Anthropic from "@anthropic-ai/sdk";

const MAX_TURNS = 12;
const MAX_CHARS = 80000;
const MAX_IMAGE_CHARS = 2_000_000; // base64 of a photo already downscaled in the browser
const PER_HOUR = 40;
const hits = new Map(); // simple per-IP limit while the instance stays warm

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  if (req.method === "GET") return json(200, { ready: hasKey });
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });
  if (!hasKey) return json(503, { error: "MEC-AI has no API key configured." });

  // Only accept requests from the site itself.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return json(403, { error: "Origin not allowed." });

  const ip = req.headers.get("x-nf-client-connection-ip") || "anon";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  if (recent.length >= PER_HOUR) return json(429, { error: "Too many questions in a row. Try again shortly." });
  hits.set(ip, [...recent, now]);

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid request." }); }
  const turns = Array.isArray(body?.messages) ? body.messages.slice(-MAX_TURNS) : [];
  const valid = turns.length && turns.every((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content);
  if (!valid || turns[turns.length - 1].role !== "user") return json(400, { error: "Invalid conversation." });
  if (turns.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS) return json(413, { error: "Conversation too long." });

  const messages = turns.map((m) => ({ role: m.role, content: m.content }));
  const img = body.image;
  if (img && /^image\/(jpeg|png|webp|gif)$/.test(img.media_type) && typeof img.data === "string" && img.data.length < MAX_IMAGE_CHARS) {
    const last = messages[messages.length - 1];
    last.content = [
      { type: "image", source: { type: "base64", media_type: img.media_type, data: img.data } },
      { type: "text", text: last.content },
    ];
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages,
    });
    if (response.stop_reason === "refusal") return json(200, { text: "I can't answer that. Try describing the problem another way.\nSOURCES: none" });
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!text) return json(502, { error: "Empty answer." });
    return json(200, { text, truncated: response.stop_reason === "max_tokens" });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json(429, { error: "MEC-AI is busy. Try again shortly." });
    if (err instanceof Anthropic.APIError) return json(502, { error: "MEC-AI did not answer." });
    return json(500, { error: "Unexpected error." });
  }
};
