#!/usr/bin/env bash
set -e

# -----------------------------------------------------------------------------
# Nganzi Coffee Shop — Production Deployment Script
# -----------------------------------------------------------------------------
# Usage: ./deploy.sh
# Ensures zero-downtime cache reloads, DB migrations, asset builds, and queue restarts.
# -----------------------------------------------------------------------------

echo "==> [1/8] Putting application into maintenance mode..."
php artisan down --render="errors::503" --secret="nganzi-deploy-bypass" || true

echo "==> [2/8] Pulling latest changes from Git..."
git pull origin main

echo "==> [3/8] Installing Composer PHP dependencies..."
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

echo "==> [4/8] Installing Node dependencies and compiling frontend assets..."
npm ci --prefer-offline --no-audit
npm run build

echo "==> [5/8] Running database migrations..."
php artisan migrate --force

echo "==> [6/8] Ensuring storage symlinks exist..."
php artisan storage:link || true

echo "==> [7/8] Optimizing application caches (config, routes, views, events)..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "==> [8/8] Restarting background queue workers..."
php artisan queue:restart

echo "==> Bringing application out of maintenance mode..."
php artisan up

echo "==> Deployment finished successfully! Health check: curl -I https://nganzicoffee.com/up"
