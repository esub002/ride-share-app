# 🚦 Ride Share App Backend

A Node.js/Express backend for the Ride Share platform, providing RESTful APIs, real-time communication, and robust safety features for drivers and riders.

---

## 📦 Stack
- **Node.js** + **Express**
- **PostgreSQL** (via `pg`)
- **Socket.IO** (real-time events)
- **JWT Authentication**
- **Swagger** (API docs)
- **Helmet, CORS, Rate Limiting** (security)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- PostgreSQL

### Setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in DB, JWT, etc.
3. **Database setup**
   - Ensure PostgreSQL is running
   - Run migrations:
     ```bash
     psql < schema.sql
     psql < safety-schema.sql
     ```
4. **Start the server**
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:3000`.

---

## 🗄️ Database Schema
- **schema.sql**: Core tables (users, drivers, rides, etc.)
- **safety-schema.sql**: Safety features (emergency contacts, safety settings, incident reports, emergency alerts, communication history, location/trip sharing, voice command logs, safety metrics, driver verification)

---

## 🛡️ Safety Features (Backend Integration)

All safety features are fully integrated with the backend via REST APIs and real-time events:

- **Emergency Contacts**: CRUD via `/api/drivers/:id/emergency-contacts`
- **Safety Settings**: Get/update via `/api/drivers/:id/safety-settings`
- **Incident Reports**: Create/list via `/api/drivers/:id/incident-reports`
- **Emergency Alerts**: Trigger/respond via `/api/drivers/:id/emergency-alerts`
- **Location/Trip Sharing**: `/api/drivers/:id/share-location`, `/api/drivers/:id/share-trip`
- **Voice Commands Log**: `/api/drivers/:id/voice-commands`
- **Communication History**: `/api/drivers/:id/communication-history`
- **Safety Metrics**: `/api/drivers/:id/safety-metrics`
- **Driver Verification**: `/api/drivers/:id/verification-status`

All endpoints require JWT authentication.

---

## 🔌 Real-time Events (Socket.IO)

- **Emergency Alerts**: When a driver triggers an emergency alert, a real-time event (`emergency:alert`) is broadcast to admins and emergency contacts.
- **Location Updates**: Driver location is updated in real time and can be subscribed to by relevant clients.
- **Incident Reports**: Can trigger real-time notifications for admins.

---

## 🔑 Security
- All endpoints require JWT authentication (user or driver roles)
- Rate limiting and CORS are enforced
- Sensitive actions are validated and sanitized
- Real-time events are only available to authenticated users

---

## 📖 API Documentation
- Swagger docs are available at `/api-docs` when the server is running
- To update the Swagger spec, run the backend and export from `/api-docs`

---

## 🧪 Testing
- Run tests with:
  ```bash
  npm test
  ```
- Test files are in `__tests__/` and `tests/`

---

## 📝 Contributing
- Please open issues and pull requests for improvements or bug fixes

---

## 📂 Project Structure
```
backend/
├── routes/           # API route handlers (drivers, rides, safety, etc.)
├── src/              # Controllers, models, services
├── utils/            # Utility functions (email, logging, etc.)
├── middleware/       # Auth, error handling, etc.
├── __tests__/        # Unit and integration tests
├── tests/            # E2E and scenario tests
├── schema.sql        # Core DB schema
├── safety-schema.sql # Safety features DB schema
├── server.js         # Main Express/Socket.IO app
└── ...
```

---

## 📚 API Endpoints Overview

| Route File         | Main Endpoints (examples)                |
|--------------------|------------------------------------------|
| admin.js           | /api/admin/* (admin actions, stats)      |
| analytics.js       | /api/analytics/* (analytics, metrics)    |
| authDriver.js      | /api/drivers/login, /api/drivers/verify-otp, /api/drivers/logout |
| authUser.js        | /api/users/login, /api/users/verify-otp, /api/users/logout |
| driver.js          | /api/drivers/* (profile, earnings, safety, etc.) |
| performance.js     | /api/performance/* (performance metrics) |
| ride.js            | /api/rides/* (ride requests, status, chat) |
| safety.js          | /api/safety/* (emergency, contacts, settings) |
| user.js            | /api/users/* (profile, rides, etc.)      |

---

## 🧪 Running Tests & Using Mock Data

- **Run all tests:**
  ```bash
  npm test
  ```
- **Test files:** Located in `__tests__/` and `tests/`.
- **Mock data:** The backend can run with mock data for development/testing. See `README.md` or scripts for details.
- **Test endpoints:** Use Postman or the provided Postman collection for API testing.

---

## 🗄️ Database Migration Quickstart

1. Ensure PostgreSQL is running and accessible.
2. Run the main schema:
   ```bash
   psql < schema.sql
   ```
3. Run the safety schema for all safety features:
   ```bash
   psql < safety-schema.sql
   ```
4. (Optional) Use migration scripts in `scripts/` for advanced migrations.

---

## 🕒 Background Jobs & Monitoring

- **Background jobs:**
  - Located in `workers/` (analytics, email, payment, etc.)
  - Run automatically or can be triggered via scripts.
- **Monitoring:**
  - Integrated with Prometheus, Fluentd, and ElastAlert (see `monitoring/`)
  - Logs and metrics are available for debugging and performance tracking.
- **Admin endpoints:**
  - Use `/api/admin/*` for admin/monitoring actions.

---

## 🛠️ Troubleshooting

- **Port in use:**
  - Make sure no other process is using port 3000 (or your configured port).
- **Database connection errors:**
  - Check your `.env` DB settings and ensure PostgreSQL is running.
- **JWT/auth errors:**
  - Ensure your JWT secret is set and tokens are valid.
- **CORS issues:**
  - CORS is enabled by default, but check your frontend URL in `.env` if you have issues.
- **Socket.IO issues:**
  - Make sure your client is connecting to the correct backend URL and port.
- **General:**
  - Check logs in the console or `logs/` directory for more details.

---

## 📝 License