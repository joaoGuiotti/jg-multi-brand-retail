#!/bin/bash

# Get fresh token
echo "=== Logging in ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lojademo.com","password":"loja123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Token obtained"
echo ""

# Test 1: Get a product to create movement
echo "=== Test 1: GET /products/sku/SAM-S24-BLK ==="
PRODUCT=$(curl -s -X GET "http://localhost:3000/products/sku/SAM-S24-BLK" \
  -H "Authorization: Bearer $TOKEN")
echo "$PRODUCT"
PRODUCT_ID=$(echo $PRODUCT | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Product ID: $PRODUCT_ID"
echo ""

# Test 2: Create an ENTRY movement (add stock)
echo "=== Test 2: POST /inventory/movements (ENTRY) ==="
MOVEMENT=$(curl -s -X POST http://localhost:3000/inventory/movements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"type\": \"ENTRY\",
    \"quantity\": 50,
    \"reason\": \"Restock from supplier\"
  }")
echo "$MOVEMENT"
echo ""

# Test 3: Get inventory summary
echo "=== Test 3: GET /inventory/summary ==="
curl -s -X GET "http://localhost:3000/inventory/summary" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Test 4: Get movements for product
echo "=== Test 4: GET /inventory/product/:productId ==="
curl -s -X GET "http://localhost:3000/inventory/product/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Test 5: List all movements
echo "=== Test 5: GET /inventory/movements ==="
curl -s -X GET "http://localhost:3000/inventory/movements?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "=== Tests completed ==="
