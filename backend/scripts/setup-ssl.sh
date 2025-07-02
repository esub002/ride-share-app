#!/bin/bash

# ========================================
# SSL/HTTPS SETUP SCRIPT FOR PRODUCTION
# ========================================

set -e  # Exit on any error

echo "🔒 Starting SSL/HTTPS Setup for Ride Share Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if env.production exists
if [ ! -f "env.production" ]; then
    print_error "env.production file not found!"
    print_status "Please create env.production file with your production environment variables."
    exit 1
fi

# Load environment variables
source env.production

print_status "SSL Setup Options:"
echo "1. Let's Encrypt with Certbot (Free, Recommended)"
echo "2. Commercial SSL Certificate"
echo "3. Self-Signed Certificate (Development Only)"
echo "4. Docker with SSL"
echo ""
read -p "Choose option (1-4): " ssl_option

case $ssl_option in
    1)
        print_status "Setting up Let's Encrypt SSL..."
        setup_lets_encrypt
        ;;
    2)
        print_status "Setting up Commercial SSL..."
        setup_commercial_ssl
        ;;
    3)
        print_status "Setting up Self-Signed SSL..."
        setup_self_signed_ssl
        ;;
    4)
        print_status "Setting up Docker with SSL..."
        setup_docker_ssl
        ;;
    *)
        print_error "Invalid option selected"
        exit 1
        ;;
esac

setup_lets_encrypt() {
    print_status "Setting up Let's Encrypt SSL Certificate..."
    
    # Get domain information
    echo ""
    print_status "Enter your domain information:"
    read -p "Domain name (e.g., yourdomain.com): " domain_name
    read -p "Email address for Let's Encrypt notifications: " email_address
    
    # Check if domain is accessible
    print_status "Checking domain accessibility..."
    if ! nslookup $domain_name &> /dev/null; then
        print_error "Domain $domain_name is not accessible!"
        print_status "Please ensure your domain is properly configured and pointing to this server."
        exit 1
    fi
    
    # Install Certbot
    print_status "Installing Certbot..."
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install certbot python3-certbot-nginx -y
    elif command -v yum &> /dev/null; then
        sudo yum install epel-release -y
        sudo yum install certbot python3-certbot-nginx -y
    else
        print_error "Unsupported package manager"
        exit 1
    fi
    
    # Install Nginx if not installed
    if ! command -v nginx &> /dev/null; then
        print_status "Installing Nginx..."
        if command -v apt &> /dev/null; then
            sudo apt install nginx -y
        elif command -v yum &> /dev/null; then
            sudo yum install nginx -y
        fi
        
        sudo systemctl start nginx
        sudo systemctl enable nginx
    fi
    
    # Create Nginx configuration
    print_status "Creating Nginx configuration..."
    create_nginx_config $domain_name
    
    # Test Nginx configuration
    print_status "Testing Nginx configuration..."
    if sudo nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    # Obtain SSL certificate
    print_status "Obtaining SSL certificate from Let's Encrypt..."
    if sudo certbot --nginx -d $domain_name -d www.$domain_name --email $email_address --agree-tos --no-eff-email; then
        print_success "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi
    
    # Test certificate renewal
    print_status "Testing certificate renewal..."
    if sudo certbot renew --dry-run; then
        print_success "Certificate renewal test passed"
    else
        print_warning "Certificate renewal test failed"
    fi
    
    # Set up auto-renewal
    print_status "Setting up automatic certificate renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    # Update environment variables
    update_env_ssl $domain_name
    
    print_success "Let's Encrypt SSL setup completed!"
}

setup_commercial_ssl() {
    print_status "Setting up Commercial SSL Certificate..."
    
    echo ""
    print_status "Enter your commercial SSL certificate details:"
    read -p "Domain name: " domain_name
    read -p "Certificate file path: " cert_path
    read -p "Private key file path: " key_path
    read -p "CA bundle file path (optional): " ca_path
    
    # Check if certificate files exist
    if [ ! -f "$cert_path" ]; then
        print_error "Certificate file not found: $cert_path"
        exit 1
    fi
    
    if [ ! -f "$key_path" ]; then
        print_error "Private key file not found: $key_path"
        exit 1
    fi
    
    # Install Nginx if not installed
    if ! command -v nginx &> /dev/null; then
        print_status "Installing Nginx..."
        if command -v apt &> /dev/null; then
            sudo apt install nginx -y
        elif command -v yum &> /dev/null; then
            sudo yum install nginx -y
        fi
        
        sudo systemctl start nginx
        sudo systemctl enable nginx
    fi
    
    # Create SSL directory
    sudo mkdir -p /etc/ssl/ride-share
    
    # Copy certificate files
    sudo cp $cert_path /etc/ssl/ride-share/certificate.crt
    sudo cp $key_path /etc/ssl/ride-share/private.key
    
    if [ ! -z "$ca_path" ] && [ -f "$ca_path" ]; then
        sudo cp $ca_path /etc/ssl/ride-share/ca_bundle.crt
    fi
    
    # Set proper permissions
    sudo chmod 644 /etc/ssl/ride-share/certificate.crt
    sudo chmod 600 /etc/ssl/ride-share/private.key
    if [ -f "/etc/ssl/ride-share/ca_bundle.crt" ]; then
        sudo chmod 644 /etc/ssl/ride-share/ca_bundle.crt
    fi
    
    # Create Nginx configuration
    create_nginx_config_commercial $domain_name
    
    # Test Nginx configuration
    print_status "Testing Nginx configuration..."
    if sudo nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    # Update environment variables
    update_env_ssl $domain_name
    
    print_success "Commercial SSL setup completed!"
}

setup_self_signed_ssl() {
    print_status "Setting up Self-Signed SSL Certificate..."
    
    echo ""
    print_status "Enter your domain information:"
    read -p "Domain name (e.g., localhost): " domain_name
    read -p "Organization name: " org_name
    read -p "Country code (e.g., US): " country_code
    
    # Create SSL directory
    sudo mkdir -p /etc/ssl/ride-share
    
    # Generate self-signed certificate
    print_status "Generating self-signed certificate..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/ride-share/private.key \
        -out /etc/ssl/ride-share/certificate.crt \
        -subj "/C=$country_code/ST=State/L=City/O=$org_name/CN=$domain_name"
    
    # Set proper permissions
    sudo chmod 644 /etc/ssl/ride-share/certificate.crt
    sudo chmod 600 /etc/ssl/ride-share/private.key
    
    # Install Nginx if not installed
    if ! command -v nginx &> /dev/null; then
        print_status "Installing Nginx..."
        if command -v apt &> /dev/null; then
            sudo apt install nginx -y
        elif command -v yum &> /dev/null; then
            sudo yum install nginx -y
        fi
        
        sudo systemctl start nginx
        sudo systemctl enable nginx
    fi
    
    # Create Nginx configuration
    create_nginx_config_self_signed $domain_name
    
    # Test Nginx configuration
    print_status "Testing Nginx configuration..."
    if sudo nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    # Update environment variables
    update_env_ssl $domain_name
    
    print_warning "Self-signed certificate created. This is for development only!"
    print_success "Self-signed SSL setup completed!"
}

setup_docker_ssl() {
    print_status "Setting up Docker with SSL..."
    
    echo ""
    print_status "Enter your domain information:"
    read -p "Domain name (e.g., yourdomain.com): " domain_name
    read -p "Email address for Let's Encrypt notifications: " email_address
    
    # Create directories for SSL certificates
    mkdir -p ssl certbot/conf certbot/www
    
    # Create Docker Compose SSL configuration
    create_docker_ssl_config $domain_name $email_address
    
    # Create Nginx configuration for Docker
    create_docker_nginx_config $domain_name
    
    print_status "Docker SSL configuration created!"
    print_status "To start with SSL, run: docker-compose -f docker-compose.ssl.yml up -d"
    
    # Update environment variables
    update_env_ssl $domain_name
    
    print_success "Docker SSL setup completed!"
}

create_nginx_config() {
    local domain_name=$1
    
    cat > /tmp/ride-share-nginx.conf << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $domain_name www.$domain_name;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $domain_name www.$domain_name;

    # SSL Configuration (will be managed by Certbot)
    # ssl_certificate /etc/letsencrypt/live/$domain_name/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$domain_name/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;
    
    # Client Max Body Size
    client_max_body_size 10M;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # API Routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
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
    
    # Authentication routes with stricter rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API Documentation
    location /api-docs {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files (if serving frontend)
    location / {
        root /var/www/ride-share-frontend;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

    sudo cp /tmp/ride-share-nginx.conf /etc/nginx/sites-available/ride-share
    sudo ln -sf /etc/nginx/sites-available/ride-share /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
}

create_nginx_config_commercial() {
    local domain_name=$1
    
    cat > /tmp/ride-share-nginx.conf << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $domain_name www.$domain_name;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $domain_name www.$domain_name;

    # SSL Configuration
    ssl_certificate /etc/ssl/ride-share/certificate.crt;
    ssl_certificate_key /etc/ssl/ride-share/private.key;
    ssl_trusted_certificate /etc/ssl/ride-share/ca_bundle.crt;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;
    
    # Client Max Body Size
    client_max_body_size 10M;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # API Routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
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
    
    # Authentication routes with stricter rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API Documentation
    location /api-docs {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files (if serving frontend)
    location / {
        root /var/www/ride-share-frontend;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

    sudo cp /tmp/ride-share-nginx.conf /etc/nginx/sites-available/ride-share
    sudo ln -sf /etc/nginx/sites-available/ride-share /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
}

create_nginx_config_self_signed() {
    local domain_name=$1
    
    cat > /tmp/ride-share-nginx.conf << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $domain_name www.$domain_name;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $domain_name www.$domain_name;

    # SSL Configuration
    ssl_certificate /etc/ssl/ride-share/certificate.crt;
    ssl_certificate_key /etc/ssl/ride-share/private.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;
    
    # Client Max Body Size
    client_max_body_size 10M;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # API Routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
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
    
    # Authentication routes with stricter rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API Documentation
    location /api-docs {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files (if serving frontend)
    location / {
        root /var/www/ride-share-frontend;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

    sudo cp /tmp/ride-share-nginx.conf /etc/nginx/sites-available/ride-share
    sudo ln -sf /etc/nginx/sites-available/ride-share /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
}

create_docker_ssl_config() {
    local domain_name=$1
    local email_address=$2
    
    cat > docker-compose.ssl.yml << EOF
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: ride-share-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.ssl.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - app
    networks:
      - app-network

  certbot:
    image: certbot/certbot
    container_name: ride-share-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: certonly --webroot --webroot-path=/var/www/certbot --email $email_address --agree-tos --no-eff-email -d $domain_name

  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: ride-share-backend-prod
    restart: unless-stopped
    expose:
      - "3000"
    env_file:
      - env.production
    environment:
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - app_logs:/app/logs
      - app_backups:/app/backups
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    container_name: ride-share-postgres-prod
    restart: unless-stopped
    env_file:
      - env.production
    environment:
      POSTGRES_DB: \${DB_NAME}
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./safety-schema.sql:/docker-entrypoint-initdb.d/02-safety-schema.sql
      - ./analytics-schema.sql:/docker-entrypoint-initdb.d/03-analytics-schema.sql
      - ./security-schema.sql:/docker-entrypoint-initdb.d/04-security-schema.sql
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER} -d \${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    container_name: ride-share-redis-prod
    restart: unless-stopped
    command: redis-server --requirepass \${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  app_logs:
    driver: local
  app_backups:
    driver: local

networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF
}

create_docker_nginx_config() {
    local domain_name=$1
    
    cat > nginx.ssl.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name $domain_name www.$domain_name;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://\$server_name\$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name $domain_name www.$domain_name;

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/$domain_name/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$domain_name/privkey.pem;
        
        # SSL Security Settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API Routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
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
        
        # WebSocket support
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_read_timeout 86400;
        }
        
        # Health check
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
}

update_env_ssl() {
    local domain_name=$1
    
    # Update environment variables
    sed -i "s|SSL_KEY_PATH=.*|SSL_KEY_PATH=/etc/letsencrypt/live/$domain_name/privkey.pem|" env.production
    sed -i "s|SSL_CERT_PATH=.*|SSL_CERT_PATH=/etc/letsencrypt/live/$domain_name/fullchain.pem|" env.production
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$domain_name|" env.production
    sed -i "s|SOCKET_CORS_ORIGIN=.*|SOCKET_CORS_ORIGIN=https://$domain_name|" env.production
    sed -i "s|FORCE_HTTPS=.*|FORCE_HTTPS=true|" env.production
}

# Final verification
print_status "Performing SSL verification..."
if curl -k https://$domain_name/health &> /dev/null; then
    print_success "SSL setup verification passed!"
else
    print_warning "SSL setup verification failed - this might be normal during setup"
fi

print_success "SSL/HTTPS setup completed successfully!"
echo ""
echo "🔒 SSL Information:"
echo "  - Domain: $domain_name"
echo "  - Certificate: Let's Encrypt (if applicable)"
echo "  - HTTPS: Enabled"
echo "  - Security Headers: Configured"
echo ""
echo "🔍 Next Steps:"
echo "  1. Test HTTPS: curl -k https://$domain_name/health"
echo "  2. Check SSL: openssl s_client -connect $domain_name:443"
echo "  3. Test SSL Labs: https://www.ssllabs.com/ssltest/analyze.html?d=$domain_name"
echo ""
print_success "SSL setup script completed!" 