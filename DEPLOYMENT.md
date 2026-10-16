# Nganzi Coffee — Production Deployment Guide

This guide details the complete deployment procedure for **`nganzicoffee.com`** (the unified Laravel + Inertia + React website, storefront, and staff dashboard).

---

## 1. Architecture Overview

| Component            | Specification                                   |
| -------------------- | ----------------------------------------------- |
| **Primary Domain**   | `nganzicoffee.com` (and `www.nganzicoffee.com`) |
| **Operating System** | Ubuntu 22.04 LTS or 24.04 LTS                   |
| **Backend Runtime**  | PHP 8.3+ (with PHP-FPM)                         |
| **Database**         | MySQL 8.0+ / MariaDB 10.11+                     |
| **Web Server**       | Nginx with HTTP/2 and Let's Encrypt SSL         |
| **Process Manager**  | Supervisor (for Laravel Queue Workers)          |
| **Task Scheduler**   | Cron (`php artisan schedule:run` every minute)  |
| **Asset Build**      | Node.js 22 LTS, Vite (Rollup/Tailwind CSS v4)   |

---

## 2. Server Prerequisites & Package Installation

Connect to your Ubuntu server via SSH as `root` or a `sudo` user:

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git unzip ufw software-properties-common

# Add Ondřej Surý PHP PPA
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update

# Install PHP 8.3 and required extensions
sudo apt install -y php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring \
    php8.3-xml php8.3-bcmath php8.3-curl php8.3-zip php8.3-intl \
    php8.3-gd php8.3-tokenizer

# Install Composer 2
curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
sudo php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx, MySQL, and Supervisor
sudo apt install -y nginx mysql-server supervisor certbot python3-certbot-nginx
```

---

## 3. Database Setup

Log in to MySQL as root:

```bash
sudo mysql
```

Run the following SQL commands (replace `SECURE_PASSWORD` with a strong password):

```sql
CREATE DATABASE nganzi_coffee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nganzi_app'@'127.0.0.1' IDENTIFIED BY 'SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON nganzi_coffee.* TO 'nganzi_app'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

---

## 4. Application Installation

### 4.1 Clone Repository

```bash
sudo mkdir -p /var/www/nganzicoffee.com
sudo chown -R $USER:www-data /var/www/nganzicoffee.com
git clone <YOUR_GIT_REPOSITORY_URL> /var/www/nganzicoffee.com
cd /var/www/nganzicoffee.com
```

### 4.2 Configure Environment (.env)

```bash
cp .env.production.example .env
nano .env
```

Ensure the following variables are correctly configured:

- `APP_KEY` (generated in the next step)
- `APP_URL=https://nganzicoffee.com`
- `DB_DATABASE=nganzi_coffee`
- `DB_USERNAME=nganzi_app`
- `DB_PASSWORD=SECURE_PASSWORD`
- `MAIL_*` credentials for transactional order emails
- `SHOP_CURRENCY` (confirm with business, defaults to `UGX`)
- `PAYMENT_PROVIDER` & keys (e.g. `manual`, `flutterwave`, etc.)

### 4.3 Install Dependencies & Generate Key

```bash
# Install PHP production dependencies
composer install --no-dev --optimize-autoloader --prefer-dist --no-interaction

# Generate application key
php artisan key:generate --force

# Compile frontend assets
npm ci
npm run build

# Run database migrations
php artisan migrate --force

# Create public storage symlink
php artisan storage:link
```

### 4.4 Create Initial Staff / Admin Account

Use the built-in staff creation artisan command:

```bash
php artisan staff:create admin@nganzicoffee.com --name="Nganzi Admin" --role=owner
```

You will be prompted to enter a secure password.

### 4.5 Set Directory Permissions

Ensure Nginx and PHP-FPM can write to `storage` and `bootstrap/cache`:

```bash
sudo chown -R www-data:www-data /var/www/nganzicoffee.com/storage
sudo chown -R www-data:www-data /var/www/nganzicoffee.com/bootstrap/cache
sudo chmod -R 775 /var/www/nganzicoffee.com/storage
sudo chmod -R 775 /var/www/nganzicoffee.com/bootstrap/cache
```

---

## 5. Web Server & SSL Setup

### 5.1 Nginx Configuration

Copy the provided Nginx configuration:

```bash
sudo cp deployment/nginx/nganzicoffee.com.conf /etc/nginx/sites-available/nganzicoffee.com.conf
sudo ln -s /etc/nginx/sites-available/nganzicoffee.com.conf /etc/nginx/sites-enabled/
```

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5.2 Let's Encrypt SSL Certificate

Ensure your DNS `A` records for `nganzicoffee.com` and `www.nganzicoffee.com` point to your server's public IP, then run:

```bash
sudo certbot --nginx -d nganzicoffee.com -d www.nganzicoffee.com
```

---

## 6. Background Queue Worker & Task Scheduler

### 6.1 Supervisor Queue Worker

The shop requires a queue worker to dispatch order confirmation emails, inventory alerts, and payment events:

```bash
sudo cp deployment/supervisor/nganzi-worker.conf /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start nganzi-worker:*
```

Check status:

```bash
sudo supervisorctl status
```

### 6.2 Laravel Task Scheduler (Cron)

The scheduler automatically releases expired cart reservations:

```bash
sudo crontab -u www-data -e
```

Add the following line:

```
* * * * * cd /var/www/nganzicoffee.com && php artisan schedule:run >> /dev/null 2>&1
```

---

## 7. Zero-Downtime Deployment & Automated CI/CD

### 7.1 Automated Deployment via GitHub Actions (Recommended)

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys changes whenever commits are pushed to `main` and test checks pass.

To enable automated deployment:

1. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Add the following repository secrets:
   - **`SSH_HOST`**: Server IP address or domain (e.g., `198.51.100.1` or `nganzicoffee.com`).
   - **`SSH_USER`**: SSH login user (e.g., `ubuntu` or `deploy`).
   - **`SSH_KEY`**: The private SSH key for the user (matching the public key added to `~/.ssh/authorized_keys` on the server).
   - **`SSH_PORT`**: *(Optional)* SSH port if non-standard (defaults to `22`).

Once configured, pushing to `main` will automatically connect via SSH, run `bash deploy.sh`, and refresh the live site without downtime!

---

### 7.2 Manual Deployment Script

You can also trigger a deployment manually at any time by executing `./deploy.sh` on the server:

```bash
chmod +x deploy.sh
./deploy.sh
```

What `deploy.sh` does:

1. Puts the site into maintenance mode with a bypass key (`php artisan down`)
2. Pulls code from Git (`git pull origin main`)
3. Installs Composer dependencies (`composer install --no-dev`)
4. Compiles production assets (`npm ci && npm run build`)
5. Runs database migrations (`php artisan migrate --force`)
6. Refreshes application caches (`config:cache`, `route:cache`, `view:cache`, `event:cache`)
7. Restarts queue workers gracefully (`php artisan queue:restart`)
8. Takes the site live (`php artisan up`)

---

## 8. Backup Strategy

### 8.1 Database Backups

Create a daily automated MySQL backup cron job (`/etc/cron.daily/backup-nganzi-db`):

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/nganzi-db"
mkdir -p "$BACKUP_DIR"
mysqldump -u nganzi_app -p'SECURE_PASSWORD' nganzi_coffee | gzip > "$BACKUP_DIR/db-$(date +\%F).sql.gz"
find "$BACKUP_DIR" -type f -mtime +14 -delete
```

Make executable: `sudo chmod +x /etc/cron.daily/backup-nganzi-db`.

### 8.2 Product Media

Back up `/var/www/nganzicoffee.com/storage/app/public` regularly or configure `MEDIA_DISK=s3` to store product uploads directly on Amazon S3 / Cloudflare R2.

---

## 9. Pre-Launch Verification Checklist

Before opening the storefront to customers:

- [ ] **Health Check:** `curl -I https://nganzicoffee.com/up` returns `HTTP 200 OK`.
- [ ] **Debug Mode:** Verify `APP_DEBUG=false` in `.env`.
- [ ] **HTTPS:** Verify SSL certificate covers both `nganzicoffee.com` and `www.nganzicoffee.com`.
- [ ] **Email Delivery:** Place a test order and verify customer and admin notification emails.
- [ ] **Admin Login:** Log in to `https://nganzicoffee.com/login` with your owner account.
- [ ] **Inventory & Prices:** Review published products, variants, and stock levels in `/admin/products`.
- [ ] **Payment Provider:** Confirm webhook URL configuration at `https://nganzicoffee.com/webhooks/payments`.
