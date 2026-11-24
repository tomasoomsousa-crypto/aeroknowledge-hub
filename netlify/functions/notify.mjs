// Email alert for supervisors: the site calls this after a mechanic submits a tip,
// and this function forwards a short summary to a Make webhook (Make then sends the email).
// The webhook address lives in the MAKE_WEBHOOK_URL environment variable (Netlify dashboard), never in the code.
// With no variable set, the function does nothing and the app keeps working.

const PER_HOUR = 30;
const hits = new Map(); // simple per-IP limit while the instance stays warm

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const text = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export default async (req) => {
  const hook = process.env.MAKE_WEBHOOK_URL;
  if (req.method === "GET") return json(200, { ready: !!hook });
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });
  if (!hook) return json(200, { sent: false, reason: "MAKE_WEBHOOK_URL is not set." });

  // Only accept requests from the site itself.
  const site = new URL(req.url).origin;
  const origin = req.headers.get("origin");
  if (origin && origin !== site) return json(403, { error: "Origin not allowed." });

  const ip = req.headers.get("x-nf-client-connection-ip") || "anon";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  if (recent.length >= PER_HOUR) return json(429, { error: "Too many alerts in a row." });
  hits.set(ip, [...recent, now]);

  let b;
  try { b = await req.json(); } catch { return json(400, { error: "Invalid request." }); }
  if (!/^K-\d{1,6}$/.test(b?.id || "")) return json(400, { error: "Invalid tip." });

  // Only these fields reach Make, cleaned and size-limited.
  const payload = {
    event: "tip_submitted",
    id: b.id,
    title: text(b.title, 200),
    author: text(b.author, 80),
    role: text(b.role, 60),
    aircraft: text(b.aircraft, 60),
    ata: text(b.ata, 4),
    ata_name: text(b.ata_name, 60),
    part: text(b.part, 120),
    alarm: text(b.alarm, 160),
    downtime: Number(b.downtime) || 0,
    attachment: text(b.attachment, 40),
    description: text(b.description, 600),
    submitted_at: text(b.submitted_at, 40),
    link: `${site}/#validate`,
  };

  try {
    const r = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    return json(200, { sent: r.ok });
  } catch {
    return json(502, { sent: false, error: "Make did not answer." });
  }
};
