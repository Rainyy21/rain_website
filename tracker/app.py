"""Cookieless first-party tracker for the rain link hub.

Stores no IPs. "Unique visitors" are a daily-rotating HMAC of IP + user agent,
so a person counts once per day and cannot be followed across days.
"""
import datetime as dt
import hashlib
import hmac
import json
import logging
import os
import re
from urllib.parse import urlparse

from flask import Flask, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from psycopg_pool import ConnectionPool
from werkzeug.middleware.proxy_fix import ProxyFix

log = logging.getLogger("tracker")
app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

DATABASE_URL = os.environ.get("DATABASE_URL", "")
SECRET = os.environ.get("TRACKER_SECRET", "dev-only-change-me")
SITE_HOST = os.environ.get("SITE_HOST", "").lower()
LINKS_FILE = os.environ.get("LINKS_FILE", "/app/links.json")

with open(LINKS_FILE, encoding="utf-8") as f:
    _data = json.load(f)
LINK_IDS = {x["id"] for x in [_data["featured"], *_data["links"]]}

BOT_RE = re.compile(
    r"bot|crawl|spider|slurp|curl|wget|python-requests|httpx|aiohttp|go-http|headless|"
    r"phantom|preview|facebookexternalhit|embedly|monitor|uptime|lighthouse|scrapy",
    re.I,
)

try:  # optional offline country lookup (drop GeoLite2-Country.mmdb into ./geoip)
    import geoip2.database
    _geo = geoip2.database.Reader("/data/GeoLite2-Country.mmdb")
except Exception:
    _geo = None

limiter = Limiter(get_remote_address, app=app, storage_uri="memory://")
_pool = None


def pool():
    global _pool
    if _pool is None:
        _pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=5, open=True)
    return _pool


def insert(sql, params):
    with pool().connection() as conn:
        conn.execute(sql, params)


def visitor_hash(ip, ua):
    day_key = hmac.new(SECRET.encode(), dt.date.today().isoformat().encode(), hashlib.sha256).digest()
    return hmac.new(day_key, f"{ip}|{ua}".encode(), hashlib.sha256).hexdigest()[:32]


def country_of(ip):
    cc = request.headers.get("CF-IPCountry", "")
    if not (len(cc) == 2 and cc.isalpha()) and _geo:
        try:
            cc = _geo.country(ip).country.iso_code or ""
        except Exception:
            cc = ""
    return cc.upper() if len(cc) == 2 and cc.isalpha() else "XX"


def device_of(ua):
    u = ua.lower()
    if "ipad" in u or "tablet" in u:
        return "tablet"
    if "mobi" in u or "android" in u or "iphone" in u:
        return "mobile"
    return "desktop"


def referrer_host(ref):
    try:
        host = (urlparse(ref or "").hostname or "").lower().removeprefix("www.")
    except ValueError:
        return None
    if not host or host == SITE_HOST.removeprefix("www."):
        return None
    return host[:100]


def context():
    """Return request context, or None if the request should be silently ignored."""
    ua = request.headers.get("User-Agent", "")
    if len(ua) < 20 or BOT_RE.search(ua):
        return None
    if request.headers.get("Sec-Fetch-Site", "same-origin") != "same-origin":
        return None
    ip = request.remote_addr or ""
    return {"ua": ua, "visitor": visitor_hash(ip, ua), "country": country_of(ip), "device": device_of(ua)}


def body():
    return request.get_json(silent=True, force=True) or {}


def safe_insert(sql, params):
    try:
        insert(sql, params)
    except Exception:
        log.exception("insert failed")


@app.post("/api/t/visit")
@limiter.limit("20/minute;200/hour")
def visit():
    ctx = context()
    if ctx:
        safe_insert(
            "INSERT INTO visits (visitor, referrer, country, device) VALUES (%s,%s,%s,%s)",
            (ctx["visitor"], referrer_host(str(body().get("ref", ""))), ctx["country"], ctx["device"]),
        )
    return "", 204


@app.post("/api/t/click")
@limiter.limit("40/minute;400/hour")
def click():
    ctx = context()
    link = body().get("link")
    if ctx and isinstance(link, str) and link in LINK_IDS:
        safe_insert(
            "INSERT INTO clicks (link_id, visitor, country, device) VALUES (%s,%s,%s,%s)",
            (link, ctx["visitor"], ctx["country"], ctx["device"]),
        )
    return "", 204


@app.get("/api/health")
@limiter.exempt
def health():
    try:
        with pool().connection() as conn:
            conn.execute("SELECT 1")
        return {"ok": True}
    except Exception:
        return {"ok": False}, 503
