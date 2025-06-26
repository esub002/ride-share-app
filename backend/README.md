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
