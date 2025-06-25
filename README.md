[![CI/CD](https://github.com/esub002/ride-share-app/actions/workflows/ci.yml/badge.svg)](https://github.com/esub002/ride-share-app/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-18.x-brightgreen.svg)](https://nodejs.org/)
[![Issues](https://img.shields.io/github/issues/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/commits/main)
[![Contributors](https://img.shields.io/github/contributors/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/network)
![React](https://img.shields.io/badge/frontend-React-blue)
![Express](https://img.shields.io/badge/backend-Express-green)

# Ride Share App

A full-stack real-time ride sharing platform.

## Features

- Node.js/Express backend (REST API, Socket.IO)
- PostgreSQL database (Dockerized)
- React web frontend (modern UI, real-time check-in, login/signup, phone/Google login mockups, **map page for rider/driver using Leaflet**)
- React Native app (Expo, in the `apps/driver-app/` folder, with sign-in/up screens, driver dashboard, map, and availability toggle)
- **Both web and app support:**
  - Rider and driver login/signup (phone/email mockups)
  - Rider and driver dashboards
  - Map view for both rider and driver (Leaflet for web, react-native-maps for app)
  - Driver features: availability toggle, earnings, ride requests, accept/ignore, side drawer with profile/settings/theme/support
  - Rider features: request ride, ride status, profile/settings, map view
  - Theme mode (light/dark) and support links in both apps

## Getting Started

### Prerequisites

- Node.js (18.x recommended)
- Docker Desktop
- npm
- (For app) Expo Go app

### Backend & Database

1. Start Docker Desktop.
2. In `infrastructure/` run:
   ```
   docker-compose up -d
   ```
3. Backend API: `http://localhost:3000`
4. API docs: `http://localhost:3000/api-docs`

### Web Frontend (in `frontend/`)

1. Install dependencies:
   ```
   npm install
   npm install leaflet react-leaflet
   ```
2. Start the app:
   ```
   npm start
   ```
3. Open browser at the shown port (default: `http://localhost:3000` or `http://localhost:3001`).
4. Features:
   - Real-time check-in (Socket.IO)
   - Modern login/signup UI (email, phone, Google mockup)
   - Separate driver/rider login pages
   - **Map page for rider and driver (shows current location using Leaflet/OpenStreetMap)**
   - Rider dashboard: request ride, ride status, profile/settings, map
   - Driver dashboard: availability toggle, earnings, ride requests, accept/ignore, side drawer with profile/settings/theme/support

### App (Expo/React Native, in `apps/driver-app/`)

1. Install dependencies:
   ```
   npm install
   npx expo install react-native-maps
   npx expo install @react-navigation/native @react-navigation/drawer react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context @react-native-masked-view/masked-view
   npx expo install expo-splash-screen
   npx expo install expo-router
   ```
2. Start the app:
   ```
   npx expo start
   ```
3. Scan the QR code with Expo Go on your phone.
4. Features:
   - Mobile sign-in/sign-up screens (rider and driver)
   - Rider dashboard: request ride, ride status, profile/settings, map
   - Driver dashboard: availability toggle, earnings, ride requests, accept/ignore, map (using react-native-maps)
   - Side drawer with profile, settings, theme, and support

### Configuration

- Update backend URLs in frontend/app for real device testing.
- `.env` in `backend/` should have your Postgres connection string.

### Development Notes

- Phone/Google login are UI mockups. Integrate with a real provider (Firebase, Twilio, etc.) for production.
- Use `test-socket-client.js` for backend Socket.IO testing.
- **Web map uses Leaflet and OpenStreetMap. App map uses react-native-maps.**
- All features are available for both rider and driver in both web and app.

## License

MIT