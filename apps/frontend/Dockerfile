# Stage 1: Build
FROM node:20 as builder

WORKDIR /app

COPY tsconfig.base.json ../../tsconfig.base.json
COPY apps/frontend/package*.json ./


RUN npm install

COPY apps/frontend/ ./

#RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:stable-alpine

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 3000
CMD ["npm", "run", "dev"]
