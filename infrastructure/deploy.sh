#!/bin/bash

# Ride-Share Application Deployment Script
# This script handles deployment for both development and production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
ENV_FILE=".env.${ENVIRONMENT}"

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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        warning "Environment file $ENV_FILE not found. Creating from template..."
        cp env.example "$ENV_FILE"
        warning "Please update $ENV_FILE with your configuration values."
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Docker Compose file $COMPOSE_FILE not found."
        exit 1
    fi
    
    log "Prerequisites check completed."
}

# Function to backup existing data
backup_existing_data() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Creating backup of existing data..."
        
        # Create backup directory
        mkdir -p backups/$(date +%Y%m%d_%H%M%S)
        
        # Backup database if running
        if docker-compose -f "$COMPOSE_FILE" ps db | grep -q "Up"; then
            docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump -U postgres ride_share > "backups/$(date +%Y%m%d_%H%M%S)/database_backup.sql" || warning "Database backup failed"
        fi
        
        # Backup volumes
        docker run --rm -v ride-share-app-main_db_data:/data -v $(pwd)/backups/$(date +%Y%m%d_%H%M%S):/backup alpine tar czf /backup/volumes_backup.tar.gz -C /data . || warning "Volume backup failed"
        
        log "Backup completed."
    fi
}

# Function to stop existing services
stop_services() {
    log "Stopping existing services..."
    
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" down
        log "Services stopped."
    else
        log "No running services found."
    fi
}

# Function to build images
build_images() {
    log "Building Docker images..."
    
    # Build backend
    log "Building backend image..."
    docker-compose -f "$COMPOSE_FILE" build backend
    
    # Build frontend
    log "Building frontend image..."
    docker-compose -f "$COMPOSE_FILE" build frontend
    
    log "Image building completed."
}

# Function to start services
start_services() {
    log "Starting services..."
    
    # Start services in the correct order
    docker-compose -f "$COMPOSE_FILE" up -d db redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 30
    
    # Start backend
    log "Starting backend..."
    docker-compose -f "$COMPOSE_FILE" up -d backend
    
    # Wait for backend to be ready
    log "Waiting for backend to be ready..."
    sleep 20
    
    # Start frontend
    log "Starting frontend..."
    docker-compose -f "$COMPOSE_FILE" up -d frontend
    
    # Start nginx
    log "Starting nginx..."
    docker-compose -f "$COMPOSE_FILE" up -d nginx
    
    # Start monitoring services in production
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Starting monitoring services..."
        docker-compose -f "$COMPOSE_FILE" up -d prometheus grafana
    fi
    
    log "Services started successfully."
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be fully ready
    sleep 10
    
    # Run migrations
    docker-compose -f "$COMPOSE_FILE" exec -T backend npm run migrate || warning "Migration failed"
    
    log "Migrations completed."
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if all services are running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log "All services are running."
    else
        error "Some services failed to start."
        docker-compose -f "$COMPOSE_FILE" ps
        exit 1
    fi
    
    # Check health endpoints
    log "Checking health endpoints..."
    
    # Backend health check
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "Backend health check passed."
    else
        warning "Backend health check failed."
    fi
    
    # Frontend health check
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        log "Frontend health check passed."
    else
        warning "Frontend health check failed."
    fi
    
    # Nginx health check
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        log "Nginx health check passed."
    else
        warning "Nginx health check failed."
    fi
    
    log "Deployment verification completed."
}

# Function to show service status
show_status() {
    log "Service Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log "Service URLs:"
    echo "Frontend: http://localhost:3001"
    echo "Backend API: http://localhost:3000"
    echo "Nginx: http://localhost:80"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "Prometheus: http://localhost:9090"
        echo "Grafana: http://localhost:3002"
    fi
    
    echo ""
    log "Logs can be viewed with: docker-compose -f $COMPOSE_FILE logs -f [service_name]"
}

# Function to setup SSL certificates (production only)
setup_ssl() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Setting up SSL certificates..."
        
        # Create SSL directory
        mkdir -p ssl
        
        # Check if certificates exist
        if [ ! -f "ssl/your_cert.crt" ] || [ ! -f "ssl/your_key.key" ]; then
            warning "SSL certificates not found. Please place your certificates in the ssl/ directory:"
            echo "  - ssl/your_cert.crt"
            echo "  - ssl/your_key.key"
            echo ""
            echo "Or update the nginx configuration to use Let's Encrypt or another SSL provider."
        else
            log "SSL certificates found."
        fi
    fi
}

# Function to setup monitoring (production only)
setup_monitoring() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Setting up monitoring..."
        
        # Create monitoring directories
        mkdir -p monitoring/grafana/dashboards
        mkdir -p monitoring/grafana/datasources
        
        # Create default Grafana datasource
        cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF
        
        log "Monitoring setup completed."
    fi
}

# Function to cleanup
cleanup() {
    log "Cleaning up..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this in production)
    if [ "$ENVIRONMENT" = "development" ]; then
        docker volume prune -f
    fi
    
    log "Cleanup completed."
}

# Main deployment function
deploy() {
    log "Starting deployment for $ENVIRONMENT environment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Setup SSL certificates
    setup_ssl
    
    # Setup monitoring
    setup_monitoring
    
    # Backup existing data
    backup_existing_data
    
    # Stop existing services
    stop_services
    
    # Build images
    build_images
    
    # Start services
    start_services
    
    # Run migrations
    run_migrations
    
    # Verify deployment
    verify_deployment
    
    # Show status
    show_status
    
    # Cleanup
    cleanup
    
    log "Deployment completed successfully!"
}

# Function to show help
show_help() {
    echo "Ride-Share Application Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [command]"
    echo ""
    echo "Environments:"
    echo "  development  - Deploy development environment (default)"
    echo "  production   - Deploy production environment"
    echo ""
    echo "Commands:"
    echo "  deploy       - Full deployment (default)"
    echo "  stop         - Stop all services"
    echo "  start        - Start all services"
    echo "  restart      - Restart all services"
    echo "  logs         - Show logs for all services"
    echo "  status       - Show service status"
    echo "  backup       - Create backup of current data"
    echo "  help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy development environment"
    echo "  $0 production         # Deploy production environment"
    echo "  $0 production stop    # Stop production services"
    echo "  $0 development logs   # Show development logs"
}

# Parse command line arguments
case "${2:-deploy}" in
    "deploy")
        deploy
        ;;
    "stop")
        log "Stopping services..."
        docker-compose -f "$COMPOSE_FILE" down
        ;;
    "start")
        log "Starting services..."
        docker-compose -f "$COMPOSE_FILE" up -d
        ;;
    "restart")
        log "Restarting services..."
        docker-compose -f "$COMPOSE_FILE" restart
        ;;
    "logs")
        log "Showing logs..."
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;
    "status")
        show_status
        ;;
    "backup")
        backup_existing_data
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        error "Unknown command: ${2:-deploy}"
        show_help
        exit 1
        ;;
esac 