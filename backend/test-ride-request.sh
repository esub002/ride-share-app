#!/bin/bash

# Quick test script for Driver App Ride Requests
# Make sure your backend is running on localhost:3003

BASE_URL="http://localhost:3003"
PHONE="+1234567890"
OTP="123456"

echo "🚀 Quick Ride Request Test"
echo "=========================="

# Step 1: Send OTP
echo "📱 Sending OTP..."
curl -s -X POST "$BASE_URL/api/auth/driver/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\"}" | jq '.'

echo ""

# Step 2: Verify OTP and get token
echo "🔐 Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/driver/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"otp\": \"$OTP\",
    \"name\": \"Test Driver\",
    \"car_info\": \"Toyota Camry 2020\"
  }")

echo "$TOKEN_RESPONSE" | jq '.'

# Extract token (requires jq)
TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo ""
echo "✅ Token obtained: ${TOKEN:0:50}..."
echo ""

# Step 3: Create ride request
echo "🚗 Creating ride request..."
curl -s -X POST "$BASE_URL/api/rides" \
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
  }" | jq '.'

echo ""
echo "🎉 Test completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Open your Driver App"
echo "2. Log in with phone: $PHONE and OTP: $OTP"
echo "3. Check if the ride request appears in the app"
echo ""

# Alternative: Simple version without jq
echo "🔧 Simple version (without jq):"
echo "curl -X POST $BASE_URL/api/rides \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -d '{\"pickup_location\":\"123 Main St\",\"dropoff_location\":\"456 Oak Ave\",\"rider_id\":1,\"driver_id\":1,\"fare\":25.50}'" 