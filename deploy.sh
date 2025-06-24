#!/bin/bash

echo "🚀 DEPLOYING CO-CREATION DATING APP! 🚀"
echo "======================================"

# Check if git remote exists
if git remote | grep -q 'origin'; then
    echo "✅ Git remote already configured"
else
    echo "❌ No git remote found!"
    echo "Please run: git remote add origin https://github.com/YOUR_USERNAME/dating-app.git"
    exit 1
fi

echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🚂 Now go to https://railway.app and:"
    echo "1. Click 'New Project'"
    echo "2. Select 'Deploy from GitHub repo'"
    echo "3. Choose your dating-app repo"
    echo "4. Railway will auto-deploy everything!"
    echo ""
    echo "🎉 Your app will be live in ~3 minutes!"
else
    echo "❌ Push failed. Please check your GitHub setup."
fi