# 🚀 AI-Powered URL Shortener

A highly scalable, production-ready URL shortener backend built with modern web technologies. This project features JWT authentication, Redis caching, asynchronous background jobs using BullMQ, and integrates with Google's Gemini AI to automatically analyze and categorize shortened URLs.

## 🛠️ Tech Stack

* **Framework:** NestJS (Fastify)
* **Language:** TypeScript
* **Database:** PostgreSQL (TypeORM)
* **Caching:** Redis (Key-Value & Throttler)
* **Message Queue:** BullMQ
* **AI Integration:** Google Gemini API
* **Observability:** OpenTelemetry & Jaeger
* **Containerization:** Docker & Docker Compose
* **CI/CD:** GitHub Actions
* **Testing:** Jest & Supertest (Unit & E2E)

## ✨ Features

* **JWT Authentication:** Secure user registration, login, and token refresh flow.
* **URL Shortening:** Generates unique, collision-resistant 6-character short codes.
* **AI Categorization:** Asynchronously fetches metadata from original URLs and uses Gemini AI to generate a summary and categorize the link.
* **High Performance:** Uses Fastify under the hood, heavily caches URL resolutions in Redis to minimize database hits.
* **Rate Limiting:** Protects endpoints from abuse using Redis-backed throttling.
* **Click Tracking:** Records analytics (IP, User-Agent, Referer) for every URL click via background jobs.
* **Distributed Tracing:** Fully instrumented with OpenTelemetry to trace requests across the API, Postgres, and Redis inside Jaeger.
* **Interactive Docs:** Auto-generated Swagger/OpenAPI documentation.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) and [Node.js 22](https://nodejs.org/) (with `pnpm` enabled) installed on your machine.

### 1. Environment Setup
Clone the repository and create your environment file:
```bash
cp .env.example .env
```
*Make sure to fill in your `GEMINI_API_KEY` in the `.env` file.*

### 2. Run the Infrastructure (Docker)
Start the PostgreSQL database, Redis cache, and Jaeger tracing server:
```bash
docker compose up -d postgres redis jaeger
```

### 3. Run the Application
Install dependencies and start the NestJS server:
```bash
pnpm install
pnpm run start:dev
```

*Alternatively, you can run the entire stack (API included) in Docker:*
```bash
docker compose up --build -d
```

## 📖 API Documentation

Once the server is running, you can explore and test the API using the interactive Swagger UI.

* **Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)

### Key Endpoints
* `POST /auth/register` - Create an account
* `POST /auth/login` - Authenticate and receive JWT
* `POST /urls` - Shorten a new URL (Requires Auth)
* `GET /r/:shortCode` - Redirect to the original URL

## 🧪 Testing

The project includes a comprehensive suite of Unit and E2E API tests. A dedicated test database is spun up automatically in CI/CD.

```bash
# Run unit tests
pnpm run test

# Run E2E Integration tests
pnpm run test:e2e
```

## 📈 Observability

Traces are automatically collected and sent to Jaeger. To view performance traces and database queries, open the Jaeger UI:
* **Jaeger Dashboard:** [http://localhost:16686](http://localhost:16686)
