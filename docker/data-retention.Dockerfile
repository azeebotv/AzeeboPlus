# Data-retention policy enforcement — nightly job container (staging).
#
# Runs scripts/data-retention.mjs against the per-service Postgres databases
# (azeebo_analytics, azeebo_messaging; azeebo_admin for the job ledger) once
# per DATA_RETENTION_INTERVAL seconds after an initial DATA_RETENTION_OFFSET
# delay; compose's `restart: unless-stopped` keeps the loop alive. Logs are
# structured one-per-event JSON lines that promtail ships to Loki — see
# docker-compose.staging-jobs.yml.
#
# The script is dependency-free (psql via postgresql16-client); retention
# windows default to the shared-types DEFAULT_RETENTION_POLICIES and DB
# credentials MUST come from the environment (no baked-in fallbacks).
# Defaults to dry-run — compose passes --apply.
FROM alpine:3.20

# nodejs: runs scripts/data-retention.mjs (ESM, no npm deps)
# postgresql16-client: the script shells out to `psql`
# su-exec: drop privileges for the loop after the state dir is prepared
RUN apk add --no-cache nodejs postgresql16-client su-exec

COPY scripts/data-retention.mjs /opt/azeebo/scripts/data-retention.mjs
COPY docker/archive-cleanup-entrypoint.sh /opt/azeebo/entrypoint.sh
RUN chmod +x /opt/azeebo/entrypoint.sh \
    && addgroup -g 70 pgjob \
    && adduser -D -u 70 -G pgjob pgjob

ENV STATE_FILE_DIR=/var/lib/azeebo/data-retention \
    JOB_SCRIPT=/opt/azeebo/scripts/data-retention.mjs \
    JOB_NAME=data-retention \
    JOB_INTERVAL=86400 \
    JOB_OFFSET=7200 \
    JOB_ARGS=--apply

ENTRYPOINT ["/opt/azeebo/entrypoint.sh"]
