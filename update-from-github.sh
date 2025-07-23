#!/bin/bash

# Script to update TaxiApp from GitHub
# Run this after pulling new code from GitHub

echo "🚀 Starting TaxiApp update from GitHub..."
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 successful${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Navigate to project directory
echo -e "${YELLOW}📁 Navigating to project directory...${NC}"
cd /tmp/TaxiApp || { echo -e "${RED}Failed to navigate to /tmp/TaxiApp${NC}"; exit 1; }

# Show current branch
echo -e "${YELLOW}🌿 Current branch:${NC}"
git branch --show-current

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes from GitHub...${NC}"
git pull origin docker/try-matias
check_status "Git pull"

# Check if docker-compose files changed
if git diff HEAD@{1} --name-only | grep -E "(docker-compose|Dockerfile|nginx\.conf)" > /dev/null; then
    echo -e "${YELLOW}🔧 Docker configuration changed, rebuilding containers...${NC}"
    REBUILD="--build"
else
    echo -e "${GREEN}✓ No Docker configuration changes detected${NC}"
    REBUILD=""
fi

# Check if environment files changed
if git diff HEAD@{1} --name-only | grep -E "\.env" > /dev/null; then
    echo -e "${YELLOW}🔧 Environment files changed, containers will be recreated...${NC}"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
sudo docker compose -f docker-compose.nginx.yml stop
check_status "Container stop"

# Remove old containers to ensure env changes take effect
echo -e "${YELLOW}🗑️  Removing old containers...${NC}"
sudo docker compose -f docker-compose.nginx.yml rm -f
check_status "Container removal"

# Start containers (with rebuild if needed)
echo -e "${YELLOW}🚀 Starting containers...${NC}"
sudo docker compose -f docker-compose.nginx.yml up -d $REBUILD
check_status "Container start"

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if database schema changed and needs sync
if git diff HEAD@{1} --name-only | grep -E "(models/|entities/)" > /dev/null; then
    echo -e "${YELLOW}🗄️  Database models changed, syncing database...${NC}"
    sudo docker compose -f docker-compose.nginx.yml exec -T backend sh -c '
    cd /app/apps/backend
    node -e "
    const { sequelize } = require(\"./dist/shared/config/db\");
    const { initializeAssociations } = require(\"./dist/shared/config/associations\");

    async function syncDB() {
      try {
        console.log(\"Initializing associations...\");
        initializeAssociations();
        
        console.log(\"Syncing database...\");
        await sequelize.sync({ alter: true });
        
        console.log(\"Database synced successfully!\");
        process.exit(0);
      } catch (error) {
        console.error(\"Error syncing database:\", error);
        process.exit(1);
      }
    }

    syncDB();
    "' && echo -e "${GREEN}✓ Database sync successful${NC}" || echo -e "${YELLOW}⚠️  Database sync skipped${NC}"
fi

# Show container status
echo -e "${YELLOW}📊 Container status:${NC}"
sudo docker compose -f docker-compose.nginx.yml ps

# Test endpoints
echo -e "${YELLOW}🧪 Testing endpoints...${NC}"
echo -n "Frontend (http://137.43.49.22/): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost/ || echo "Failed"

echo -n "Backend API (http://137.43.49.22/api/): "
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost/api/auth/signin || echo "Failed"

# Show recent logs
echo -e "${YELLOW}📋 Recent logs (last 10 lines per service):${NC}"
echo "=== Nginx ==="
sudo docker compose -f docker-compose.nginx.yml logs --tail=10 nginx
echo -e "\n=== Backend ==="
sudo docker compose -f docker-compose.nginx.yml logs --tail=10 backend
echo -e "\n=== Frontend ==="
sudo docker compose -f docker-compose.nginx.yml logs --tail=10 frontend

echo -e "\n${GREEN}✅ Update complete!${NC}"
echo -e "${GREEN}🌐 Your application is available at: http://137.43.49.22/${NC}"
echo -e "\n${YELLOW}💡 Tip: To monitor logs in real-time, run:${NC}"
echo "sudo docker compose -f docker-compose.nginx.yml logs -f"