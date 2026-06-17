FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY packages/server/package.json packages/server/package.json
COPY packages/web/package.json packages/web/package.json
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @voxmetric/server

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY packages/server/package.json packages/server/package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/server/dist packages/server/dist
WORKDIR /app/packages/server
EXPOSE 8080
CMD ["npm", "run", "start"]
