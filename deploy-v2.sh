#!/bin/bash

# Deployment script v2 with nginx reverse proxy

# Check if SUDO_PASSWORD is provided
if [ -z "$SUDO_PASSWORD" ]; then
    echo "Warning: SUDO_PASSWORD not set. Using sudo without password."
    SUDO_CMD="sudo"
else
    SUDO_CMD="echo $SUDO_PASSWORD | sudo -S"
fi

echo "Starting deployment v2 with nginx..."

# Stop any existing containers from old setup
echo "Stopping old containers..."
eval $SUDO_CMD docker compose -f docker-compose.simple.yml down 2>/dev/null || true
eval $SUDO_CMD docker compose -f docker-compose.prod.yml down 2>/dev/null || true
eval $SUDO_CMD docker compose -f docker-compose.nginx.yml down 2>/dev/null || true

# Remove old images to ensure fresh builds
echo "Removing old images..."
eval $SUDO_CMD docker rmi $(eval $SUDO_CMD docker images -q summer_project-ml-api) 2>/dev/null || true
eval $SUDO_CMD docker rmi $(eval $SUDO_CMD docker images -q summer_project-backend) 2>/dev/null || true
eval $SUDO_CMD docker rmi $(eval $SUDO_CMD docker images -q summer_project-frontend) 2>/dev/null || true

# Build and start new containers with nginx
echo "Building and starting containers with nginx..."
# Force rebuild without cache to ensure latest code changes are included
eval $SUDO_CMD docker compose -f docker-compose.nginx.yml build --no-cache
eval $SUDO_CMD docker compose -f docker-compose.nginx.yml up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 15

# Initialize database if needed
echo "Initializing database..."
eval $SUDO_CMD docker compose -f docker-compose.nginx.yml exec -T backend sh -c '
cd /app/apps/backend
node -e "
const { sequelize } = require(\"./dist/shared/config/db\");
const { initializeAssociations } = require(\"./dist/shared/config/associations\");

async function initDB() {
  try {
    console.log(\"Initializing associations...\");
    initializeAssociations();
    
    console.log(\"Syncing database...\");
    await sequelize.sync({ force: false });
    
    console.log(\"Database synced successfully!\");
    process.exit(0);
  } catch (error) {
    console.error(\"Error syncing database:\", error);
    process.exit(1);
  }
}

initDB();
"' || echo "Database initialization skipped (might already exist)"

# Check deployment status
echo ""
echo "Deployment status:"
eval $SUDO_CMD docker compose -f docker-compose.nginx.yml ps

echo ""
echo "Testing endpoints..."
echo "Frontend: http://137.43.49.22/"
curl -s -o /dev/null -w "Frontend status: %{http_code}\n" http://localhost/

echo "Backend API: http://137.43.49.22/api/"
curl -s -o /dev/null -w "Backend API status: %{http_code}\n" http://localhost/api/

echo ""
echo "Deployment v2 complete!"
echo "Access your application at: http://137.43.49.22/"

# Show container build times to verify fresh builds
echo ""
echo "Container build times (to verify fresh builds):"
eval $SUDO_CMD docker ps --format "table {{.Names}}\t{{.CreatedAt}}"

# Clean up old Docker images to save space
echo ""
echo "Cleaning up old Docker images..."
# Remove only truly unused volumes (not the postgres_data volume which is in use)
eval $SUDO_CMD docker system prune -f
# Remove old images to free up space
eval $SUDO_CMD docker image prune -a -f --filter "until=24h"