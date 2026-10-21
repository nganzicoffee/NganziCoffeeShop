# Spaceship hosting and collaborator handoff

## Source and live data

Company repository: https://github.com/nganzicoffee/NganziCoffeeShop

The project keeps its existing Laravel structure. Commit source and editorial
assets; build `public/build` from the lockfile. Do not commit `.env`, SSH keys,
database dumps, product uploads, `vendor`, `node_modules`, or release archives.

The repository includes the manually deployed staff/catalogue changes and the
latest local compact layout and phone/WhatsApp changes. Those latest refinements
still need deployment. This commit is not evidence that hosting has been updated.
Live customer data and uploaded images cannot be made identical to a Git checkout.

## Current hosting layout

- Application: `~/nganzi-app`.
- Domain document root: `~/nganzicoffee.com`.
- The domain's custom `index.php` loads the application from `../nganzi-app`
  and sets the Laravel public path to the domain directory. Preserve this file.
- Product uploads: `~/nganzi-app/storage/app/public`, exposed by the domain's
  `storage` symlink. Preserve both uploads and the existing link.
- Built assets are copied from `nganzi-app/public/build/` into the domain's
  `build/` directory. Versioned editorial assets in `public/assets/` must also
  be synchronized into the domain's `assets/` directory when changed.
- The server `.env`, database, application key, and existing accounts persist
  independently of source updates. Never rerun development seeders in production.
- PHP 8.5 is selected for the website; the default SSH `php` is older. Use the
  explicit PHP binary and extension flags documented in PRODUCT_CATALOGUE.md.
- Resend SMTP sends password resets and staff invitations. Queued order emails
  also need the queue worker and scheduler configured on hosting.

## Editing and validation

### Finding storefront controls

| Element                                           | Markup / behavior                              | Styling                                                                                                  |
| ------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Shop hero order/call buttons and marketplace logo | `resources/js/pages/shop/index.tsx`            | `resources/css/site.css`: `.shop-page-actions`, `.shop-marketplace-logo`, and their mobile media queries |
| Product call, cart and details buttons            | `resources/js/components/shop/ProductCard.tsx` | Component classes and `.shop-roast-*` rules in `site.css`                                                |
| Header navigation and currency selector           | `resources/js/components/shop/ShopHeader.tsx`  | `site.css` and component classes                                                                         |
| Footer contacts and WhatsApp                      | `resources/js/components/shop/ShopFooter.tsx`  | `.site-footer` rules in `site.css`                                                                       |

Marvin's `be76ccd` mobile button correction is preserved in `site.css`.
The homepage gallery is in `resources/js/pages/welcome.tsx`, with images under
`public/assets/images/farm-gallery-*.webp`. The page entrance animation is in
`resources/js/layouts/shop/ShopLayout.tsx`; product details are in
`resources/js/pages/shop/product.tsx`. Their styles remain in `site.css`.
Keep edits in these established files rather than creating a second storefront.
Git compares every tracked file against the remote revision; the only difference
when integrating `be76ccd` was that CSS file. The current PHP failures concern
response APIs and static analysis, not the shared-hosting directory structure.

All Markdown documentation is retained. The legacy VPS files are clearly labeled
and kept for reference; follow this guide for current Spaceship hosting.
Marvin's later gallery, product-detail/card, password-change OTP and admin dark-mode
updates are also preserved. Pull the current `main` before starting new edits.

Install supported PHP (production uses 8.5), Composer 2, Node 24 and MySQL.
Follow README local setup with a local `.env` and an isolated database. Never
copy customer data or production passwords into the repository.

```bash
composer install
npm ci
php artisan wayfinder:generate --with-form
npm run types:check
node --test tests/frontend/price.test.mjs
npm run build
php artisan test
```

Backend tests require development dependencies and the isolated `nganzi_test`
database from phpunit.xml. GitHub CI uses MySQL and PHP 8.5. The complete CI run
for application revision `36380df` passed on 21 October 2026:
https://github.com/nganzicoffee/NganziCoffeeShop/actions/runs/39510261937
The response-header and locked-image-count errors were fixed without suppressing
or weakening analysis rules. An isolated PHP 8.5.11 runtime was also used locally
for PHPStan and in-memory SQLite tests during review; local test databases must
never point to production.
Existing generated Wayfinder files allow local frontend builds with
`SKIP_WAYFINDER=1`; normal builds regenerate helpers using Artisan.

## Deployment connection: pending

Automatic deployment has deliberately been disabled. The remaining manual
workflow and root `deploy.sh` target a legacy Ubuntu VPS, not this host.
Do not run them or add credentials to activate them for Spaceship.

Next, configure a separate deployment key and a Spaceship-specific workflow that
builds tested source in GitHub Actions, transfers the selected revision, uses
the correct PHP runtime, preserves live data/custom index, runs migrations,
copies built/editorial assets to the separate document root, and verifies health.
Configure host key verification and backups before enabling automatic deployment.
Do not use the developer's personal SSH key or change the server APP_KEY.

The previous chat proposed SSH_HOST, SSH_PORT, SSH_USERNAME, SSH_PRIVATE_KEY,
APP_PATH and PUBLIC_PATH. The legacy workflow instead reads SSH_USER/SSH_KEY.
Choose the final secret names when replacing that workflow; adding secrets alone
does not connect this repository to hosting.
