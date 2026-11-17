// Each broker link carries a signature tied to that broker's Mailchimp list.
// Changing the list ID in the URL breaks the signature, so nobody sees another broker's campaigns.
import crypto from "node:crypto";

export function makeToken(listId) {
  const secret = process.env.SHARE_SECRET;
  if (!secret) throw new Error("SHARE_SECRET is not set");
  return crypto.createHmac("sha256", secret).update("list:" + listId).digest("hex").slice(0, 24);
}

export function verifyToken(listId, token) {
  try {
    const a = Buffer.from(makeToken(listId));
    const b = Buffer.from(String(token));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
