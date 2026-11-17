# CIRE Campaign Report

One website. Each broker gets one private link that shows every blast sent to their Mailchimp list and who opened it. No Mailchimp login, no seat.

## Setup (one time)

1. **Mailchimp API key:** Mailchimp → profile icon → Profile → Extras → API keys → Create A Key. Copy it.
2. **Put this folder on GitHub** (private repo).
3. **vercel.com → Add New → Project →** pick the repo → before clicking Deploy, open **Environment Variables** and add:
   - `MAILCHIMP_API_KEY`: the key from step 1
   - `SHARE_SECRET`: any long random string (mash the keyboard)
   - `ADMIN_PASSWORD`: a password only you know
4. Click **Deploy**.

## Getting broker links

Go to `your-site.vercel.app/admin`, enter your admin password, and hit **Copy link** next to a broker's list. Send it to them once.

That's it. New blasts show up on their page by themselves. A new broker list in Mailchimp shows up on /admin automatically.

## Good to know

- Brokers only see campaigns sent to their own list.
- To cut off every link at once, change `SHARE_SECRET` in Vercel and redeploy.
- The API key only lives in Vercel. Never send it to anyone.
