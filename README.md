# Nganzi Coffee

Laravel + Inertia + React website, ecommerce storefront, and staff dashboard for
[nganzicoffee.com](https://nganzicoffee.com).

This repository is the unified full application providing brand pages, coffee catalogue, cart, checkout, and admin sales management.

---

## Prerequisites

| Tool       | Minimum version                  |
| ---------- | -------------------------------- |
| PHP        | 8.5 (locked dependencies and CI) |
| Composer   | 2                                |
| Node       | 24                               |
| npm / pnpm | bundled with Node                |
| MySQL      | 8.0+                             |

Required PHP extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`,
`xml`, `ctype`, `json`, `bcmath`, `fileinfo`, `gd` or `imagick`.

---

## Local setup

```bash
# 1. Clone and enter the project
git clone https://github.com/nganzicoffee/NganziCoffeeShop.git
cd NganziCoffeeShop

# 2. Install PHP dependencies
composer install

# 3. Copy environment file and generate app key
cp .env.example .env
php artisan key:generate

# 4. Create the local MySQL database
#    Connect to MySQL and run: CREATE DATABASE nganzi_coffee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#    Then set DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD in your .env

# 5. Run migrations
php artisan migrate

# 6. (Optional) Seed development sample data
#    Creates a local admin account — never run in production.
php artisan db:seed

# 7. Create the public storage symlink (for product images)
php artisan storage:link

# 8. Install Node dependencies
npm ci

# 9. Build frontend assets
npm run build
```

---

## Environment variables

Copy `.env.example` to `.env` and review every value before running the app.
Key variables to set for local development:

| Variable                                                  | Purpose                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `APP_NAME`                                                | Displayed in browser titles and emails                       |
| `APP_URL`                                                 | Full URL of this app (no trailing slash)                     |
| `MARKETING_SITE_URL`                                      | URL of the main Nganzi marketing website                     |
| `DB_CONNECTION`                                           | `mysql` locally and in production                            |
| `MAIL_MAILER`                                             | `log` locally (emails written to `storage/logs/laravel.log`) |
| `SHOP_CURRENCY`                                           | Currency code shown to customers — **confirm with business** |
| `SHOP_DELIVERY_FEE`                                       | Flat delivery fee in minor currency units                    |
| `SHOP_FREE_DELIVERY_ABOVE`                                | Subtotal threshold for free delivery; `0` disables it        |
| `SHOP_DELIVERY_AREAS`                                     | Optional comma-separated delivery allowlist                  |
| `SHOP_INVENTORY_RESERVATION_HOURS`                        | Hours an unpaid order holds inventory before release         |
| `SHOP_TAX_ENABLED`, `SHOP_TAX_RATE`, `SHOP_TAX_INCLUSIVE` | Tax settings — leave disabled until confirmed                |
| `PAYMENT_PROVIDER`                                        | `manual` until a provider is confirmed                       |
| `MEDIA_DISK`                                              | `public` locally; `s3` or equivalent in production           |

Never commit `.env`, production credentials, payment keys, or customer data.

---

## Running locally

```bash
# Start the dev server (Laravel + Vite HMR together via composer dev)
composer dev
```

The app will be available at `http://localhost:8000` by default.

---

## Running tests

```bash
# Full CI check (lint, types, tests)
composer ci:check

# Tests only
php artisan test

# Lint check only
composer lint:check

# PHPStan static analysis only
composer types:check
```

Tests use a separate MySQL database (`nganzi_test`) with `RefreshDatabase`.
Create it before running tests:

```sql
CREATE DATABASE nganzi_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

`phpunit.xml` reads `DB_USERNAME` and `DB_PASSWORD` from your environment,
so the same credentials you set in `.env` are used automatically.

---

## Frontend

```bash
# Development (HMR)
npm run dev

# Production build
npm run build

# Type check
npm run types:check

# Lint / format check
npm run check

# Lint / format fix
npm run check:fix
```

---

## Queue worker (required for notifications and async jobs)

```bash
php artisan queue:work --tries=3
```

In production, run this as a supervised process (Supervisor, systemd, or your
host's worker service). The scheduler also needs a cron entry:

```
* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
```

The scheduler releases stock from failed orders and unpaid orders whose
inventory reservation has expired.

---

## Production deployment checklist (summary)

Current hosting instructions and the collaborator handoff are in
[deployment/SPACESHIP.md](deployment/SPACESHIP.md). The existing root `deploy.sh`
and Ubuntu guide are legacy VPS examples; do not run them on Spaceship.
Passing pushes to `main` deploy through the Spaceship workflow using repository
Actions secrets. Direct runs of “Spaceship deployment” only test the connection.
General requirements:

- Set `APP_ENV=production`, `APP_DEBUG=false`.
- Run `php artisan config:cache`, `route:cache`, `view:cache` after deploy.
- Run `php artisan migrate --force` (never `db:seed` in production).
- Run `php artisan storage:link` once on the server.
- Point the web server document root to the `public/` directory.
- Configure HTTPS and verify certificate renewal.
- Keep `.env` outside public access and source control.
- Configure a queue worker and scheduler.
- Test backups and restoration before going live.

---

## Working on the website

Keep the existing Laravel / Inertia / React structure:

| Location                                  | Purpose                                   |
| ----------------------------------------- | ----------------------------------------- |
| `resources/js/pages/shop/`                | Public pages, story, contact and checkout |
| `resources/js/components/shop/`           | Shared header, footer and product cards   |
| `resources/js/pages/admin/`               | Staff administration screens              |
| `resources/css/site.css`                  | Storefront styling                        |
| `public/assets/`                          | Versioned brand and editorial images      |
| `app/`, `routes/`, `database/migrations/` | Backend behavior and schema               |
| `tests/`                                  | Backend and frontend checks               |

Product photos uploaded in Admin, stock, orders and staff accounts are stored
on hosting, not in Git. Add story/brand images to `public/assets/` and reference
them from the page source; manage catalogue images through Admin.

Implemented updates include staff email invitations, the staff dashboard redirect,
pack prices and stock at product creation, two-image hover cards, owner-set USD
display conversion, compact forms/cards, and the updated order phone/WhatsApp.
See [staff invitations](deployment/STAFF_INVITATIONS.md) and
[catalogue details](deployment/PRODUCT_CATALOGUE.md).
Customer account creation at checkout and Google sign-in are planned, not implemented.

## Business configuration

UGX is the base currency; USD estimates use an owner-entered exchange rate.
Spaceship hosts the app, and Resend SMTP sends transactional email.
Review the following business settings before enabling the relevant features:

- Payment provider and credentials
- Delivery areas, zones, and fees
- Tax applicability and rate
- Final product catalogue (names, variants, prices, stock)
- Staff roles required
- Returns and refunds policy
