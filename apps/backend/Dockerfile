# Stage 1: Build
FROM node:20 as builder

WORKDIR /app

COPY tsconfig.base.json ../../tsconfig.base.json
COPY apps/backend/package*.json ./ 
COPY apps/backend/tsconfig.json ./ 
COPY apps/backend/src ./src

RUN npm install
RUN npm run build

# Stage 2: Run
FROM node:20

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY apps/backend/package*.json ./

EXPOSE 8000
CMD ["node", "dist/server.js"]
