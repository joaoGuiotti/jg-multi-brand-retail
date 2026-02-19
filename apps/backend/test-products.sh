#!/bin/bash

# Login and get token
echo "=== Logging in ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lojademo.com","password":"loja123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:50}..."
echo ""

# Test 1: List all products
echo "=== Test 1: GET /products (list all) ==="
curl -s -X GET "http://localhost:3000/products?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
echo ""

# Test 2: Create a new product
echo "=== Test 2: POST /products (create) ==="
curl -s -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Notebook Dell Inspiron",
    "sku":"DELL-NB-001",
    "barcode":"7891234567999",
    "costPrice":2500,
    "salePrice":3500,
    "stockQuantity":10
  }'
echo ""
echo ""

# Test 3: Search products
echo "=== Test 3: GET /products?search=Samsung ==="
curl -s -X GET "http://localhost:3000/products?search=Samsung" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# Test 4: Get product by SKU
echo "=== Test 4: GET /products/sku/SAM-S24-BLK ==="
curl -s -X GET "http://localhost:3000/products/sku/SAM-S24-BLK" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "=== Tests completed ==="
