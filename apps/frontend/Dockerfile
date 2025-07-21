FROM node:20

WORKDIR /app

# copy base config
COPY tsconfig.base.json ../tsconfig.base.json

COPY apps/frontend/package*.json ./
RUN npm install

COPY apps/frontend ./
CMD ["npm","run","dev"] 