#!/bin/bash

# ========================================
# DATABASE SETUP SCRIPT FOR PRODUCTION
# ========================================

set -e  # Exit on any error

echo "🗄️ Starting Database Setup for Ride Share Production..."

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

print_status "Database Setup Options:"
echo "1. Docker Database (Recommended for development/small scale)"
echo "2. External PostgreSQL (Recommended for production)"
echo "3. Managed Database Service (AWS RDS, Google Cloud SQL, etc.)"
echo ""
read -p "Choose option (1-3): " db_option

case $db_option in
    1)
        print_status "Setting up Docker Database..."
        setup_docker_database
        ;;
    2)
        print_status "Setting up External PostgreSQL..."
        setup_external_postgresql
        ;;
    3)
        print_status "Setting up Managed Database Service..."
        setup_managed_database
        ;;
    *)
        print_error "Invalid option selected"
        exit 1
        ;;
esac

setup_docker_database() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        print_status "Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        print_status "Please install Docker Compose first: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_status "Starting database and Redis containers..."
    docker-compose -f docker-compose.prod.yml up -d db redis
    
    print_status "Waiting for database to be ready..."
    sleep 30
    
    # Check if database is running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_success "Database containers are running"
    else
        print_error "Database containers failed to start"
        docker-compose -f docker-compose.prod.yml logs db
        exit 1
    fi
    
    # Test database connection
    print_status "Testing database connection..."
    if docker-compose -f docker-compose.prod.yml exec db pg_isready -U $DB_USER -d $DB_NAME; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        exit 1
    fi
    
    # Run schema files
    print_status "Running database schema files..."
    docker-compose -f docker-compose.prod.yml exec db psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/01-schema.sql
    docker-compose -f docker-compose.prod.yml exec db psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/02-safety-schema.sql
    docker-compose -f docker-compose.prod.yml exec db psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/03-analytics-schema.sql
    docker-compose -f docker-compose.prod.yml exec db psql -U $DB_USER -d $DB_NAME -f /docker-entrypoint-initdb.d/04-security-schema.sql
    
    print_success "Docker database setup completed!"
}

setup_external_postgresql() {
    print_status "Setting up External PostgreSQL..."
    
    # Check if PostgreSQL is installed
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client is not installed"
        print_status "Installing PostgreSQL client..."
        
        if command -v apt &> /dev/null; then
            sudo apt update
            sudo apt install postgresql-client -y
        elif command -v yum &> /dev/null; then
            sudo yum install postgresql -y
        else
            print_error "Unsupported package manager"
            exit 1
        fi
    fi
    
    # Get database connection details
    echo ""
    print_status "Enter your external PostgreSQL connection details:"
    read -p "Database Host: " db_host
    read -p "Database Port (default: 5432): " db_port
    db_port=${db_port:-5432}
    read -p "Database Name: " db_name
    read -p "Database User: " db_user
    read -s -p "Database Password: " db_password
    echo ""
    
    # Test connection
    print_status "Testing database connection..."
    if PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -c "SELECT version();" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        print_status "Please check your connection details and try again"
        exit 1
    fi
    
    # Run schema files
    print_status "Running database schema files..."
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f schema.sql
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f safety-schema.sql
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f analytics-schema.sql
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f security-schema.sql
    
    # Update env.production
    print_status "Updating environment variables..."
    sed -i "s/DB_HOST=.*/DB_HOST=$db_host/" env.production
    sed -i "s/DB_PORT=.*/DB_PORT=$db_port/" env.production
    sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" env.production
    sed -i "s/DB_USER=.*/DB_USER=$db_user/" env.production
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" env.production
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$db_user:$db_password@$db_host:$db_port/$db_name|" env.production
    
    print_success "External PostgreSQL setup completed!"
}

setup_managed_database() {
    print_status "Setting up Managed Database Service..."
    
    echo ""
    print_status "Choose your managed database service:"
    echo "1. AWS RDS"
    echo "2. Google Cloud SQL"
    echo "3. DigitalOcean Managed Database"
    echo "4. Other (manual setup)"
    echo ""
    read -p "Choose service (1-4): " service_option
    
    case $service_option in
        1)
            setup_aws_rds
            ;;
        2)
            setup_google_cloud_sql
            ;;
        3)
            setup_digitalocean_db
            ;;
        4)
            setup_other_managed_db
            ;;
        *)
            print_error "Invalid option selected"
            exit 1
            ;;
    esac
}

setup_aws_rds() {
    print_status "Setting up AWS RDS..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed!"
        print_status "Please install AWS CLI first: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    echo ""
    print_status "Enter AWS RDS details:"
    read -p "RDS Instance Identifier: " rds_identifier
    read -p "RDS Endpoint: " rds_endpoint
    read -p "Database Name: " db_name
    read -p "Database User: " db_user
    read -s -p "Database Password: " db_password
    echo ""
    
    # Test connection
    print_status "Testing RDS connection..."
    if PGPASSWORD=$db_password psql -h $rds_endpoint -U $db_user -d $db_name -c "SELECT version();" &> /dev/null; then
        print_success "RDS connection successful"
    else
        print_error "RDS connection failed"
        exit 1
    fi
    
    # Run schema files
    print_status "Running database schema files..."
    PGPASSWORD=$db_password psql -h $rds_endpoint -U $db_user -d $db_name -f schema.sql
    PGPASSWORD=$db_password psql -h $rds_endpoint -U $db_user -d $db_name -f safety-schema.sql
    PGPASSWORD=$db_password psql -h $rds_endpoint -U $db_user -d $db_name -f analytics-schema.sql
    PGPASSWORD=$db_password psql -h $rds_endpoint -U $db_user -d $db_name -f security-schema.sql
    
    # Update env.production
    sed -i "s/DB_HOST=.*/DB_HOST=$rds_endpoint/" env.production
    sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" env.production
    sed -i "s/DB_USER=.*/DB_USER=$db_user/" env.production
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" env.production
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$db_user:$db_password@$rds_endpoint:5432/$db_name|" env.production
    
    print_success "AWS RDS setup completed!"
}

setup_google_cloud_sql() {
    print_status "Setting up Google Cloud SQL..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI is not installed!"
        print_status "Please install Google Cloud CLI first: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    echo ""
    print_status "Enter Google Cloud SQL details:"
    read -p "Instance Name: " instance_name
    read -p "Connection Name: " connection_name
    read -p "Database Name: " db_name
    read -p "Database User: " db_user
    read -s -p "Database Password: " db_password
    echo ""
    
    # Test connection using Cloud SQL Proxy
    print_status "Testing Cloud SQL connection..."
    if gcloud sql connect $instance_name --user=$db_user --quiet; then
        print_success "Cloud SQL connection successful"
    else
        print_error "Cloud SQL connection failed"
        exit 1
    fi
    
    # Run schema files
    print_status "Running database schema files..."
    gcloud sql connect $instance_name --user=$db_user --database=$db_name < schema.sql
    gcloud sql connect $instance_name --user=$db_user --database=$db_name < safety-schema.sql
    gcloud sql connect $instance_name --user=$db_user --database=$db_name < analytics-schema.sql
    gcloud sql connect $instance_name --user=$db_user --database=$db_name < security-schema.sql
    
    # Update env.production
    sed -i "s/DB_HOST=.*/DB_HOST=$connection_name/" env.production
    sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" env.production
    sed -i "s/DB_USER=.*/DB_USER=$db_user/" env.production
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" env.production
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$db_user:$db_password@$connection_name:5432/$db_name|" env.production
    
    print_success "Google Cloud SQL setup completed!"
}

setup_digitalocean_db() {
    print_status "Setting up DigitalOcean Managed Database..."
    
    if ! command -v doctl &> /dev/null; then
        print_error "DigitalOcean CLI is not installed!"
        print_status "Please install DigitalOcean CLI first: https://docs.digitalocean.com/reference/doctl/how-to/install/"
        exit 1
    fi
    
    echo ""
    print_status "Enter DigitalOcean Database details:"
    read -p "Database Cluster ID: " cluster_id
    read -p "Database Name: " db_name
    read -p "Database User: " db_user
    read -s -p "Database Password: " db_password
    echo ""
    
    # Get connection details
    connection_details=$(doctl databases get $cluster_id --format json)
    db_host=$(echo $connection_details | jq -r '.connection.host')
    db_port=$(echo $connection_details | jq -r '.connection.port')
    
    # Test connection
    print_status "Testing DigitalOcean Database connection..."
    if PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -c "SELECT version();" &> /dev/null; then
        print_success "DigitalOcean Database connection successful"
    else
        print_error "DigitalOcean Database connection failed"
        exit 1
    fi
    
    # Run schema files
    print_status "Running database schema files..."
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f schema.sql
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f safety-schema.sql
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f analytics-schema.sql
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f security-schema.sql
    
    # Update env.production
    sed -i "s/DB_HOST=.*/DB_HOST=$db_host/" env.production
    sed -i "s/DB_PORT=.*/DB_PORT=$db_port/" env.production
    sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" env.production
    sed -i "s/DB_USER=.*/DB_USER=$db_user/" env.production
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" env.production
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$db_user:$db_password@$db_host:$db_port/$db_name|" env.production
    
    print_success "DigitalOcean Managed Database setup completed!"
}

setup_other_managed_db() {
    print_status "Setting up Other Managed Database..."
    
    echo ""
    print_status "Enter your managed database connection details:"
    read -p "Database Host: " db_host
    read -p "Database Port (default: 5432): " db_port
    db_port=${db_port:-5432}
    read -p "Database Name: " db_name
    read -p "Database User: " db_user
    read -s -p "Database Password: " db_password
    echo ""
    
    # Test connection
    print_status "Testing database connection..."
    if PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -c "SELECT version();" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        exit 1
    fi
    
    # Run schema files
    print_status "Running database schema files..."
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f schema.sql
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f safety-schema.sql
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f analytics-schema.sql
    PGPASSWORD=$db_password psql -h $db_host -p $db_port -U $db_user -d $db_name -f security-schema.sql
    
    # Update env.production
    sed -i "s/DB_HOST=.*/DB_HOST=$db_host/" env.production
    sed -i "s/DB_PORT=.*/DB_PORT=$db_port/" env.production
    sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" env.production
    sed -i "s/DB_USER=.*/DB_USER=$db_user/" env.production
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" env.production
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$db_user:$db_password@$db_host:$db_port/$db_name|" env.production
    
    print_success "Managed database setup completed!"
}

# Final verification
print_status "Performing final verification..."
if node test-db-connection.js; then
    print_success "Database setup verification passed!"
else
    print_error "Database setup verification failed!"
    exit 1
fi

print_success "Database setup completed successfully!"
echo ""
echo "📊 Database Information:"
echo "  - Host: $DB_HOST"
echo "  - Port: $DB_PORT"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"
echo ""
echo "🔍 Next Steps:"
echo "  1. Test the database connection: node test-db-connection.js"
echo "  2. Run the application: npm start"
echo "  3. Check health endpoint: curl http://localhost:3000/health"
echo ""
print_success "Database setup script completed!" 