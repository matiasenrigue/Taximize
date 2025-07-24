# 🚀 TaxiApp Deployment Implementation

## Architecture Implementation

```
User Request (Port 80)
         ↓
[Nginx Reverse Proxy Container]
         ├─→ / (Frontend requests) → [Next.js Container :3000]
         └─→ /api/* (API requests) → [Express Backend Container :5000]
                                              ↓
                                     [PostgreSQL Container]
                                     [Redis Container :6379]
                                     [ML API Container :5050]
```

### Key Components

1. **Nginx Reverse Proxy** (`nginx.conf`)
   - Routes all traffic through port 80
   - Path-based routing to different services
   - Handles CORS and proxy headers

2. **Docker Compose Orchestration** (`docker-compose.nginx.yml`)
   - 6 containers: nginx, frontend, backend, database, redis, ml-api
   - Custom bridge network for inter-container communication
   - Named volumes for data persistence

3. **Deployment Script** (`deploy-v2.sh`)
   - Automated deployment with sudo password handling
   - Database initialization on first run
   - Docker image cleanup to prevent disk space issues

## Implementation Details

### Monorepo Structure
```
TaxiApp/
├── apps/
│   ├── backend/         # Express.js API
│   │   ├── Dockerfile.simple
│   │   └── .env.production
│   └── frontend/        # Next.js app
│       ├── Dockerfile.simple
│       └── .env.production
├── data/                # ML API
│   └── Dockerfile.production
├── packages/shared/     # Shared TypeScript types
├── docker-compose.nginx.yml
├── nginx.conf
└── deploy-v2.sh
```

## Deployment Workflow

1. **Code Push** triggers deployment
2. **Git Pull** latest changes on server
3. **Docker Build** creates new images with code changes
4. **Container Replacement** stops old, starts new containers
5. **Database Sync** runs Sequelize migrations if needed
6. **Health Check** verifies endpoints are responding
7. **Cleanup** removes old Docker images

### Security Considerations

- Passwords passed via environment variables
- No secrets in Docker images
- Database not exposed externally
- Sudo password handling for automated deployment
