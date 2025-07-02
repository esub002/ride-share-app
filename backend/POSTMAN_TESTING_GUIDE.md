# Postman Testing Guide for Driver App Ride Requests

## Prerequisites
- Backend server running on `http://localhost:3003`
- Postman installed
- Driver App running and connected to the same backend

## Step-by-Step Testing

### 1. Authentication Setup

#### Step 1.1: Send OTP
```
POST http://localhost:3003/api/auth/driver/send-otp
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

**Expected Response:**
```json
{
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

#### Step 1.2: Verify OTP and Get Token
```
POST http://localhost:3003/api/auth/driver/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456",
  "name": "Test Driver",
  "car_info": "Toyota Camry 2020"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": 1,
    "name": "Test Driver",
    "phone": "+1234567890",
    "car_info": "Toyota Camry 2020"
  }
}
```

**Important:** Copy the `token` value for the next steps!

### 2. Create Ride Request

#### Step 2.1: Create a New Ride Request
```
POST http://localhost:3003/api/rides
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "pickup_location": "123 Main St, Downtown",
  "dropoff_location": "456 Oak Ave, Uptown",
  "rider_id": 1,
  "driver_id": 1,
  "fare": 25.50,
  "pickup_lat": 40.7128,
  "pickup_lng": -74.0060,
  "dropoff_lat": 40.7589,
  "dropoff_lng": -73.9851
}
```

**Expected Response:**
```json
{
  "id": 1,
  "status": "requested",
  "pickup_location": "123 Main St, Downtown",
  "dropoff_location": "456 Oak Ave, Uptown",
  "fare": 25.50,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 3. Test Real-Time Reception

#### Step 3.1: Check Driver App
After creating the ride request:
1. **Foreground Test:** If the Driver App is open, you should see the ride request appear immediately
2. **Background Test:** Minimize the app and create another request - you should get a notification
3. **Closed Test:** Close the app completely and create a request - you should get a push notification

### 4. Additional API Tests

#### Step 4.1: Get Available Rides
```
GET http://localhost:3003/api/rides?status=requested
Authorization: Bearer YOUR_TOKEN_HERE
```

#### Step 4.2: Accept a Ride
```
POST http://localhost:3003/api/rides/1/accept
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "ride_id": 1
}
```

#### Step 4.3: Complete a Ride
```
POST http://localhost:3003/api/rides/1/complete
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "ride_id": 1
}
```

#### Step 4.4: Update Driver Location
```
POST http://localhost:3003/api/drivers/location
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

## Postman Collection Setup

### 1. Create Environment Variables
In Postman, create an environment with these variables:
- `baseUrl`: `http://localhost:3003`
- `authToken`: (leave empty, will be set automatically)

### 2. Set Up Pre-request Scripts
For the "Verify OTP" request, add this test script:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set('authToken', response.token);
    console.log('Token saved:', response.token);
}
```

### 3. Use Variables in Requests
- URL: `{{baseUrl}}/api/rides`
- Authorization: `Bearer {{authToken}}`

## Troubleshooting

### Common Issues

#### 1. "No token" Error
- Make sure you've completed the authentication steps
- Check that the token is included in the Authorization header
- Verify the token format: `Bearer YOUR_TOKEN_HERE`

#### 2. Connection Errors
- Ensure the backend is running on `localhost:3003`
- Check if the port is correct in your backend configuration
- Try alternative URLs: `http://127.0.0.1:3003` or `http://10.1.10.243:3003`

#### 3. Driver App Not Receiving Requests
- Verify the Driver App is connected to the same backend URL
- Check Socket.IO connection status in the app
- Ensure the driver is logged in with the same phone number

#### 4. Push Notifications Not Working
- For background/closed state testing, you need a standalone build (not Expo Go)
- Verify push notification permissions are granted
- Check FCM/APNs configuration

### Debug Steps

1. **Check Backend Logs**
   - Look for incoming requests in your backend console
   - Verify Socket.IO events are being emitted

2. **Check Driver App Logs**
   - Use React Native Debugger or Chrome DevTools
   - Look for Socket.IO connection status
   - Check for incoming ride request events

3. **Test Socket.IO Connection**
   - Use a Socket.IO client tester to verify events
   - Check if the driver is properly connected to the socket

## Expected Behavior

### Foreground (App Open)
- Ride request should appear immediately in the UI
- Notification sound/vibration should play
- No push notification should appear

### Background (App Minimized)
- Local notification should appear
- Tapping notification should bring app to foreground
- Ride request should be visible in the app

### Closed (App Terminated)
- Push notification should be received
- Tapping notification should launch app
- App should navigate to ride request screen

## Next Steps

After successful testing:
1. Test with multiple ride requests
2. Test ride acceptance/rejection flow
3. Test ride completion flow
4. Test location updates
5. Test with poor network conditions
6. Test with different app states 