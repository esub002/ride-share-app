# 🚗 Driver App - Ride Share Platform

A comprehensive React Native driver application built with Expo, featuring advanced ride management, earnings tracking, safety features, and real-time communication.

## 📱 Features Overview

### 🏠 **Home Dashboard**
- **Real-time availability toggle** - Go online/offline instantly
- **Live map integration** with current location tracking
- **Earnings overview** - Today's earnings at a glance
- **Quick ride acceptance** - One-tap ride request handling
- **Current ride management** - Active ride status and completion

### 💰 **Earnings & Finance**
- **Multi-period earnings reports** - Daily, weekly, monthly views
- **Payment method management** - Bank accounts and cards
- **Transaction history** - Detailed ride and tip records
- **Tax document access** - Download tax documents
- **Tips management** - Track and view tip history
- **Earnings sharing** - Share reports with others

### 🛡️ **Safety & Communication**
- **Emergency SOS button** - Instant emergency alert system (fully backend-integrated)
- **Trip status/location sharing** - Share location with emergency contacts (backend-driven)
- **Voice commands** - Hands-free operation support (logs to backend)
- **Driver verification** - Document upload and status tracking (backend-driven)
- **Emergency contacts** - Manage trusted contacts (CRUD via backend)
- **Safety settings** - Auto-share location and preferences (backend-driven)
- **Incident reporting** - File and track incidents (backend-driven)
- **Real-time alerts** - Emergency events broadcast via WebSocket

### 🚘 **Ride Management**
- **Real-time ride requests** - Live incoming ride notifications
- **One-tap acceptance** - Quick ride acceptance/rejection
- **Navigation integration** - Built-in navigation support
- **Ride status tracking** - Complete ride lifecycle management
- **Customer communication** - In-app messaging with riders

### 👤 **Profile & Settings**
- **Driver profile** - Personal and vehicle information
- **Trip history** - Complete ride history with details
- **Wallet management** - Payment and withdrawal tracking
- **Theme customization** - Light/dark mode support
- **App settings** - Preferences and configurations

## 🛠️ Technical Stack

### **Frontend**
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **React Navigation** - Navigation and routing
- **Expo Vector Icons** - Icon library
- **React Native Maps** - Map integration

### **Backend Integration**
- **RESTful APIs** - Complete backend integration
- **JWT Authentication** - Secure token-based auth
- **Real-time updates** - WebSocket support
- **Push notifications** - Real-time alerts
- **Backend Safety Integration**:
  - All safety features (emergency contacts, safety settings, incident reports, emergency alerts, communication history, location/trip sharing, voice command logs, safety metrics, driver verification) are now fully integrated with backend REST APIs and real-time events.
  - See `/api/drivers/:id/emergency-contacts`, `/api/drivers/:id/safety-settings`, `/api/drivers/:id/incident-reports`, `/api/drivers/:id/emergency-alerts`, `/api/drivers/:id/share-location`, `/api/drivers/:id/share-trip`, `/api/drivers/:id/voice-commands`, `/api/drivers/:id/communication-history`, `/api/drivers/:id/safety-metrics`.
  - Emergency alerts and incident reports trigger real-time notifications to admins and emergency contacts via WebSocket.

### **State Management**
- **React Hooks** - Modern state management
- **Context API** - Global state management
- **Async Storage** - Local data persistence

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/esub002/ride-share-app.git
   cd ride-share-app/apps/driver-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device**
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go
   - **Web**: Press `w` in the terminal

### **Environment Setup**

1. **Backend Server**
   ```bash
   cd ../backend
   npm install
   npm start
   ```

2. **Database Setup**
   - Ensure PostgreSQL is running
   - Run database migrations:
     - Apply `schema.sql` and `safety-schema.sql` to enable all safety features
   - Configure environment variables

## 📱 App Structure

```
apps/driver-app/
├── App.js                 # Main app entry point
├── DriverHome.js          # Home dashboard
├── DrawerContent.js       # Navigation drawer
├── components/            # Reusable components
│   ├── EarningsFinance.js     # Earnings & finance features
│   ├── SafetyCommunication.js # Safety & communication (backend-driven)
│   ├── RideManagement.js      # Ride management
│   ├── Profile.js             # Driver profile
│   ├── Wallet.js              # Wallet management
│   └── ...                    # Other components
├── screens/               # Screen components
├── utils/                 # Utility functions
├── auth/                  # Authentication
├── assets/                # Images and fonts
└── constants/             # App constants
```

## 🔐 Authentication

### **Current Implementation**
- **Mobile OTP Authentication** - Phone number + OTP verification
- **Test OTP**: `123456` (for development)
- **Auto-registration** - New users automatically registered
- **Session management** - Persistent login sessions

### **Security Features**
- JWT token authentication
- Secure API communication
- Input validation and sanitization
- Error handling and logging

## 🗺️ Navigation Structure

```
Home Dashboard
├── Ride Management
├── Earnings & Finance
├── Safety & Communication
├── Profile
├── Wallet
├── Trip History
├── Messages
├── Safety Features
├── Settings
└── Theme
```

## 📊 Features in Detail

### **Earnings & Finance**
- **Period Selector**: Toggle between Today, This Week, This Month
- **Earnings Overview**: Large display with period-specific earnings
- **Payment Methods**: Add/edit bank accounts and cards
- **Transaction History**: Detailed list with icons and colors
- **Tax Documents**: Download tax documents
- **Tips Management**: Dedicated tips history and tracking

### **Safety & Communication**
- **Emergency SOS**: Large red button with confirmation dialog
- **Safety Settings**: Toggle auto-share location, voice commands
- **Emergency Contacts**: Add, edit, and call emergency contacts
- **Driver Verification**: Upload and track verification documents
- **Trip Sharing**: Share current trip status with contacts

### **Ride Management**
- **Real-time Requests**: Live incoming ride notifications
- **Quick Actions**: One-tap accept/reject buttons
- **Ride Status**: Complete ride lifecycle tracking
- **Navigation**: Built-in navigation integration
- **Customer Chat**: In-app messaging system

## 🎨 UI/UX Features

### **Design System**
- **Material Design** - Modern, clean interface
- **Responsive Layout** - Works on all screen sizes
- **Dark/Light Themes** - Theme customization
- **Loading States** - Proper loading indicators
- **Error Handling** - User-friendly error messages

### **Interactive Elements**
- **Pull-to-refresh** - Manual data refresh
- **Swipe gestures** - Intuitive navigation
- **Haptic feedback** - Tactile response
- **Smooth animations** - Polished user experience

## 🔧 Development Features

### **Error Handling**
- **Network Error Recovery** - Graceful offline handling
- **API Error Management** - Comprehensive error states
- **User Input Validation** - Real-time validation
- **Loading States** - Proper async operation feedback

### **Performance**
- **Optimized Rendering** - Efficient component updates
- **Image Optimization** - Compressed assets
- **Memory Management** - Proper cleanup and disposal
- **Battery Optimization** - Efficient background operations

## 🧪 Testing

### **Manual Testing**
1. **Authentication Flow**
   - Login with mobile number
   - OTP verification
   - Registration for new users

2. **Core Features**
   - Toggle availability
   - Accept/reject rides
   - Complete rides
   - View earnings

3. **Safety Features**
   - Emergency SOS
   - Add emergency contacts
   - Share trip status

### **Test Data**
- **Test OTP**: `123456`
- **Mock User**: John Driver
- **Sample Rides**: Pre-populated ride data
- **Mock Earnings**: Sample financial data

## 🚀 Deployment

### **Development**
```bash
npx expo start
```

### **Production Build**
```bash
npx expo build:android
npx expo build:ios
```

### **Publishing**
```bash
npx expo publish
```

## 📝 API Integration

### **Endpoints Used**
- `POST /api/drivers/login` - Driver authentication
- `GET /api/drivers/{id}/earnings` - Earnings data
- `GET /api/drivers/{id}/transactions` - Transaction history
- `POST /api/drivers/{id}/payment-methods` - Payment management
- `GET /api/rides?status=requested` - Ride requests
- `PATCH /api/rides/{id}/status` - Update ride status

### **Real-time Features**
- WebSocket connection for live updates
- Push notifications for ride requests
- Real-time location tracking
- Live chat messaging

## 🔮 Future Enhancements

### **Planned Features**
- **Advanced Analytics** - Performance insights and trends
- **Route Optimization** - AI-powered route suggestions
- **Voice Commands** - Full hands-free operation
- **Offline Mode** - Complete offline functionality
- **Multi-language Support** - Internationalization
- **Advanced Safety** - AI-powered safety monitoring

### **Technical Improvements**
- **Performance Optimization** - Faster load times
- **Battery Efficiency** - Reduced power consumption
- **Offline Sync** - Data synchronization
- **Push Notifications** - Enhanced notification system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the troubleshooting guide

---

**Built with ❤️ using React Native and Expo**
