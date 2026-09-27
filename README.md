# StatusPulse - Enterprise Incident Management & Service Health Monitoring SaaS Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-cyan)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://www.docker.com/)

**StatusPulse** is a production-grade, full-stack enterprise SaaS platform for real-time service health monitoring, automated HTTP pings, incident management, latency analytics, and public status pages.

Built using the **MERN** stack (MongoDB, Express, React, Node.js) with **TypeScript**, **BullMQ (Redis queue)**, **Socket.io**, **Recharts**, **TailwindCSS**, and **Stripe Integration**.

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    Client["Vite + React 18 Client (TypeScript + Tailwind)"]
    ExpressAPI["Express API Server (Node.js + TS)"]
    SocketGateway["Socket.io Real-Time Gateway"]
    BullMQWorker["BullMQ Worker (Redis Queue)"]
    MongoDB[("MongoDB (Mongoose ODM)")]
    Redis[("Redis Memory Store")]
    StripeSDK["Stripe Billing SDK & Webhook Handler"]

    Client <-->|REST API + HTTP Cookies| ExpressAPI
    Client <-->|WebSockets (ws://)| SocketGateway
    ExpressAPI --> MongoDB
    ExpressAPI --> StripeSDK
    ExpressAPI -->|Add Ping Jobs| BullMQWorker
    BullMQWorker <--> Redis
    BullMQWorker -->|Ping HTTP Endpoints| ExternalService["External APIs & Microservices"]
    BullMQWorker -->|Log Latency| MongoDB
    BullMQWorker -->|Emit Real-Time Events| SocketGateway
```

---

## ⚡ Key Features & Engineering Highlights

- **Automated Health Checker (BullMQ + Redis):**
  - Distributed background queue that executes periodic HTTP GET/PING checks (every 10s–3600s).
  - Automatically logs response latency into `HealthCheckLog` time-series schema.
  - Updates service status (`OPERATIONAL`, `DEGRADED`, `DOWN`) and emits real-time WebSocket notifications upon status transition.
- **Real-Time Engine (Socket.io):**
  - Room-based subscriptions (`org_{organizationId}` and `public_{slug}`).
  - Live broadcast of `SERVICE_STATUS_CHANGED`, `NEW_INCIDENT_CREATED`, `INCIDENT_UPDATED`, and `LATENCY_METRIC_UPDATED` events without manual page refreshes.
- **MongoDB Aggregation Pipeline Engine:**
  - High-performance 30-day uptime calculation: `(totalSuccessfulChecks / totalChecks) * 100`.
  - 24-hour response latency trend aggregation grouped by hour (`avgResponseTimeMs`).
  - Mean Time To Recovery (MTTR) analytics for incident resolution lifecycles.
- **Role-Based Access Control (RBAC):**
  - 3 User Roles: `Admin`, `Engineer`, and `Viewer`.
  - Middleware enforcing authorization boundaries across REST routes.
- **Security & Authentication:**
  - JWT Access Tokens (15m) & Refresh Tokens (7d) stored in HTTP-Only, SameSite cookies.
  - Request body validation using **Zod** schemas.
  - Security headers via **Helmet**, rate limiting via **express-rate-limit**, and CORS domain whitelisting.
- **Stripe Billing Integration:**
  - Support for `FREE`, `PRO` ($29/mo), and `ENTERPRISE` ($99/mo) plans.
  - Stripe Checkout Session creation and `/api/v1/webhooks/stripe` raw body signature verification.
- **Public Status Page (`/status/:orgSlug`):**
  - Unauthenticated, lightweight status page showing system status banner, service health list, and incident timeline.

---

## 📂 Monorepo Directory Structure

```
StatusPulse/
├── docker-compose.yml             # Docker orchestration (Node, MongoDB, Redis, Nginx)
├── README.md                      # Comprehensive Architecture & Setup Guide
├── .github/workflows/ci-cd.yml    # GitHub Actions CI/CD Pipeline
├── client/                        # React 18 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── api/                   # Axios client with auto cookie refresh interceptors
│   │   ├── components/            # Shadcn UI buttons, modals, cards, badges, charts
│   │   ├── context/               # AuthContext & SocketContext
│   │   ├── pages/                 # Login, Register, Dashboard, Services, Incidents, Settings, PublicStatusPage
│   │   ├── store/                 # Zustand global status state
│   │   └── types/                 # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
└── server/                        # Node.js + Express + TypeScript Backend
    ├── src/
    │   ├── config/                # DB, Redis, Env, Stripe SDK
    │   ├── controllers/           # Auth, Service, Incident, Metrics, Subscription, StatusPage
    │   ├── middleware/            # Auth, RBAC, Zod Validate, Rate Limiting, Error Handling
    │   ├── models/                # Organization, User, MonitoredService, HealthCheckLog, Incident, Subscription
    │   ├── queues/                # BullMQ Health Check Queue & Worker
    │   ├── routes/                # Express API V1 Routes & Stripe Raw Webhook
    │   ├── schemas/               # Zod validation schemas
    │   ├── services/              # Pinger service & MongoDB Aggregation metrics
    │   └── sockets/               # Socket.io gateway implementation
    ├── tests/                     # Jest + Supertest integration tests
    └── Dockerfile
```

---

## 🛠️ Local Development Quickstart

### Prerequisites
- Node.js (v18+ or v20+)
- MongoDB running locally or on port 27017
- Redis running locally on port 6379

### 1. Environment Setup

Copy `.env.example` in `server/`:
```bash
cd server
cp .env.example .env
```

### 2. Install & Run Server

```bash
cd server
npm install
npm run dev
```
The Express server will start on `http://localhost:5000`.

### 3. Install & Run Client

```bash
cd client
npm install
npm run dev
```
The Vite React client will start on `http://localhost:5173`.

---

## 🐳 Docker Compose Setup

Run the entire platform (Node API, React Client, MongoDB, Redis) with a single command:

```bash
docker-compose up --build
```

- **Client App:** `http://localhost:5173`
- **Server API:** `http://localhost:5000/health`
- **MongoDB:** `localhost:27017`
- **Redis:** `localhost:6379`

---

## 🧪 Integration Testing

Run Jest + Supertest suite:

```bash
cd server
npm test
```

---

## 🔗 API Endpoint Matrix

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register Organization & Admin user |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & set HTTP-Only cookies |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh expired access token |
| `GET` | `/api/v1/auth/me` | Authenticated | Get current authenticated user details |
| `GET` | `/api/v1/services` | Authenticated | List organization's monitored endpoints |
| `POST` | `/api/v1/services` | Admin, Engineer | Add new service & schedule BullMQ ping |
| `POST` | `/api/v1/services/:id/check` | Admin, Engineer | Trigger immediate manual health ping |
| `DELETE` | `/api/v1/services/:id` | Admin | Delete service & remove BullMQ job |
| `GET` | `/api/v1/incidents` | Authenticated | Fetch organization incident audit log |
| `POST` | `/api/v1/incidents` | Admin, Engineer | Create incident & emit WebSocket alert |
| `PATCH` | `/api/v1/incidents/:id/status` | Admin, Engineer | Update incident lifecycle status |
| `GET` | `/api/v1/metrics/overview` | Authenticated | Get 30d uptime, MTTR, & 24h latency trend |
| `POST` | `/api/v1/subscriptions/checkout`| Admin | Create Stripe Subscription Checkout Session |
| `POST` | `/api/v1/webhooks/stripe` | Raw Body | Handle Stripe webhook subscription events |
| `GET` | `/api/v1/status/:slug` | Public | Unauthenticated public status page data |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
