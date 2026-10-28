#!/bin/sh
# Резервтік көшірмелердің екінші данасы: колледждегі БАСҚА компьютерде күн сайын іске қосылады
# және порталдың серверінен backups/ қалтасын SSH арқылы тартып алады (docs/DATABASE.md, 5-бөлім).
#
#   SERVER=jihc@192.168.1.10 SERVER_DIR=/opt/jihc-portal/backups DEST=/srv/jihc-backups sh offsite-pull.sh
#
# Сервер өшсе немесе дискісі бұзылса, көшірмелер осы компьютерде қалады. Мұнда KEEP_DAYS (әдепкі 90)
# күн сақталады: сервердегіден ұзағырақ, сондықтан ескі қатені кейін байқасақ та қайтаруға болады.
set -eu
: "${SERVER:?SERVER=user@host керек}" "${SERVER_DIR:=/opt/jihc-portal/backups}" "${DEST:=$HOME/jihc-backups}" "${KEEP_DAYS:=90}"
mkdir -p "$DEST"

# --delete жоқ: серверде өшкен ескі көшірмелер мұнда KEEP_DAYS бойы қалады.
rsync -a --partial "$SERVER:$SERVER_DIR/" "$DEST/"
find "$DEST" -type f -mtime "+$KEEP_DAYS" -delete

# Сервердегі соңғы сәтті көшірме 2 күннен ескі болса, дабыл (cron оны поштаға жібереді).
last=$(cat "$DEST/LAST_OK" 2>/dev/null || echo "")
if [ -z "$last" ] || [ $(( $(date +%s) - $(date -d "$last" +%s 2>/dev/null || echo 0) )) -gt 172800 ]; then
  echo "НАЗАР: сервердегі соңғы сәтті көшірме: ${last:-жоқ}. Серверде 'docker compose logs backup' тексеріңіз." >&2
  exit 1
fi

newest=$(ls -t "$DEST"/db/*.dump 2>/dev/null | head -1)
if command -v pg_restore > /dev/null && [ -n "$newest" ]; then pg_restore --list "$newest" > /dev/null; fi
echo "$(date '+%F %T') offsite ok: ${newest:-?} (сервер: $last)"
