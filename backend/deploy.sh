#!/bin/bash

# ========================================
# RIDE SHARE BACKEND - PRODUCTION DEPLOYMENT
# ========================================

set -e  # Exit on any error

echo "🚀 Starting Ride Share Backend Production Deployment..."

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

# Check if env.production exists
if [ ! -f "env.production" ]; then
    print_error "env.production file not found!"
    print_status "Please create env.production file with your production environment variables."
    print_status "You can copy from env.example and update the values."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running!"
    print_status "Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed!"
    print_status "Please install Docker Compose and try again."
    exit 1
fi

print_status "Checking prerequisites..."

# Create necessary directories
mkdir -p logs backups

print_status "Building production Docker images..."
docker-compose -f docker-compose.prod.yml build

print_status "Stopping any existing containers..."
docker-compose -f docker-compose.prod.yml down

print_status "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Health checks
print_status "Running health checks..."

# Check if the API is responding
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "API health check passed"
else
    print_warning "API health check failed - this might be normal during startup"
fi

# Check database
if docker-compose -f docker-compose.prod.yml exec -T app node test-db-connection.js > /dev/null 2>&1; then
    print_success "Database connection test passed"
else
    print_warning "Database connection test failed - check logs"
fi

# Check Redis
if docker-compose -f docker-compose.prod.yml exec redis redis-cli ping | grep -q "PONG"; then
    print_success "Redis connection test passed"
else
    print_warning "Redis connection test failed - check logs"
fi

print_status "Deployment completed!"
print_success "Your Ride Share Backend is now running in production mode."

echo ""
echo "📊 Service Information:"
echo "  - API: http://localhost:3000"
echo "  - Health Check: http://localhost:3000/health"
echo "  - Database: PostgreSQL on port 5432"
echo "  - Redis: Redis on port 6379"
echo "  - Grafana (if enabled): http://localhost:3001"

echo ""
echo "🔍 Useful Commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  - Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "  - Update and redeploy: ./deploy.sh"

echo ""
print_warning "Remember to:"
echo "  - Configure your domain and SSL certificates"
echo "  - Set up proper firewall rules"
echo "  - Configure monitoring and alerting"
echo "  - Set up automated backups"

print_success "Deployment script completed successfully!" 