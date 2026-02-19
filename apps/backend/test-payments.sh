#!/bin/bash

# Get fresh token
echo "=== Logging in ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lojademo.com","password":"loja123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Token obtained"
echo ""

# Test 1: Get a sale to add payment
echo "=== Test 1: GET /sales (get first sale) ==="
SALES=$(curl -s -X GET "http://localhost:3000/sales?page=1&limit=1" \
  -H "Authorization: Bearer $TOKEN")
echo "$SALES"
SALE_ID=$(echo $SALES | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Sale ID: $SALE_ID"
echo ""

# Test 2: Create a payment for the sale
echo "=== Test 2: POST /payments (add cash payment) ==="
PAYMENT=$(curl -s -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"saleId\": \"$SALE_ID\",
    \"method\": \"CASH\",
    \"amount\": 5000,
    \"reference\": \"Cash payment test\"
  }")
echo "$PAYMENT"
PAYMENT_ID=$(echo $PAYMENT | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Payment ID: $PAYMENT_ID"
echo ""

# Test 3: Get payments for the sale
echo "=== Test 3: GET /payments/sale/:saleId ==="
curl -s -X GET "http://localhost:3000/payments/sale/$SALE_ID" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Test 4: List all payments
echo "=== Test 4: GET /payments ==="
curl -s -X GET "http://localhost:3000/payments?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Test 5: Get specific payment
echo "=== Test 5: GET /payments/:id ==="
curl -s -X GET "http://localhost:3000/payments/$PAYMENT_ID" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "=== Tests completed ==="
