#!/bin/sh
printenv | sed "s/'/'\\\\''/g; s/^\([^=]*\)=\(.*\)$/export \1='\2'/" > /etc/backup.env
echo "0 3 * * * /backup/backup.sh >> /proc/1/fd/1 2>&1" | crontab -
exec crond -f -l 8
