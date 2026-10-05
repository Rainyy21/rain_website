"""Checks every link in links.json and records the result in link_health.

Sites like X and Discord often block bots, so 401/403/429/999 count as "alive but
blocking checks". Anything else outside 2xx/3xx is flagged dead. If KUMA_PUSH_URL is
set, the result is pushed to an Uptime Kuma push monitor.
"""
import json
import os
import urllib.error
import urllib.parse
import urllib.request

import psycopg

UA = "Mozilla/5.0 (compatible; rain-hub-linkcheck)"
SOFT = {401, 403, 429, 999}


def fetch(url, method):
    req = urllib.request.Request(url, method=method, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, None
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return None, str(e)[:200]


def check(url):
    status, err = fetch(url, "HEAD")
    if status is None or status >= 400:
        status, err = fetch(url, "GET")
    if status is None:
        return False, None, err
    if 200 <= status < 400:
        return True, status, None
    if status in SOFT:
        return True, status, "site blocks automated checks"
    return False, status, "unexpected status"


def main():
    with open(os.environ.get("LINKS_FILE", "/app/links.json"), encoding="utf-8") as f:
        data = json.load(f)
    items = [data["featured"], *data["links"]]
    dead = []
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        for it in items:
            url = it["href"]
            if not url.startswith("http"):
                continue
            ok, status, note = check(url)
            if not ok:
                dead.append(it["id"])
            conn.execute(
                """INSERT INTO link_health (link_id, url, ok, status, note, checked_at)
                   VALUES (%s,%s,%s,%s,%s, now())
                   ON CONFLICT (link_id) DO UPDATE SET url=EXCLUDED.url, ok=EXCLUDED.ok,
                   status=EXCLUDED.status, note=EXCLUDED.note, checked_at=now()""",
                (it["id"], url, ok, status, note),
            )
            print(("OK  " if ok else "DEAD"), it["id"], status, note or "")
    push = os.environ.get("KUMA_PUSH_URL")
    if push:
        msg = "dead links: " + ", ".join(dead) if dead else "all links ok"
        q = urllib.parse.urlencode({"status": "down" if dead else "up", "msg": msg})
        try:
            urllib.request.urlopen(f"{push}?{q}", timeout=10)
        except Exception as e:
            print("kuma push failed:", e)


if __name__ == "__main__":
    main()
