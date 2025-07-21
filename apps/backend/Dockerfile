FROM node:18

WORKDIR /app

# copy base config
COPY tsconfig.base.json ../tsconfig.base.json

COPY apps/backend/package*.json ./
RUN npm install

COPY apps/backend ./
CMD ["npx", "ts-node", "src/server.ts"]