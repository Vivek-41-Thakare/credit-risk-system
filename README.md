# Credit Risk System (CRS)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![React](https://img.shields.io/badge/react-18.2-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-green.svg)

## Overview

CRS scores credit risk with a scikit-learn model behind a FastAPI service and a React UI. It was the final project for a data mining course, then built out to run as a real deployment. You send applicant features, you get back a risk score and the inputs that drove it.

## Features

### Core Functionality
- Credit scoring from a trained scikit-learn model
- Prediction in one request, with the contributing features returned
- Prediction history you can query and chart over time
- API keys with rate limiting and authentication
- Role-based access, including an admin role

### Technical Features
- A documented REST API for integration
- Redis caching in front of the prediction path
- PostgreSQL for persistence
- Runs under Docker Compose
- HTTPS via Let's Encrypt and Certbot
- Optional Prometheus and Grafana for monitoring

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ML Library**: Scikit-learn
- **Package Manager**: UV (Ultra-fast Python package manager)

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI)
- **HTTP Client**: Axios
- **Build Tool**: Create React App

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **SSL**: Let's Encrypt with Certbot
- **Monitoring**: Prometheus & Grafana (optional)

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Python 3.11+ (for local development)
- Node.js 20+ (for frontend development)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/SHAILY24/credit-risk-system.git
cd credit-risk-system
```

2. **Set up environment variables**
```bash
cp .env.production .env
# Edit .env with your configuration
```

3. **Start with Docker Compose**
```bash
docker compose up -d
```

4. **Access the application**
- Frontend: http://localhost:13960
- API Documentation: http://localhost:13960/api/docs
- Health Check: http://localhost:13960/health

## Live Demo

Live application: https://crs.shaily.dev

### Demo Credentials
- Username: `admin`
- Password: `AdminCRS2024!@#`
- Full admin privileges

Log in with those and poke around. The demo resets periodically.

## Development Setup

### Backend Development
```bash
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv sync
uvicorn app.main:app --reload --port 8000
```

### Frontend Development
```bash
cd frontend
yarn install
yarn start
```

### Database Setup
```bash
# Run migrations
docker compose exec backend python -m app.database

# Create admin user
docker compose exec backend python create_admin.py
```

## Production Deployment

### Using the Deployment Script
```bash
./deploy-production.sh
```

This script will:
- Check dependencies
- Generate secure secrets
- Obtain SSL certificates
- Build and deploy all services
- Set up automatic SSL renewal
- Create an admin user (optional)

### Manual Deployment

1. **Configure DNS**: Point your domain to your server
2. **Set environment variables**: Update `.env` with production values
3. **Run deployment**: `docker compose -f docker-compose.production.yml up -d`
4. **Set up SSL**: Run `./setup-host-nginx.sh` for nginx and SSL configuration

## API Documentation

### Authentication
The API uses JWT tokens for authentication. Obtain a token by logging in:

```bash
curl -X POST "https://crs.shaily.dev/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'
```

### Key Endpoints

- `POST /api/v1/auth/register` registers a user
- `POST /api/v1/auth/login` logs in
- `GET /api/v1/auth/me` returns the current user
- `POST /api/v1/predict` makes a credit risk prediction
- `GET /api/v1/predictions` returns prediction history
- `GET /api/v1/api-keys` manages API keys

Full API documentation available at `/api/docs` when running the application.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `SECRET_KEY` | JWT secret key | Auto-generated |
| `DEBUG` | Debug mode | false |
| `LOG_LEVEL` | Logging level | INFO |
| `CORS_ORIGINS` | Allowed CORS origins | http://localhost:3000 |

### Model Configuration

The credit risk model parameters are configured in `backend/model_info.json`:
- Feature definitions
- Risk thresholds
- Model metadata

## Monitoring

### Enable Monitoring Stack
```bash
docker compose --profile monitoring up -d
```

Access monitoring dashboards:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
yarn test
```

### End-to-End Tests
```bash
# Test API endpoints
./test_backend.py

# Test model predictions
./test_features.py
```

## Security

- JWT authentication with secure token handling
- Rate limiting on the API to slow down abuse
- Input validation and sanitization on request bodies
- HTTPS for all production traffic
- CORS policies set per origin
- Secrets read from the environment, not committed

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/SHAILY24/credit-risk-system/issues)
- Contact: admin@shaily.dev
- Documentation: [docs/](docs/)
- Live Demo: https://crs.shaily.dev

## Acknowledgments

Thanks to the FastAPI and React projects, and to anyone who tested this.

Built by [Shaily](https://github.com/SHAILY24).

## Repository

- GitHub: https://github.com/SHAILY24/credit-risk-system
- Live Demo: https://crs.shaily.dev
- License: MIT