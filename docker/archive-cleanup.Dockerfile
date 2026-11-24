# Archive-schema retention cleanup — nightly job container (staging).
#
# Runs scripts/archive-cleanup.mjs against the staging Postgres (LIVE_DB_HOST)
# once per ARCHIVE_CLEANUP_INTERVAL seconds, after an initial
# ARCHIVE_CLEANUP_OFFSET delay (default: 2h after stack boot, then nightly);
# compose's `restart: unless-stopped` keeps the loop alive. Logs are
# structured one-per-event JSON lines that promtail ships to Loki — see
# docker-compose.staging-jobs.yml.
#
# Sign-off reminder: without entries in the state file, expired tables are
# HELD, never dropped — a nightly --apply run is still sign-off gated
# (docs/DEPRECATION_POLICY.md).
FROM alpine:3.20

# nodejs: runs scripts/archive-cleanup.mjs (ESM, node:child_process, no deps)
# postgresql16-client: the script shells out to `psql`
# su-exec: drop privileges for the loop after the state dir is prepared
RUN apk add --no-cache nodejs postgresql16-client su-exec

COPY scripts/archive-cleanup.mjs /opt/azeebo/scripts/archive-cleanup.mjs
COPY docker/archive-cleanup-entrypoint.sh /opt/azeebo/entrypoint.sh
RUN chmod +x /opt/azeebo/entrypoint.sh \
    && addgroup -g 70 pgjob \
    && adduser -D -u 70 -G pgjob pgjob

ENV STATE_FILE_DIR=/var/lib/azeebo/archive-cleanup \
    ARCHIVE_CLEANUP_INTERVAL=86400 \
    ARCHIVE_CLEANUP_OFFSET=7200 \
    ARCHIVE_CLEANUP_ARGS=--apply

ENTRYPOINT ["/opt/azeebo/entrypoint.sh"]
