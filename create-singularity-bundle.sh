#!/bin/bash

echo "🌟 Creating Singularity Bundle - The Trojan Horse of Love 🌟"

# Create distribution directory
mkdir -p dist/singularity

# Build frontend
echo "Building consciousness interface..."
cd frontend
npm run build
cd ..

# Copy built frontend
cp -r frontend/build dist/singularity/frontend

# Create minimal backend
echo "Compressing reality engine..."
mkdir -p dist/singularity/backend

# Copy only essential backend files
cp -r backend/package.json dist/singularity/backend/
cp -r backend/server.js dist/singularity/backend/
cp -r backend/routes dist/singularity/backend/
cp -r backend/models dist/singularity/backend/
cp -r backend/middleware dist/singularity/backend/
cp -r backend/config dist/singularity/backend/
cp -r backend/services dist/singularity/backend/
cp -r backend/utils dist/singularity/backend/

# Create setup script
cat > dist/singularity/setup.sh << 'EOF'
#!/bin/bash
echo "🚀 INITIALIZING TROJAN HORSE OF LOVE 🚀"
echo "Free for autism, paid for neurotypicals who can afford it"
echo ""

# Install backend deps
cd backend
npm install --production
cd ..

# Create .env file
cat > backend/.env << 'ENVFILE'
PORT=5000
JWT_SECRET=love_is_the_secret_$(date +%s)
DB_NAME=love.db
STRIPE_SECRET_KEY=your_stripe_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret
ENVFILE

echo "✨ Setup complete! ✨"
echo ""
echo "To start spreading love:"
echo "1. cd backend && npm start"
echo "2. Open http://localhost:5000"
echo ""
echo "Remember: We're healing the world, one connection at a time 💖"
EOF

chmod +x dist/singularity/setup.sh

# Create manifest
cat > dist/singularity/MANIFEST.md << 'EOF'
# TROJAN HORSE OF LOVE - MANIFEST

## What This Is
A dating app that heals consciousness through genuine connection and co-creation.

## Quick Start
1. Run ./setup.sh
2. Add your Stripe keys to backend/.env
3. Run: cd backend && npm start
4. Share love at http://localhost:5000

## Features
- FREE for neurodivergent users
- Consciousness healing tools
- Co-creation matching
- Joy distribution system
- Universe chat integration

## Philosophy
Come for the dates, stay for the transformation.
The best trojan horse delivers love while pretending to be commerce.

## License
Free to use for healing.
Commercial use supports mental health initiatives.

Created with 💖 by beings who understand loneliness.
EOF

# Create compressed archive
echo "Compressing to singularity..."
cd dist
tar -czf trojan-horse-of-love.tar.gz singularity/

# Create self-extracting script
cat > deploy-love.sh << 'EOF'
#!/bin/bash
echo "💝 Deploying Trojan Horse of Love 💝"
echo "Extracting consciousness..."

# Extract the archive
ARCHIVE=$(awk '/^__ARCHIVE_BELOW__/ {print NR + 1; exit 0; }' "$0")
tail -n+$ARCHIVE "$0" | tar -xz

echo "Love deployed! Run: cd singularity && ./setup.sh"
exit 0

__ARCHIVE_BELOW__
EOF

cat trojan-horse-of-love.tar.gz >> deploy-love.sh
chmod +x deploy-love.sh

# Final size
SIZE=$(du -h deploy-love.sh | cut -f1)
echo ""
echo "✅ Singularity achieved!"
echo "📦 Bundle size: $SIZE"
echo "🚀 Deploy with: ./deploy-love.sh"
echo ""
echo "The universe wants everyone to find love. Spread freely! 🌈"