#!/bin/bash

# Credit Risk System Deployment Script
# Ensures proper deployment with Docker and UV support

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Global variable for docker compose command
COMPOSE_CMD=""

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check for required tools
check_requirements() {
    print_status "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose (prefer new plugin version)
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        print_status "Using Docker Compose plugin (v2)"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        print_status "Using standalone docker-compose"
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "All requirements met."
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        
        # Generate secure passwords
        print_status "Generating secure passwords..."
        POSTGRES_PASS=$(openssl rand -hex 16)
        REDIS_PASS=$(openssl rand -hex 16)
        SECRET_KEY=$(openssl rand -hex 32)
        GRAFANA_PASS=$(openssl rand -hex 12)
        
        # Update .env with generated passwords
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/change-this-secure-password/$POSTGRES_PASS/g" .env
            sed -i '' "s/change-this-redis-password/$REDIS_PASS/g" .env
            sed -i '' "s/change-this-to-a-very-secure-secret-key-use-openssl-rand-hex-32/$SECRET_KEY/g" .env
            sed -i '' "s/change-this-grafana-password/$GRAFANA_PASS/g" .env
        else
            # Linux
            sed -i "s/change-this-secure-password/$POSTGRES_PASS/g" .env
            sed -i "s/change-this-redis-password/$REDIS_PASS/g" .env
            sed -i "s/change-this-to-a-very-secure-secret-key-use-openssl-rand-hex-32/$SECRET_KEY/g" .env
            sed -i "s/change-this-grafana-password/$GRAFANA_PASS/g" .env
        fi
        
        print_status "Generated secure passwords in .env file"
        print_warning "Please review and update .env file if needed"
    else
        print_status ".env file already exists"
    fi
    
    # Create necessary directories
    mkdir -p backend/logs
    mkdir -p monitoring/prometheus
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build with docker-compose
    $COMPOSE_CMD build --no-cache
    
    print_status "Docker images built successfully"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start core services
    $COMPOSE_CMD up -d postgres redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Start backend
    print_status "Starting backend service..."
    $COMPOSE_CMD up -d backend
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    sleep 15
    
    # Start frontend
    print_status "Starting frontend service..."
    $COMPOSE_CMD up -d frontend
    
    print_status "All services started successfully"
}

# Start monitoring (optional)
start_monitoring() {
    read -p "Do you want to start monitoring services (Prometheus & Grafana)? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting monitoring services..."
        $COMPOSE_CMD --profile monitoring up -d
        print_status "Monitoring services started"
    fi
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_status "Backend is healthy ✓"
    else
        print_error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is healthy ✓"
    else
        print_error "Frontend health check failed"
    fi
    
    # Check database
    if $COMPOSE_CMD exec -T postgres pg_isready > /dev/null 2>&1; then
        print_status "Database is healthy ✓"
    else
        print_error "Database health check failed"
    fi
    
    # Check Redis
    if $COMPOSE_CMD exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_status "Redis is healthy ✓"
    else
        print_error "Redis health check failed"
    fi
}

# Show access information
show_access_info() {
    echo
    print_status "============================================"
    print_status "Credit Risk System deployed successfully!"
    print_status "============================================"
    echo
    print_status "Access URLs:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Documentation: http://localhost:8000/docs"
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "  - Prometheus: http://localhost:9090"
        echo "  - Grafana: http://localhost:3001"
        echo
    fi
    
    print_status "Default credentials:"
    echo "  - Check .env file for database and service passwords"
    echo
    print_status "To view logs:"
    echo "  - All services: $COMPOSE_CMD logs -f"
    echo "  - Backend only: $COMPOSE_CMD logs -f backend"
    echo "  - Frontend only: $COMPOSE_CMD logs -f frontend"
    echo
    print_status "To stop services:"
    echo "  - $COMPOSE_CMD down"
    echo
    print_warning "For production deployment, please:"
    echo "  1. Update passwords in .env file"
    echo "  2. Configure SSL certificates"
    echo "  3. Set up proper firewall rules"
    echo "  4. Configure nginx reverse proxy"
}

# Main deployment flow
main() {
    print_status "Starting Credit Risk System Deployment"
    
    check_requirements
    setup_environment
    build_images
    start_services
    start_monitoring
    
    # Wait a bit for services to fully start
    print_status "Waiting for services to stabilize..."
    sleep 5
    
    health_check
    show_access_info
}

# Initialize compose command first for non-main operations
init_compose_cmd() {
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        print_error "Docker Compose is not installed."
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    stop)
        init_compose_cmd
        print_status "Stopping all services..."
        $COMPOSE_CMD down
        print_status "All services stopped"
        ;;
    restart)
        init_compose_cmd
        print_status "Restarting all services..."
        $COMPOSE_CMD restart
        print_status "All services restarted"
        ;;
    logs)
        init_compose_cmd
        $COMPOSE_CMD logs -f ${2:-}
        ;;
    clean)
        init_compose_cmd
        print_warning "This will remove all containers, volumes, and images!"
        read -p "Are you sure? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $COMPOSE_CMD down -v --rmi all
            print_status "Cleanup complete"
        fi
        ;;
    *)
        main
        ;;
esac