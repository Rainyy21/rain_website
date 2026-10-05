#!/bin/sh
# Runs once, on first start of an empty database volume.
set -e
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<SQL
CREATE ROLE tracker_rw LOGIN PASSWORD '$TRACKER_PASSWORD';
GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO tracker_rw;
GRANT USAGE ON SCHEMA public TO tracker_rw;
GRANT INSERT ON visits, clicks TO tracker_rw;
GRANT USAGE ON SEQUENCE visits_id_seq, clicks_id_seq TO tracker_rw;
GRANT SELECT, INSERT, UPDATE ON link_health TO tracker_rw;

CREATE ROLE stats_ro LOGIN PASSWORD '$STATS_RO_PASSWORD';
ALTER ROLE stats_ro SET default_transaction_read_only = on;
GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO stats_ro;
GRANT USAGE ON SCHEMA public TO stats_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO stats_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO stats_ro;
SQL
