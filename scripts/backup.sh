#!/bin/bash
# Backup script for AdriSu Kids databases
# Run daily via cron: 0 2 * * * /path/to/backup.sh

set -e

BACKUP_DIR="/backups/adriskids"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
echo "[$(date)] Starting PostgreSQL backup..."
docker exec adris-postgres pg_dump -U adris adriskids | gzip > "$BACKUP_DIR/adriskids_$DATE.sql.gz"

# Remove old backups
echo "[$(date)] Cleaning old backups (>$RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "[$(date)] Backup completed: adriskids_$DATE.sql.gz"
ls -lh "$BACKUP_DIR"/adriskids_*.sql.gz | tail -5
