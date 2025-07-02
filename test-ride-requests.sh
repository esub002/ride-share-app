#!/bin/bash

# Test script for Driver App Ride Requests
# Make sure your backend is running on localhost:3003

BASE_URL="http://localhost:3003"
PHONE="+1234567890"
OTP="123456"

echo "🚀 Starting Driver App Ride Request Tests..."
echo "=========================================="

# Step 1: Send OTP
echo "📱 Step 1: Sending OTP..."
OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/driver/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\"}")

echo "OTP Response: $OTP_RESPONSE"
echo ""

# Step 2: Verify OTP and get token
echo "🔐 Step 2: Verifying OTP and getting token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/driver/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"otp\": \"$OTP\",
    \"name\": \"Test Driver\",
    \"car_info\": \"Toyota Camry 2020\"
  }")

echo "Login Response: $LOGIN_RESPONSE"
echo ""

# Extract token from response (simple extraction - in production use jq)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Authentication successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 3: Create a ride request
echo "🚗 Step 3: Creating ride request..."
RIDE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rides" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"pickup_location\": \"123 Main St, Downtown\",
    \"dropoff_location\": \"456 Oak Ave, Uptown\",
    \"rider_id\": 1,
    \"driver_id\": 1,
    \"fare\": 25.50,
    \"pickup_lat\": 40.7128,
    \"pickup_lng\": -74.0060,
    \"dropoff_lat\": 40.7589,
    \"dropoff_lng\": -73.9851
  }")

echo "Ride Request Response: $RIDE_RESPONSE"
echo ""

# Step 4: Get available rides
echo "🔍 Step 4: Getting available rides..."
AVAILABLE_RIDES=$(curl -s -X GET "$BASE_URL/api/rides?status=requested" \
  -H "Authorization: Bearer $TOKEN")

echo "Available Rides: $AVAILABLE_RIDES"
echo ""

# Step 5: Update driver location
echo "📍 Step 5: Updating driver location..."
LOCATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/drivers/location" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"latitude\": 40.7128,
    \"longitude\": -74.0060
  }")

echo "Location Update Response: $LOCATION_RESPONSE"
echo ""

echo "🎉 Test completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Open your Driver App"
echo "2. Log in with phone: $PHONE and OTP: $OTP"
echo "3. Check if the ride request appears in the app"
echo "4. Test accepting/rejecting the ride"
echo ""

echo "🔧 Troubleshooting:"
echo "- Make sure your backend is running on $BASE_URL"
echo "- Check that the Driver App is connected to the same backend"
echo "- Verify Socket.IO connection in the app"
echo "- Check browser console or app logs for errors" 