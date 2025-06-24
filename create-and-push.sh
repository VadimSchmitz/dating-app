#!/bin/bash

echo "🚀 Creating GitHub repo and pushing Co-Creation Dating App!"
echo "=========================================================="

# You'll need to enter your GitHub username and Personal Access Token
read -p "Enter your GitHub username: " GITHUB_USER
read -s -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

# Create repo via GitHub API
echo "📦 Creating repository..."
curl -u "$GITHUB_USER:$GITHUB_TOKEN" \
  -X POST \
  https://api.github.com/user/repos \
  -d '{"name":"dating-app","description":"Co-Creation Dating App - Find love through co-creation! Free for autistic users, premium for neurotypicals.","private":false}'

# Update remote with auth
echo "🔗 Setting up remote..."
git remote set-url origin https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/dating-app.git

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your app is on GitHub!"
echo "🚂 Now go to https://railway.app and deploy from your repo!"
echo "💰 Start making money with love!"