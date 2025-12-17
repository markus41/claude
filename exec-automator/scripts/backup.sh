#!/bin/bash
#######################################################################
# exec-automator Configuration Backup Script
# Copyright (c) 2025 Brookside BI
#
# Backs up critical configurations and data:
# - Environment variables (.env)
# - Integration credentials
# - Workflow definitions
# - Checkpoint database
# - Agent configurations
# - Logs (optional)
#
# Features:
# - Compressed backups with timestamps
# - Encryption support (gpg)
# - Remote backup (rsync, S3)
# - Automatic rotation
# - Restore functionality
#
# Usage:
#   ./scripts/backup.sh [options]
#
# Options:
#   --output DIR     Backup directory (default: ./backups)
#   --encrypt        Encrypt backup with GPG
#   --remote URL     Upload to remote location
#   --include-logs   Include log files in backup
#   --restore FILE   Restore from backup archive
#   --list           List available backups
#   --help           Show this help message
#######################################################################

set -e  # Exit on error

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'

# Script configuration
BACKUP_DIR=""
ENCRYPT_BACKUP=false
REMOTE_URL=""
INCLUDE_LOGS=false
RESTORE_FILE=""
LIST_BACKUPS=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PLUGIN_ROOT/logs"
LOG_FILE="$LOG_DIR/backup-$(date +%Y%m%d-%H%M%S).log"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEFAULT_BACKUP_DIR="$PLUGIN_ROOT/backups"

#######################################################################
# Logging Functions
#######################################################################

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $*"
    log "INFO" "$*"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
    log "SUCCESS" "$*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
    log "WARN" "$*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
    log "ERROR" "$*"
}

#######################################################################
# Utility Functions
#######################################################################

show_help() {
    cat << EOF
${BOLD}exec-automator Configuration Backup Script${NC}

${CYAN}Usage:${NC}
  ./scripts/backup.sh [options]

${CYAN}Options:${NC}
  --output DIR     Backup directory (default: ./backups)
  --encrypt        Encrypt backup with GPG
  --remote URL     Upload to remote location (rsync or s3://)
  --include-logs   Include log files in backup
  --restore FILE   Restore from backup archive
  --list           List available backups
  --help           Show this help message

${CYAN}Examples:${NC}
  # Create basic backup
  ./scripts/backup.sh

  # Encrypted backup to custom location
  ./scripts/backup.sh --output /secure/backups --encrypt

  # Backup with logs to S3
  ./scripts/backup.sh --include-logs --remote s3://my-bucket/backups

  # List available backups
  ./scripts/backup.sh --list

  # Restore from backup
  ./scripts/backup.sh --restore backups/exec-automator-20250101-120000.tar.gz

${CYAN}Backup Contents:${NC}
  - Environment configuration (.env)
  - Integration credentials
  - Workflow definitions
  - Checkpoint database
  - Agent configurations
  - Plugin settings

${CYAN}Encryption:${NC}
  Requires GPG to be installed. Backup will be encrypted with
  symmetric encryption (password-based).

${CYAN}Remote Backup:${NC}
  Supports:
    - rsync: user@host:/path/to/backups
    - S3:    s3://bucket-name/path (requires AWS CLI)

EOF
}

print_banner() {
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                Configuration Backup Tool                     ║
║                                                               ║
║            Secure your exec-automator setup                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo ""
}

check_dependencies() {
    local missing_deps=()

    # Check for required commands
    if ! command -v tar &> /dev/null; then
        missing_deps+=("tar")
    fi

    if [[ "$ENCRYPT_BACKUP" == true ]] && ! command -v gpg &> /dev/null; then
        error "GPG not found - required for encryption"
        missing_deps+=("gpg")
    fi

    if [[ -n "$REMOTE_URL" ]]; then
        if [[ "$REMOTE_URL" == s3://* ]]; then
            if ! command -v aws &> /dev/null; then
                error "AWS CLI not found - required for S3 uploads"
                missing_deps+=("aws")
            fi
        elif [[ "$REMOTE_URL" == *:* ]]; then
            if ! command -v rsync &> /dev/null; then
                error "rsync not found - required for remote backups"
                missing_deps+=("rsync")
            fi
        fi
    fi

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
}

#######################################################################
# Backup Functions
#######################################################################

setup_backup_directory() {
    if [[ -z "$BACKUP_DIR" ]]; then
        BACKUP_DIR="$DEFAULT_BACKUP_DIR"
    fi

    info "Setting up backup directory: $BACKUP_DIR"

    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        success "Created backup directory"
    fi
}

create_backup_manifest() {
    local manifest_file="$1"

    info "Creating backup manifest..."

    cat > "$manifest_file" << EOF
# exec-automator Backup Manifest
# Created: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# Version: 1.0.0
# Plugin: exec-automator

Backup Timestamp: $TIMESTAMP
Plugin Root: $PLUGIN_ROOT
Hostname: $(hostname)
User: $(whoami)

Included Files:
$(find "$PLUGIN_ROOT" -type f \
    -name ".env" -o \
    -name "*.json" -o \
    -name "*.md" -o \
    -path "*/workflows/*" -o \
    -path "*/agents/*" -o \
    -path "*/mcp-server/data/*" \
    2>/dev/null | sed "s|$PLUGIN_ROOT/||" | sort)

Backup Size: TBD
Checksum: TBD
EOF

    success "Manifest created"
}

create_backup_archive() {
    info "Creating backup archive..."

    local archive_name="exec-automator-$TIMESTAMP"
    local temp_dir=$(mktemp -d)
    local backup_staging="$temp_dir/$archive_name"

    # Create staging directory
    mkdir -p "$backup_staging"

    # Copy configuration files
    info "Backing up configuration files..."

    if [[ -f "$PLUGIN_ROOT/.env" ]]; then
        cp "$PLUGIN_ROOT/.env" "$backup_staging/"
        success "Backed up .env file"
    else
        warn "No .env file found"
    fi

    # Copy integration credentials
    if [[ -f "$PLUGIN_ROOT/mcp-server/config/integrations.json" ]]; then
        mkdir -p "$backup_staging/mcp-server/config"
        cp "$PLUGIN_ROOT/mcp-server/config/integrations.json" "$backup_staging/mcp-server/config/"
        success "Backed up integration credentials"
    fi

    # Copy workflow definitions
    if [[ -d "$PLUGIN_ROOT/workflows" ]]; then
        cp -r "$PLUGIN_ROOT/workflows" "$backup_staging/"
        success "Backed up workflow definitions"
    fi

    # Copy agent configurations
    if [[ -d "$PLUGIN_ROOT/agents" ]]; then
        cp -r "$PLUGIN_ROOT/agents" "$backup_staging/"
        success "Backed up agent configurations"
    fi

    # Copy plugin settings
    if [[ -d "$PLUGIN_ROOT/.claude-plugin" ]]; then
        cp -r "$PLUGIN_ROOT/.claude-plugin" "$backup_staging/"
        success "Backed up plugin settings"
    fi

    # Copy checkpoint database
    if [[ -f "$PLUGIN_ROOT/mcp-server/data/checkpoints.db" ]]; then
        mkdir -p "$backup_staging/mcp-server/data"
        cp "$PLUGIN_ROOT/mcp-server/data/checkpoints.db" "$backup_staging/mcp-server/data/"
        success "Backed up checkpoint database"
    fi

    # Optionally include logs
    if [[ "$INCLUDE_LOGS" == true ]] && [[ -d "$LOG_DIR" ]]; then
        cp -r "$LOG_DIR" "$backup_staging/"
        success "Backed up log files"
    fi

    # Create manifest
    create_backup_manifest "$backup_staging/MANIFEST.txt"

    # Create tarball
    info "Compressing backup archive..."
    local archive_file="$BACKUP_DIR/${archive_name}.tar.gz"

    cd "$temp_dir"
    tar -czf "$archive_file" "$archive_name"

    # Calculate checksum
    local checksum=$(sha256sum "$archive_file" | awk '{print $1}')
    echo "$checksum  ${archive_name}.tar.gz" > "$archive_file.sha256"

    # Update manifest with size and checksum
    local size=$(du -h "$archive_file" | cut -f1)
    sed -i "s|Backup Size: TBD|Backup Size: $size|" "$backup_staging/MANIFEST.txt"
    sed -i "s|Checksum: TBD|Checksum: $checksum|" "$backup_staging/MANIFEST.txt"

    # Cleanup temp directory
    rm -rf "$temp_dir"

    success "Backup archive created: $archive_file"
    info "Size: $size"
    info "SHA256: $checksum"

    echo "$archive_file"
}

encrypt_backup() {
    local archive_file=$1

    info "Encrypting backup with GPG..."

    # Encrypt with symmetric encryption
    gpg --symmetric --cipher-algo AES256 --output "${archive_file}.gpg" "$archive_file"

    if [[ $? -eq 0 ]]; then
        # Remove unencrypted archive
        rm "$archive_file"

        # Update checksum file
        mv "${archive_file}.sha256" "${archive_file}.gpg.sha256"

        success "Backup encrypted: ${archive_file}.gpg"
        echo "${archive_file}.gpg"
    else
        error "Encryption failed"
        exit 1
    fi
}

upload_to_remote() {
    local backup_file=$1

    info "Uploading backup to remote location: $REMOTE_URL"

    if [[ "$REMOTE_URL" == s3://* ]]; then
        # S3 upload
        aws s3 cp "$backup_file" "$REMOTE_URL/" --no-progress

        if [[ $? -eq 0 ]]; then
            # Also upload checksum
            aws s3 cp "${backup_file}.sha256" "$REMOTE_URL/" --no-progress
            success "Backup uploaded to S3"
        else
            error "S3 upload failed"
            exit 1
        fi
    else
        # rsync upload
        rsync -avz --progress "$backup_file" "$REMOTE_URL/"
        rsync -avz --progress "${backup_file}.sha256" "$REMOTE_URL/"

        if [[ $? -eq 0 ]]; then
            success "Backup uploaded via rsync"
        else
            error "rsync upload failed"
            exit 1
        fi
    fi
}

rotate_old_backups() {
    info "Rotating old backups (keeping last 10)..."

    # Count backups
    local backup_count=$(find "$BACKUP_DIR" -name "exec-automator-*.tar.gz*" -o -name "exec-automator-*.tar.gz.gpg" | wc -l)

    if [[ $backup_count -gt 10 ]]; then
        # Delete oldest backups
        find "$BACKUP_DIR" -name "exec-automator-*.tar.gz*" -o -name "exec-automator-*.tar.gz.gpg" | \
            sort | \
            head -n $((backup_count - 10)) | \
            xargs rm -f

        success "Removed $((backup_count - 10)) old backups"
    else
        info "No rotation needed ($backup_count backups)"
    fi
}

#######################################################################
# Restore Functions
#######################################################################

list_backups() {
    info "Available backups in $BACKUP_DIR:"
    echo ""

    if [[ ! -d "$BACKUP_DIR" ]]; then
        warn "Backup directory not found: $BACKUP_DIR"
        return
    fi

    local backups=$(find "$BACKUP_DIR" -name "exec-automator-*.tar.gz*" -o -name "exec-automator-*.tar.gz.gpg" 2>/dev/null | sort -r)

    if [[ -z "$backups" ]]; then
        warn "No backups found"
        return
    fi

    echo -e "${BOLD}${CYAN}Backup Archives:${NC}"
    echo ""

    while IFS= read -r backup; do
        local filename=$(basename "$backup")
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" 2>/dev/null || stat -f "%Sm" "$backup" 2>/dev/null)

        echo -e "  ${GREEN}●${NC} $filename"
        echo -e "    Size: $size"
        echo -e "    Date: $date"

        # Check for checksum file
        if [[ -f "${backup}.sha256" ]]; then
            local checksum=$(cat "${backup}.sha256" | awk '{print $1}')
            echo -e "    SHA256: $checksum"
        fi

        echo ""
    done <<< "$backups"
}

restore_from_backup() {
    local backup_file=$1

    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi

    info "Restoring from backup: $backup_file"

    # Verify checksum if available
    if [[ -f "${backup_file}.sha256" ]]; then
        info "Verifying backup integrity..."

        local expected_checksum=$(cat "${backup_file}.sha256" | awk '{print $1}')
        local actual_checksum=$(sha256sum "$backup_file" | awk '{print $1}')

        if [[ "$expected_checksum" == "$actual_checksum" ]]; then
            success "Checksum verification passed"
        else
            error "Checksum verification failed!"
            error "Expected: $expected_checksum"
            error "Actual:   $actual_checksum"
            exit 1
        fi
    else
        warn "No checksum file found - skipping verification"
    fi

    # Check if encrypted
    if [[ "$backup_file" == *.gpg ]]; then
        info "Backup is encrypted - decrypting..."

        local decrypted_file="${backup_file%.gpg}"
        gpg --decrypt --output "$decrypted_file" "$backup_file"

        if [[ $? -ne 0 ]]; then
            error "Decryption failed"
            exit 1
        fi

        backup_file="$decrypted_file"
        success "Backup decrypted"
    fi

    # Create backup of current state
    warn "Creating backup of current configuration..."
    local current_backup="$BACKUP_DIR/pre-restore-$(date +%Y%m%d-%H%M%S).tar.gz"

    if [[ -d "$PLUGIN_ROOT" ]]; then
        tar -czf "$current_backup" \
            -C "$PLUGIN_ROOT" \
            .env \
            mcp-server/config \
            workflows \
            agents \
            .claude-plugin \
            2>/dev/null || true

        success "Current state backed up to: $current_backup"
    fi

    # Extract backup
    info "Extracting backup archive..."

    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"

    # Find extracted directory
    local extracted_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "exec-automator-*" | head -n 1)

    if [[ -z "$extracted_dir" ]]; then
        error "Failed to find extracted backup directory"
        rm -rf "$temp_dir"
        exit 1
    fi

    # Restore files
    info "Restoring configuration files..."

    if [[ -f "$extracted_dir/.env" ]]; then
        cp "$extracted_dir/.env" "$PLUGIN_ROOT/"
        success "Restored .env file"
    fi

    if [[ -d "$extracted_dir/mcp-server/config" ]]; then
        mkdir -p "$PLUGIN_ROOT/mcp-server/config"
        cp -r "$extracted_dir/mcp-server/config/"* "$PLUGIN_ROOT/mcp-server/config/"
        success "Restored integration credentials"
    fi

    if [[ -d "$extracted_dir/workflows" ]]; then
        cp -r "$extracted_dir/workflows" "$PLUGIN_ROOT/"
        success "Restored workflow definitions"
    fi

    if [[ -d "$extracted_dir/agents" ]]; then
        cp -r "$extracted_dir/agents" "$PLUGIN_ROOT/"
        success "Restored agent configurations"
    fi

    if [[ -d "$extracted_dir/.claude-plugin" ]]; then
        cp -r "$extracted_dir/.claude-plugin" "$PLUGIN_ROOT/"
        success "Restored plugin settings"
    fi

    if [[ -f "$extracted_dir/mcp-server/data/checkpoints.db" ]]; then
        mkdir -p "$PLUGIN_ROOT/mcp-server/data"
        cp "$extracted_dir/mcp-server/data/checkpoints.db" "$PLUGIN_ROOT/mcp-server/data/"
        success "Restored checkpoint database"
    fi

    # Cleanup
    rm -rf "$temp_dir"

    success "Restore complete!"
    info "Previous state saved to: $current_backup"
}

#######################################################################
# Main Function
#######################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --output)
                BACKUP_DIR="$2"
                shift 2
                ;;
            --encrypt)
                ENCRYPT_BACKUP=true
                shift
                ;;
            --remote)
                REMOTE_URL="$2"
                shift 2
                ;;
            --include-logs)
                INCLUDE_LOGS=true
                shift
                ;;
            --restore)
                RESTORE_FILE="$2"
                shift 2
                ;;
            --list)
                LIST_BACKUPS=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Setup backup directory
    setup_backup_directory

    # Handle list mode
    if [[ "$LIST_BACKUPS" == true ]]; then
        list_backups
        exit 0
    fi

    # Handle restore mode
    if [[ -n "$RESTORE_FILE" ]]; then
        print_banner
        restore_from_backup "$RESTORE_FILE"
        exit 0
    fi

    # Check dependencies
    check_dependencies

    # Create backup
    print_banner

    local backup_file=$(create_backup_archive)

    # Encrypt if requested
    if [[ "$ENCRYPT_BACKUP" == true ]]; then
        backup_file=$(encrypt_backup "$backup_file")
    fi

    # Upload to remote if specified
    if [[ -n "$REMOTE_URL" ]]; then
        upload_to_remote "$backup_file"
    fi

    # Rotate old backups
    rotate_old_backups

    echo ""
    success "Backup completed successfully!"
    info "Backup file: $backup_file"
    echo ""
}

# Run main function
main "$@"
