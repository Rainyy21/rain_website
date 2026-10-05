# Rain link hub

React (Vite) front end, a cookieless first-party tracker (Flask + Postgres), and a Compose stack with HTTPS, nightly backups and uptime monitoring.

## Edit your links
Everything lives in `links.json` (handle, taglines, featured link, social links). The front end, the tracker's allowlist and the link checker all read this one file.
Also set the real URL in `index.html` and add a 1200x630 `public/og.png` for link previews.

## Develop
    npm install
    npm run dev        # tracking is off in dev

## Deploy
1. `cp .env.example .env` and fill it in (letters and digits only in passwords).
2. Point your domain's DNS at the server. Caddy gets the HTTPS certificate automatically.
3. Put the SSH key for the backup machine at `backup-ssh/id_ed25519`.
4. `docker compose up -d --build`

Note: the DB roles are created only on the first start of an empty volume. If you change the passwords later, change them in Postgres too.

## What gets tracked
Visits, clicks per link, referrer host, country, device. No cookies, no stored IPs. A visitor is a hash of IP + user agent with a key that changes daily, so uniques are per day. Tracking is skipped when the browser sends Do Not Track.
Country comes from the `CF-IPCountry` header if you sit behind Cloudflare, otherwise from a MaxMind `GeoLite2-Country.mmdb` in `./geoip`, otherwise it shows `XX`.
Bots (user agent filter), cross-site requests and unknown link ids are dropped silently. Limits per IP: visits 20/min, clicks 40/min.

## Reading the data from another project (WireGuard)
Set `PG_BIND` to this server's WireGuard address (for example `10.8.0.1:5432`). Connect as `stats_ro` (read-only, even if you try to write) and query the views:
`stats_daily`, `stats_link_clicks`, `stats_referrers`, `stats_countries`, `stats_devices`, plus the raw `visits`, `clicks`, `link_health` tables.

## Backups and monitoring
- `backup` runs `pg_dump` at 03:00 and copies it to `BACKUP_TARGET` with rsync. Prune old dumps on that machine (for example a cron `find ... -mtime +30 -delete`). Restore with `pg_restore -d rainhub file.dump`.
- Uptime Kuma is on `KUMA_BIND` (default localhost:3001). Add monitors for `https://your-domain/` and `https://your-domain/api/health`. Optionally add two push monitors and paste their URLs in `.env`: one reports backup success or failure, one reports dead links.
- `linkcheck` checks every link daily and writes the result to `link_health`. X, Discord and similar sites often block bots, so a 403 counts as alive.

## Later
Kubernetes manifests, once the Compose setup is running the way you like.
