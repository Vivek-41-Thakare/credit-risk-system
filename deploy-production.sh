#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Credit Risk System Production Deployment Script${NC}"
echo "================================================"

DOMAIN="${DOMAIN:-crs.shaily.dev}"
EMAIL="${EMAIL:-}"

if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.production to .env and update with your values"
    exit 1
fi

source .env

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Error: EMAIL not set in .env file!${NC}"
    echo "Please set your email for Let's Encrypt notifications"
    exit 1
fi

check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed!${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}All dependencies installed${NC}"
}

generate_secrets() {
    if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "your_very_long_random_secret_key_here" ]; then
        echo -e "${YELLOW}Generating SECRET_KEY...${NC}"
        SECRET_KEY=$(openssl rand -hex 32)
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
        echo -e "${GREEN}SECRET_KEY generated and saved to .env${NC}"
    fi
}

setup_ssl() {
    echo -e "${YELLOW}Setting up SSL certificates...${NC}"
    
    mkdir -p certbot/conf certbot/www
    
    if [ ! -d "certbot/conf/live/$DOMAIN" ]; then
        echo -e "${YELLOW}Obtaining initial SSL certificate...${NC}"
        
        echo -e "${YELLOW}Starting nginx for ACME challenge...${NC}"
        docker-compose -f docker-compose.production.yml up -d nginx
        
        sleep 5
        
        echo -e "${YELLOW}Requesting certificate from Let's Encrypt...${NC}"
        docker run --rm \
            -v $(pwd)/certbot/conf:/etc/letsencrypt \
            -v $(pwd)/certbot/www:/var/www/certbot \
            certbot/certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            --force-renewal \
            -d $DOMAIN
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}SSL certificate obtained successfully!${NC}"
        else
            echo -e "${RED}Failed to obtain SSL certificate${NC}"
            echo "Make sure your domain points to this server and ports 80/443 are open"
            exit 1
        fi
    else
        echo -e "${GREEN}SSL certificates already exist${NC}"
    fi
}

build_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose -f docker-compose.production.yml build --no-cache
    echo -e "${GREEN}Images built successfully${NC}"
}

deploy() {
    echo -e "${YELLOW}Starting production deployment...${NC}"
    
    echo -e "${YELLOW}Stopping existing containers...${NC}"
    docker-compose -f docker-compose.production.yml down
    
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose -f docker-compose.production.yml up -d
    
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 30
    
    echo -e "${YELLOW}Checking service health...${NC}"
    docker-compose -f docker-compose.production.yml ps
    
    if docker-compose -f docker-compose.production.yml exec backend curl -f http://localhost:8000/health &>/dev/null; then
        echo -e "${GREEN}Backend is healthy${NC}"
    else
        echo -e "${RED}Backend health check failed${NC}"
        docker-compose -f docker-compose.production.yml logs backend
    fi
    
    if curl -f https://$DOMAIN &>/dev/null; then
        echo -e "${GREEN}Site is accessible at https://$DOMAIN${NC}"
    else
        echo -e "${YELLOW}Site may take a moment to be fully accessible${NC}"
    fi
}

setup_cron() {
    echo -e "${YELLOW}Setting up automatic SSL renewal...${NC}"
    
    CRON_JOB="0 0,12 * * * cd $(pwd) && docker-compose -f docker-compose.production.yml run --rm certbot renew && docker-compose -f docker-compose.production.yml exec nginx nginx -s reload >> /var/log/cron.log 2>&1"
    
    (crontab -l 2>/dev/null | grep -v "certbot renew" ; echo "$CRON_JOB") | crontab -
    
    echo -e "${GREEN}Automatic SSL renewal configured${NC}"
}

create_admin() {
    echo -e "${YELLOW}Would you like to create an admin user? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Enter admin username:"
        read -r admin_username
        echo "Enter admin email:"
        read -r admin_email
        echo "Enter admin password:"
        read -rs admin_password
        echo
        
        docker-compose -f docker-compose.production.yml exec backend python -c "
from app.database import get_db
from app.models import User
from app.auth import get_password_hash
from sqlalchemy.orm import Session
import sys

db = next(get_db())
try:
    user = User(
        username='$admin_username',
        email='$admin_email',
        hashed_password=get_password_hash('$admin_password'),
        is_active=True,
        is_admin=True
    )
    db.add(user)
    db.commit()
    print('Admin user created successfully')
except Exception as e:
    print(f'Error creating admin user: {e}')
    sys.exit(1)
"
        echo -e "${GREEN}Admin user created${NC}"
    fi
}

print_status() {
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Deployment Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    echo -e "Your Credit Risk System is now running at:"
    echo -e "${GREEN}https://$DOMAIN${NC}"
    echo
    echo -e "Services:"
    echo -e "  • Frontend: ${GREEN}https://$DOMAIN${NC}"
    echo -e "  • API: ${GREEN}https://$DOMAIN/api${NC}"
    echo -e "  • Health: ${GREEN}https://$DOMAIN/health${NC}"
    echo
    echo -e "Management commands:"
    echo -e "  • View logs: ${YELLOW}docker-compose -f docker-compose.production.yml logs -f [service]${NC}"
    echo -e "  • Restart: ${YELLOW}docker-compose -f docker-compose.production.yml restart${NC}"
    echo -e "  • Stop: ${YELLOW}docker-compose -f docker-compose.production.yml down${NC}"
    echo -e "  • Update: ${YELLOW}git pull && ./deploy-production.sh${NC}"
    echo
    echo -e "SSL certificate will auto-renew via cron job"
}

main() {
    check_dependencies
    generate_secrets
    setup_ssl
    build_images
    deploy
    setup_cron
    create_admin
    print_status
}

case "${1:-}" in
    update)
        echo -e "${YELLOW}Updating deployment...${NC}"
        build_images
        deploy
        print_status
        ;;
    ssl)
        setup_ssl
        ;;
    restart)
        echo -e "${YELLOW}Restarting services...${NC}"
        docker-compose -f docker-compose.production.yml restart
        ;;
    stop)
        echo -e "${YELLOW}Stopping services...${NC}"
        docker-compose -f docker-compose.production.yml down
        ;;
    logs)
        docker-compose -f docker-compose.production.yml logs -f ${2:-}
        ;;
    *)
        main
        ;;
esac