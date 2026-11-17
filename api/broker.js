// GET /api/broker?l=<listId>&t=<token>
// Every sent campaign for one broker's list, newest first.
import { verifyToken } from "../lib/token.js";
import { mc, hasKey } from "../lib/mailchimp.js";

export default async function handler(req, res) {
  const { l, t } = req.query;
  if (!l || !t || !verifyToken(l, t)) return res.status(403).json({ error: "This link is invalid or has expired." });
  if (!hasKey()) return res.status(500).json({ error: "Server is missing MAILCHIMP_API_KEY." });

  try {
    const [list, camps] = await Promise.all([
      mc(`/lists/${l}?fields=name,stats.member_count`),
      mc(`/campaigns?list_id=${l}&status=sent&sort_field=send_time&sort_dir=DESC&count=200` +
         `&fields=campaigns.id,campaigns.send_time,campaigns.emails_sent,campaigns.settings.title,campaigns.settings.subject_line,campaigns.report_summary`),
    ]);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.json({
      audience: list.name,
      contacts: list.stats?.member_count || 0,
      campaigns: (camps.campaigns || []).map((c) => ({
        id: c.id,
        title: c.settings?.title || c.settings?.subject_line || "Untitled",
        subject: c.settings?.subject_line || "",
        sentAt: c.send_time,
        recipients: c.emails_sent || 0,
        uniqueOpens: c.report_summary?.unique_opens || 0,
        openRate: c.report_summary?.open_rate || 0,
        uniqueClicks: c.report_summary?.subscriber_clicks || 0,
        clickRate: c.report_summary?.click_rate || 0,
      })),
    });
  } catch {
    return res.status(502).json({ error: "Couldn't load campaigns from Mailchimp." });
  }
}
