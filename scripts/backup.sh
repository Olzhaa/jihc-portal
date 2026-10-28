#!/bin/sh
# Дерекқор мен жүктелген файлдардың күнделікті резервтік көшірмесі (docker-compose.yml → backup).
# Әр түнде BACKUP_AT уақытында (әдепкі 02:00, Алматы):
#   /backups/db/jihc-YYYY-MM-DD_HHMM.dump      — pg_dump (custom формат, pg_restore-мен қайтарылады)
#   /backups/uploads/uploads-YYYY-MM-DD.tar.gz — справкалар файлдары
# KEEP_DAYS күннен (әдепкі 30) ескілері өшіріледі.
set -eu
: "${BACKUP_AT:=02:00}" "${KEEP_DAYS:=30}"
mkdir -p /backups/db /backups/uploads

run() {
  stamp=$(date +%F_%H%M)
  pg_dump -Fc -f "/backups/db/jihc-$stamp.dump.part" && mv "/backups/db/jihc-$stamp.dump.part" "/backups/db/jihc-$stamp.dump"
  if [ -d /uploads ]; then tar -czf "/backups/uploads/uploads-$(date +%F).tar.gz" -C /uploads .; fi
  find /backups -type f -mtime "+$KEEP_DAYS" -delete
  echo "$(date '+%F %T') backup ok: jihc-$stamp.dump ($(du -h "/backups/db/jihc-$stamp.dump" | cut -f1))"
}

# Іске қосылғанда бір рет (көшірменің жұмыс істейтінін бірден көру үшін), сосын күн сайын.
run
while true; do
  next=$(date -d "tomorrow $BACKUP_AT" +%s)
  today=$(date -d "today $BACKUP_AT" +%s)
  now=$(date +%s)
  [ "$today" -gt "$now" ] && next=$today
  sleep $((next - now))
  run || echo "$(date '+%F %T') backup FAILED" >&2
done
