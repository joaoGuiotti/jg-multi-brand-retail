#!/bin/bash

# Get fresh token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lojademo.com","password":"loja123"}' | \
  grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "Testing with fresh token..."
echo ""

# Test immediately
curl -s -X GET "http://localhost:3000/products?page=1&limit=3" \
  -H "Authorization: Bearer $TOKEN"

echo ""
