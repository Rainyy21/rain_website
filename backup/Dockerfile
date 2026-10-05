FROM postgres:16-alpine
RUN apk add --no-cache rsync openssh-client
COPY backup/backup.sh backup/entrypoint.sh /backup/
ENTRYPOINT ["/backup/entrypoint.sh"]
