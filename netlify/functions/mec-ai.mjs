// MEC-AI no Netlify: o site envia a conversa para aqui e esta função pergunta ao Claude.
// A chave fica na variável de ambiente ANTHROPIC_API_KEY (painel do Netlify), nunca no código.
import Anthropic from "@anthropic-ai/sdk";

const MAX_TURNS = 12;
const MAX_CHARS = 80000;
const MAX_IMAGE_CHARS = 2_000_000; // base64 de uma foto já reduzida no browser
const PER_HOUR = 40;
const hits = new Map(); // limite simples por IP enquanto a instância estiver viva

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  if (req.method === "GET") return json(200, { ready: hasKey });
  if (req.method !== "POST") return json(405, { error: "Método não suportado." });
  if (!hasKey) return json(503, { error: "MEC-AI sem chave configurada." });

  // Só aceita pedidos vindos do próprio site.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return json(403, { error: "Origem não autorizada." });

  const ip = req.headers.get("x-nf-client-connection-ip") || "anon";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  if (recent.length >= PER_HOUR) return json(429, { error: "Muitas perguntas seguidas. Tenta daqui a pouco." });
  hits.set(ip, [...recent, now]);

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Pedido inválido." }); }
  const turns = Array.isArray(body?.messages) ? body.messages.slice(-MAX_TURNS) : [];
  const valid = turns.length && turns.every((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content);
  if (!valid || turns[turns.length - 1].role !== "user") return json(400, { error: "Conversa inválida." });
  if (turns.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS) return json(413, { error: "Conversa demasiado longa." });

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
    if (response.stop_reason === "refusal") return json(200, { text: "Não consigo responder a isto. Tenta descrever o problema de outra forma.\nFONTES: nenhuma" });
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!text) return json(502, { error: "Resposta vazia." });
    return json(200, { text, truncated: response.stop_reason === "max_tokens" });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json(429, { error: "O MEC-AI está ocupado. Tenta daqui a pouco." });
    if (err instanceof Anthropic.APIError) return json(502, { error: "O MEC-AI não respondeu." });
    return json(500, { error: "Erro inesperado." });
  }
};
