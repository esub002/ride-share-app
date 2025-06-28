#!/bin/bash

# Database Backup Script for Ride-Share Application
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ride_share}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_S3_BUCKET="${AWS_S3_BUCKET:-ride-share-backups}"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
BACKUP_FILE="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Function to create database backup
create_backup() {
    log "Starting database backup..."
    
    # Set PostgreSQL password environment variable
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create backup using pg_dump
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges \
        --format=custom --compress=9 > "$BACKUP_PATH"; then
        log "Database backup created successfully: $BACKUP_FILE"
        return 0
    else
        error "Failed to create database backup"
        return 1
    fi
}

# Function to upload backup to AWS S3
upload_to_s3() {
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        warning "AWS credentials not provided, skipping S3 upload"
        return 0
    fi
    
    log "Uploading backup to S3..."
    
    if aws s3 cp "$BACKUP_PATH" "s3://$AWS_S3_BUCKET/database-backups/$BACKUP_FILE" \
        --region "$AWS_REGION" --quiet; then
        log "Backup uploaded to S3 successfully"
        return 0
    else
        error "Failed to upload backup to S3"
        return 1
    fi
}

# Function to clean up old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Clean local backups
    find "$BACKUP_DIR" -name "backup_*.sql" -type f -mtime +$RETENTION_DAYS -delete
    
    # Clean S3 backups if AWS credentials are available
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        aws s3 ls "s3://$AWS_S3_BUCKET/database-backups/" --region "$AWS_REGION" | \
        while read -r line; do
            createDate=$(echo "$line" | awk {'print $1'})
            createDate=$(date -d "$createDate" +%s)
            olderThan=$(date -d "-$RETENTION_DAYS days" +%s)
            if [[ $createDate -lt $olderThan ]]; then
                fileName=$(echo "$line" | awk {'print $4'})
                if [[ $fileName != "" ]]; then
                    aws s3 rm "s3://$AWS_S3_BUCKET/database-backups/$fileName" --region "$AWS_REGION" --quiet
                    log "Deleted old S3 backup: $fileName"
                fi
            fi
        done
    fi
    
    log "Cleanup completed"
}

# Function to verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    # Test restore to a temporary database
    TEMP_DB="temp_verify_$(date +%s)"
    
    # Create temporary database
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB" 2>/dev/null || true
    
    # Try to restore backup to temporary database
    if pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" \
        --no-owner --no-privileges --clean "$BACKUP_PATH" >/dev/null 2>&1; then
        log "Backup verification successful"
        
        # Drop temporary database
        dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB" 2>/dev/null || true
        return 0
    else
        error "Backup verification failed"
        
        # Drop temporary database
        dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB" 2>/dev/null || true
        return 1
    fi
}

# Function to send notification (placeholder)
send_notification() {
    local status="$1"
    local message="$2"
    
    # You can implement email, Slack, or other notification methods here
    log "Notification: $status - $message"
    
    # Example: Send email using curl (if you have an email service)
    # if [ -n "$SMTP_HOST" ]; then
    #     curl -X POST "https://api.sendgrid.com/v3/mail/send" \
    #          -H "Authorization: Bearer $SENDGRID_API_KEY" \
    #          -H "Content-Type: application/json" \
    #          -d "{\"personalizations\":[{\"to\":[{\"email\":\"$ADMIN_EMAIL\"}]}],\"from\":{\"email\":\"backup@yourdomain.com\"},\"subject\":\"Database Backup $status\",\"content\":[{\"type\":\"text/plain\",\"value\":\"$message\"}]}"
    # fi
}

# Main execution
main() {
    log "Starting backup process..."
    
    # Check if backup is restore mode
    if [ "$1" = "--restore" ]; then
        if [ -z "$2" ]; then
            error "Please specify backup file to restore"
            exit 1
        fi
        restore_backup "$2"
        exit 0
    fi
    
    # Create backup
    if create_backup; then
        # Verify backup
        if verify_backup; then
            # Upload to S3
            upload_to_s3
            
            # Clean up old backups
            cleanup_old_backups
            
            # Send success notification
            send_notification "SUCCESS" "Database backup completed successfully: $BACKUP_FILE"
            
            log "Backup process completed successfully"
            exit 0
        else
            error "Backup verification failed"
            send_notification "FAILED" "Backup verification failed: $BACKUP_FILE"
            exit 1
        fi
    else
        error "Backup creation failed"
        send_notification "FAILED" "Backup creation failed"
        exit 1
    fi
}

# Function to restore backup
restore_backup() {
    local backup_file="$1"
    local backup_path="$BACKUP_DIR/$backup_file"
    
    if [ ! -f "$backup_path" ]; then
        error "Backup file not found: $backup_path"
        exit 1
    fi
    
    log "Restoring database from backup: $backup_file"
    
    # Set PostgreSQL password environment variable
    export PGPASSWORD="$DB_PASSWORD"
    
    # Restore database
    if pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges "$backup_path"; then
        log "Database restored successfully"
        send_notification "SUCCESS" "Database restored successfully from: $backup_file"
    else
        error "Database restore failed"
        send_notification "FAILED" "Database restore failed from: $backup_file"
        exit 1
    fi
}

# Run main function with all arguments
main "$@" 