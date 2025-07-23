#!/bin/bash

# Deployment script v2 with nginx reverse proxy

echo "Starting deployment v2 with nginx..."

# Stop any existing containers from old setup
echo "Stopping old containers..."
sudo docker compose -f docker-compose.simple.yml down 2>/dev/null || true
sudo docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build and start new containers with nginx
echo "Building and starting containers with nginx..."
sudo docker compose -f docker-compose.nginx.yml up -d --build

# Wait for services to start
echo "Waiting for services to start..."
sleep 15

# Initialize database if needed
echo "Initializing database..."
sudo docker compose -f docker-compose.nginx.yml exec -T backend sh -c '
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
sudo docker compose -f docker-compose.nginx.yml ps

echo ""
echo "Testing endpoints..."
echo "Frontend: http://137.43.49.22/"
curl -s -o /dev/null -w "Frontend status: %{http_code}\n" http://localhost/

echo "Backend API: http://137.43.49.22/api/"
curl -s -o /dev/null -w "Backend API status: %{http_code}\n" http://localhost/api/

echo ""
echo "Deployment v2 complete!"
echo "Access your application at: http://137.43.49.22/"