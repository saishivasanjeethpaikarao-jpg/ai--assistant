#!/bin/bash
set -e

echo "[post-merge] Installing frontend dependencies..."
cd frontend && npm install --legacy-peer-deps --prefer-offline
cd ..

echo "[post-merge] Installing backend dependencies..."
cd backend && pip install -q -r requirements.txt 2>/dev/null || true
cd ..

echo "[post-merge] Done."
