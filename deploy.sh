#!/bin/bash

# CHRYSALIS PRESENCE - Netlify Deployment Script
# This script will set up and deploy the app to Netlify

echo "🦋 CHRYSALIS PRESENCE - Netlify Deployment"
echo "=========================================="

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify..."
    netlify login
fi

echo "📦 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "🚀 Deploying to Netlify..."
    
    # Check if this is the first deployment
    if [ ! -f ".netlify/state.json" ]; then
        echo "🆕 First deployment - creating new site..."
        netlify deploy --prod --open
    else
        echo "🔄 Updating existing site..."
        netlify deploy --prod
    fi
    
    echo "✅ Deployment complete!"
    echo "🌐 Your app is live! Check the URL above."
    
else
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi
