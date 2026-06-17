FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/web/package.json packages/web/package.json
COPY packages/server/package.json packages/server/package.json
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @voxmetric/web

FROM nginx:1.27-alpine AS runner
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
EXPOSE 80
