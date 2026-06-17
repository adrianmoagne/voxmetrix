# VoxMetric

VoxMetric is an experiment platform with a React/Vite web app and an Express/Mongoose API.

This repository is the open-source monorepo version intended for reproducible local development and publication. It uses local MongoDB and local disk media storage by default, so it does not require MongoDB Atlas or Cloudinary credentials.

## Repository Structure

```text
packages/
	web/      React/Vite frontend
	server/   Express/Mongoose API
docker-compose.yml
```

## Docker Local Run

Run the full local stack with Docker:

```bash
docker compose up --build
```

Then open `http://localhost:3001`. The API is available at `http://localhost:8080`, and MongoDB is local to the Compose project.

Stop the stack with:

```bash
docker compose down
```

## Local Development

Install dependencies from the repository root:

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env
```

Start MongoDB locally:

```bash
docker compose up -d mongo
```

Run the API and web app on the host:

```bash
npm run dev
```

The web app runs on `http://localhost:3001`. The API defaults to `http://localhost:8080`, with routes under `/api`.

Uploaded media is stored locally under `packages/server/data/uploads` when running the server on the host. Dockerized server uploads are stored in the `uploads_data` Docker volume.

## Dockerized API

To run only MongoDB and the API in Docker, then run the web app on the host:

```bash
docker compose up -d mongo server
npm run dev:web
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
```

