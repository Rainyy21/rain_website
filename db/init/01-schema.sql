CREATE TABLE visits (
  id       bigserial PRIMARY KEY,
  ts       timestamptz NOT NULL DEFAULT now(),
  visitor  text NOT NULL,            -- daily-rotating hash, never an IP
  referrer text,                     -- host only, NULL = direct
  country  char(2) NOT NULL DEFAULT 'XX',
  device   text NOT NULL             -- mobile | tablet | desktop
);
CREATE TABLE clicks (
  id       bigserial PRIMARY KEY,
  ts       timestamptz NOT NULL DEFAULT now(),
  link_id  text NOT NULL,
  visitor  text NOT NULL,
  country  char(2) NOT NULL DEFAULT 'XX',
  device   text NOT NULL
);
CREATE TABLE link_health (
  link_id    text PRIMARY KEY,
  url        text NOT NULL,
  ok         boolean NOT NULL,
  status     int,
  note       text,
  checked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX visits_ts ON visits (ts);
CREATE INDEX clicks_ts ON clicks (ts);
CREATE INDEX clicks_link ON clicks (link_id);

-- Ready-made views for the stats site
CREATE VIEW stats_daily AS
  SELECT ts::date AS day, count(*) AS visits, count(DISTINCT visitor) AS uniques FROM visits GROUP BY 1;
CREATE VIEW stats_link_clicks AS
  SELECT link_id, count(*) AS clicks FROM clicks GROUP BY 1;
CREATE VIEW stats_referrers AS
  SELECT coalesce(referrer, 'direct') AS referrer, count(*) AS visits FROM visits GROUP BY 1;
CREATE VIEW stats_countries AS
  SELECT country, count(*) AS visits FROM visits GROUP BY 1;
CREATE VIEW stats_devices AS
  SELECT device, count(*) AS visits FROM visits GROUP BY 1;
