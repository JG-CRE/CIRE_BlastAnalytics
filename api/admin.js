// POST /api/admin  { password }  ->  every broker list with its permanent link.
// Only you use this, from /admin.
import crypto from "node:crypto";
import { makeToken } from "../lib/token.js";
import { mc, hasKey } from "../lib/mailchimp.js";

const same = (a, b) => {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const pw = process.env.ADMIN_PASSWORD;
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (!pw || !same(body.password || "", pw)) {
    await new Promise((r) => setTimeout(r, 800)); // slows down guessing
    return res.status(401).json({ error: "Wrong password." });
  }
  if (!hasKey()) return res.status(500).json({ error: "MAILCHIMP_API_KEY isn't set in Vercel." });

  try {
    const site = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
    const { lists } = await mc(`/lists?count=100&fields=lists.id,lists.name,lists.stats.member_count,lists.stats.campaign_count`);
    res.setHeader("Cache-Control", "no-store");
    return res.json({
      lists: lists
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((l) => ({
          name: l.name,
          contacts: l.stats?.member_count || 0,
          campaigns: l.stats?.campaign_count || 0,
          link: `${site}/?l=${l.id}&t=${makeToken(l.id)}`,
        })),
    });
  } catch {
    return res.status(502).json({ error: "Couldn't reach Mailchimp. Check the API key." });
  }
}
