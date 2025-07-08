#!/bin/bash

# CHRYSALIS PRESENCE - Environment Setup Script
# This script helps you set up the required environment variables

echo "🦋 CHRYSALIS PRESENCE - Environment Setup"
echo "=========================================="
echo ""

echo "You need to set up the following environment variables in Netlify:"
echo ""
echo "1. FAUNADB_SECRET:"
echo "   - Go to https://dashboard.fauna.com/"
echo "   - Create a new database called 'chrysalis-presence'"
echo "   - Go to Security → Database Access Keys"
echo "   - Create a new key with 'Server' role"
echo "   - Copy the secret"
echo ""

echo "2. JWT_SECRET:"
echo "   - Use a strong random string (minimum 32 characters)"
echo "   - Generate one with: openssl rand -base64 32"
echo ""

echo "Setting these up in Netlify..."
echo ""

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT_SECRET: $JWT_SECRET"
echo ""

echo "Now run these commands:"
echo "netlify env:set JWT_SECRET \"$JWT_SECRET\""
echo "netlify env:set FAUNADB_SECRET \"your-fauna-secret-here\""
echo ""

echo "Then deploy with: npm run deploy"
