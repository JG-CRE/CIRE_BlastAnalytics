// Small Mailchimp helper. Server-side only.
const KEY = process.env.MAILCHIMP_API_KEY || "";
const DC = KEY.split("-")[1]; // e.g. "us21"
const AUTH = "Basic " + Buffer.from(`any:${KEY}`).toString("base64");

export const hasKey = () => Boolean(KEY && DC);

export async function mc(path) {
  const r = await fetch(`https://${DC}.api.mailchimp.com/3.0${path}`, { headers: { Authorization: AUTH } });
  if (!r.ok) throw new Error(`Mailchimp ${r.status} on ${path.split("?")[0]}`);
  return r.json();
}
