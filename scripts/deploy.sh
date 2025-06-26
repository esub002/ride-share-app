#!/bin/bash

# ========================================
# PRODUCTION DEPLOYMENT SCRIPT
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="ride-share-backend"
DEPLOY_PATH="/opt/ride-share"
BACKUP_PATH="/opt/backups"
LOG_PATH="/var/log/ride-share"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required commands exist
    commands=("docker" "docker-compose" "git" "node" "npm")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    log_success "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    sudo mkdir -p $DEPLOY_PATH
    sudo mkdir -p $BACKUP_PATH
    sudo mkdir -p $LOG_PATH
    sudo mkdir -p /etc/ride-share
    
    # Set proper permissions
    sudo chown -R $USER:$USER $DEPLOY_PATH
    sudo chown -R $USER:$USER $BACKUP_PATH
    sudo chown -R $USER:$USER $LOG_PATH
    
    log_success "Directories created"
}

# Setup environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    if [ ! -f /etc/ride-share/.env ]; then
        log_warning "Environment file not found. Please create /etc/ride-share/.env"
        log_info "You can copy from .env.example and update the values"
        exit 1
    fi
    
    # Copy environment file to deployment directory
    cp /etc/ride-share/.env $DEPLOY_PATH/.env
    
    log_success "Environment variables configured"
}

# Setup SSL certificates
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    SSL_DIR="/etc/ssl/ride-share"
    sudo mkdir -p $SSL_DIR
    
    # Check if certificates exist
    if [ ! -f $SSL_DIR/private.key ] || [ ! -f $SSL_DIR/certificate.crt ]; then
        log_warning "SSL certificates not found in $SSL_DIR"
        log_info "Please place your SSL certificates:"
        log_info "  - $SSL_DIR/private.key"
        log_info "  - $SSL_DIR/certificate.crt"
        log_info "  - $SSL_DIR/ca_bundle.crt (optional)"
        exit 1
    fi
    
    # Set proper permissions
    sudo chmod 600 $SSL_DIR/private.key
    sudo chmod 644 $SSL_DIR/certificate.crt
    
    log_success "SSL certificates configured"
}

# Setup database
setup_database() {
    log_info "Setting up database..."
    
    # Check if PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        log_error "PostgreSQL is not running"
        exit 1
    fi
    
    # Create database if it doesn't exist
    DB_NAME=$(grep DB_NAME $DEPLOY_PATH/.env | cut -d '=' -f2)
    if [ -z "$DB_NAME" ]; then
        DB_NAME="ride_share_prod"
    fi
    
    createdb $DB_NAME 2>/dev/null || log_info "Database $DB_NAME already exists"
    
    # Run migrations
    log_info "Running database migrations..."
    cd $DEPLOY_PATH
    psql $DB_NAME -f schema.sql
    psql $DB_NAME -f safety-schema.sql
    
    log_success "Database setup completed"
}

# Create systemd service
create_service() {
    log_info "Creating systemd service..."
    
    SERVICE_FILE="/etc/systemd/system/ride-share-backend.service"
    
    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Ride Share Backend API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_PATH
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ride-share-backend

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DEPLOY_PATH $LOG_PATH $BACKUP_PATH

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable ride-share-backend
    
    log_success "Systemd service created"
}

# Setup Nginx reverse proxy
setup_nginx() {
    log_info "Setting up Nginx reverse proxy..."
    
    NGINX_CONF="/etc/nginx/sites-available/ride-share"
    
    sudo tee $NGINX_CONF > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /etc/ssl/ride-share/certificate.crt;
    ssl_certificate_key /etc/ssl/ride-share/private.key;
    ssl_trusted_certificate /etc/ssl/ride-share/ca_bundle.crt;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF
    
    # Enable site
    sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    
    log_success "Nginx configuration completed"
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    cd $DEPLOY_PATH
    
    # Stop existing service
    sudo systemctl stop ride-share-backend || true
    
    # Pull latest code
    if [ -d ".git" ]; then
        git pull origin main
    fi
    
    # Install dependencies
    npm ci --production
    
    # Start service
    sudo systemctl start ride-share-backend
    
    # Check service status
    if sudo systemctl is-active --quiet ride-share-backend; then
        log_success "Application deployed successfully"
    else
        log_error "Application deployment failed"
        sudo systemctl status ride-share-backend
        exit 1
    fi
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Create logrotate configuration
    sudo tee /etc/logrotate.d/ride-share > /dev/null <<EOF
$LOG_PATH/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload ride-share-backend
    endscript
}
EOF
    
    log_success "Monitoring setup completed"
}

# Main deployment function
main() {
    log_info "Starting production deployment..."
    
    check_root
    check_prerequisites
    create_directories
    setup_environment
    setup_ssl
    setup_database
    create_service
    setup_nginx
    deploy_application
    setup_monitoring
    
    log_success "Production deployment completed successfully!"
    log_info "Application is running at: https://your-domain.com"
    log_info "Health check: https://your-domain.com/health"
    log_info "API docs: https://your-domain.com/api-docs"
}

# Run main function
main "$@" 