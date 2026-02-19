#!/bin/bash

# Get fresh token
echo "=== Logging in ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lojademo.com","password":"loja123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Token obtained"
echo ""

# Test 1: Get product to use in sale
echo "=== Test 1: GET /products/sku/SAM-S24-BLK ==="
PRODUCT=$(curl -s -X GET "http://localhost:3000/products/sku/SAM-S24-BLK" \
  -H "Authorization: Bearer $TOKEN")
echo "$PRODUCT"
PRODUCT_ID=$(echo $PRODUCT | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Product ID: $PRODUCT_ID"
echo ""

# Test 2: Create a sale
echo "=== Test 2: POST /sales (create sale) ==="
SALE=$(curl -s -X POST http://localhost:3000/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 2,
        \"unitPrice\": 4500,
        \"discount\": 0
      }
    ],
    \"discount\": 0,
    \"notes\": \"Venda teste via API\"
  }")
echo "$SALE"
SALE_ID=$(echo $SALE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Sale ID: $SALE_ID"
echo ""

# Test 3: List all sales
echo "=== Test 3: GET /sales (list all) ==="
curl -s -X GET "http://localhost:3000/sales?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Test 4: Get specific sale
echo "=== Test 4: GET /sales/:id ==="
curl -s -X GET "http://localhost:3000/sales/$SALE_ID" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "=== Tests completed ==="
