#!/bin/bash
set -e

echo "=== Seogard Workers Deploy ==="

cd ~/seogard

echo "→ Pulling latest code..."
git pull origin main

echo "→ Building and restarting workers..."
docker compose -f docker-compose.workers.yml up --build -d

echo "→ Cleaning old images..."
docker image prune -f

echo "→ Status:"
docker compose -f docker-compose.workers.yml ps

echo "=== Deploy complete ==="
