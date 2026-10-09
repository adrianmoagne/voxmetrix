FROM node:22-alpine AS deps
WORKDIR /app
# The lockfile pins every dependency, so each deploy installs the same versions.
COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/package.json
COPY packages/web/package.json packages/web/package.json
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @voxmetrix/server

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
