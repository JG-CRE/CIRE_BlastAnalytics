// GET /api/report?l=<listId>&t=<token>&c=<campaignId>
// One campaign's full report. Only works if the campaign was sent to that broker's list.
import { verifyToken } from "../lib/token.js";
import { mc, hasKey } from "../lib/mailchimp.js";

async function allOpeners(id) {
  const out = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const page = await mc(`/reports/${id}/open-details?count=1000&offset=${offset}`);
    out.push(...page.members);
    if (out.length >= page.total_items || page.members.length === 0) break;
  }
  return out;
}

export default async function handler(req, res) {
  const { l, t, c } = req.query;
  if (!l || !t || !c || !verifyToken(l, t)) return res.status(403).json({ error: "This link is invalid or has expired." });
  if (!hasKey()) return res.status(500).json({ error: "Server is missing MAILCHIMP_API_KEY." });

  try {
    const report = await mc(`/reports/${c}`);
    if (report.list_id !== l) return res.status(403).json({ error: "This campaign isn't part of your reports." });

    const [opens, clicks] = await Promise.all([allOpeners(c), mc(`/reports/${c}/click-details?count=100`)]);
    const b = report.bounces || {};
    const delivered = report.emails_sent - (b.hard_bounces || 0) - (b.soft_bounces || 0) - (b.syntax_errors || 0);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.json({
      title: report.campaign_title || report.subject_line,
      subject: report.subject_line,
      audience: report.list_name,
      sentAt: report.send_time,
      recipients: report.emails_sent,
      delivered,
      uniqueOpens: report.opens?.unique_opens || 0,
      openRate: report.opens?.open_rate || 0,
      totalOpens: report.opens?.opens_total || 0,
      uniqueClicks: report.clicks?.unique_subscriber_clicks || 0,
      clickRate: report.clicks?.click_rate || 0,
      openers: opens.map((m) => ({
        name: [m.merge_fields?.FNAME, m.merge_fields?.LNAME].filter(Boolean).join(" "),
        company: m.merge_fields?.COMPANY || m.merge_fields?.MMERGE3 || "",
        email: m.email_address,
        opens: m.opens_count,
        last: m.opens?.length ? m.opens[m.opens.length - 1].timestamp : null,
      })),
      links: (clicks.urls_clicked || [])
        .map((u) => ({ url: u.url, clicks: u.total_clicks, unique: u.unique_clicks }))
        .filter((u) => u.clicks > 0),
    });
  } catch {
    return res.status(502).json({ error: "Couldn't load this report from Mailchimp." });
  }
}
