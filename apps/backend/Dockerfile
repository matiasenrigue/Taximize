FROM node:20

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy base config from build context root
COPY tsconfig.base.json ./

# Copy package files
COPY apps/backend/package*.json ./
RUN npm install

# Copy backend source code
COPY apps/backend ./

# Build TypeScript
RUN npm run build

# Create startup script
RUN echo '#!/bin/sh\nnode dist/shared/config/setup-db.js\nnode dist/server.js' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 5000

# Run startup script
CMD ["/app/start.sh"]