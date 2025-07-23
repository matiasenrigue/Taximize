#!/bin/bash

# Simple deployment script for the server

echo "Starting deployment..."

# Stop any existing containers
sudo docker compose -f docker-compose.simple.yml down

# Build and start new containers
sudo docker compose -f docker-compose.simple.yml up -d --build

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Run database setup
echo "Setting up database..."
sudo docker compose -f docker-compose.simple.yml exec -T backend npm run create-db || true

# Check status
echo "Deployment status:"
sudo docker compose -f docker-compose.simple.yml ps

echo "Deployment complete!"