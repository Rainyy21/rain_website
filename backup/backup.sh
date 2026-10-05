#!/bin/sh
set -eu
. /etc/backup.env

push() { [ -n "${KUMA_BACKUP_PUSH_URL:-}" ] && wget -qO- "$KUMA_BACKUP_PUSH_URL?status=$1&msg=$2" >/dev/null 2>&1 || true; }

run() {
  f="/tmp/rainhub-$(date +%Y%m%d-%H%M%S).dump"
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h db -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > "$f"
  rsync -e "ssh -i /ssh/id_ed25519 -p ${BACKUP_PORT:-22} -o StrictHostKeyChecking=accept-new" "$f" "$BACKUP_TARGET/"
  rm -f "$f"
}

if run; then push up OK; echo "backup ok"; else push down backup-failed; echo "backup FAILED"; exit 1; fi
