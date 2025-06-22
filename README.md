# Ride Share App

A full-stack real-time ride sharing platform with:
- Node.js/Express backend (with Socket.IO and REST APIs)
- PostgreSQL database (Dockerized)
- React web frontend (modern UI, real-time check-in, login/signup, phone/Google login mockups, **map page for rider/driver**)
- React Native mobile app (Expo, with sign-in/up screens)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [npm](https://www.npmjs.com/)
- (For mobile) [Expo Go app](https://expo.dev/expo-go)

### Backend & Database
1. Start Docker Desktop.
2. In `infrastructure/` run:
   ```
   docker-compose up -d
   ```
3. The backend API will be at `http://localhost:3000`.
4. API docs: `http://localhost:3000/api-docs`

### Web Frontend
1. In `frontend/` run:
   ```
   npm install
   npm install leaflet react-leaflet
   npm start
   ```
2. Open the browser at the port shown (default: `http://localhost:3000` or `http://localhost:3001`).
3. Features:
   - Real-time check-in (Socket.IO)
   - Modern login/signup UI (email, phone, Google mockup)
   - Separate driver/rider login pages
   - **Map page for rider and driver (shows current location using Leaflet/OpenStreetMap)**

### Mobile App (Expo/React Native)
1. In `mobile/` run:
   ```
   npm install
   npx expo start
   ```
2. Scan the QR code with Expo Go on your phone.
3. Features:
   - Mobile sign-in/sign-up screens
   - Real-time check-in screen

### Configuration
- Update backend URLs in frontend/mobile to match your computer's IP for real device testing.
- `.env` in `backend/` should have your Postgres connection string.

### Development Notes
- Phone/Google login are UI mockups. Integrate with a real provider (Firebase, Twilio, etc.) for production.
- Use the test-socket-client.js for backend Socket.IO testing.
- **Map page uses Leaflet and OpenStreetMap.**

## License
MIT