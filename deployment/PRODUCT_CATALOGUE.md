# Product catalogue update for Spaceship

## Behaviour

- The New Product form accepts category selection or a new category name, pack
  sizes (e.g. 250g, 500g), whole-shilling UGX prices per pack, and packs in stock.
- Upload a front image and an optional back image in the same submission. JPG,
  PNG and WebP are accepted, up to 4 MB per file. The database changes are atomic
  and uploaded files are cleaned up when creation fails.
- The normal/front image is the first image; the second appears while hovering
  over a card or focusing its image link. Leaving restores the first image. With
  one image, no replacement occurs. Touch visitors see the front image; both
  images remain available on the product detail page.
- Edit Product retains pack price editing and audited stock adjustments. The
  image panel labels the first two positions and lets staff swap the front image.
  New uploads are limited to two images; existing extra images are preserved.
- Existing catalogue permissions apply: owners, inventory managers and order
  managers can edit catalogue details; reporting staff cannot. Stock adjustments
  remain restricted to owners and inventory managers. Initial stock continues
  to be supported on product/pack creation and now records inventory movements.
- Cards keep the established four-column layout, cream image panels, descriptions,
  pack selectors and shopping controls. The Call to order link is a normal
  `tel:+256786707449` anchor. It opens the device's configured telephone handler;
  the visitor confirms the call. Desktop computers need a telephone-capable app.

## Owner-set USD display

In Admin → Store Settings → Currency display, enter UGX per 1 USD. No exchange rate
is invented or fetched automatically. The default value 0 disables USD selection.
An owner can change the rate at any time; changes are audited with other settings.

Visitors can choose UGX or USD in the navigation menu (inside the menu on small
screens). The choice applies to cards, product pages, cart, checkout and order
confirmation. USD estimates are rounded to cents and marked with ≈. Values are
computed from canonical UGX amounts, not converted back and forth. Selection is
remembered in local storage where permitted. Checkout and confirmation also show
the canonical UGX total. This is not a USD payment integration: orders, payments,
tax and inventory calculations remain unchanged in UGX.

## Deploy

The archive `deployment/releases/product-catalogue-update.tar.gz` contains the
changed PHP/frontend sources, compiled assets and tests, not `.env`, secrets,
uploaded product images, or database contents. It requires no new tables.
Back up current application files, then extract into `~/nganzi-app`.

Use PHP 8.5 with the previously configured CLI extensions for Artisan commands.
Clear configuration, routes, and views, then copy built assets:

```bash
nganzi_php() { /opt/alt/php85/usr/bin/php -d extension=phar.so -d extension=mbstring.so -d extension=dom.so -d extension=fileinfo.so -d extension=bcmath.so -d extension=gd.so -d extension=zip.so "$@"; }
nganzi_php artisan config:clear
nganzi_php artisan route:clear
nganzi_php artisan view:clear
cp -a public/build/. ~/nganzicoffee.com/build/
```

Keep the domain's customized `index.php` in place. For public product uploads,
first inspect the storage link:

```bash
ls -ld ~/nganzicoffee.com/storage
```

If the path does NOT exist, create this link (do not replace an existing directory):

```bash
ln -s /home/qpcgrmbjuy/nganzi-app/storage/app/public /home/qpcgrmbjuy/nganzicoffee.com/storage
```

Keep `MEDIA_DISK=public` for this deployment. PHP for this domain should allow a
`post_max_size` of at least 16M and `upload_max_filesize` of at least 4M to accept
two 4 MB images plus the form fields. Configure these for the Nganzi domain only.

Create a draft product with confirmed details, both images and two pack sizes.
Publish it when ready, then check images, hover/focus restoration, different pack
prices, stock, calling, USD switching, cart pricing and the final UGX checkout
amount on a phone and desktop. A single-image product should never disappear on
hover. Test inventory adjustment under the intended staff role. Existing data is
not replaced or seeded by this update.

## Validation

Frontend checks: `npm run types:check`, lint on changed frontend files, production
build, and `node --test tests/frontend/price.test.mjs` (Node 22.18+ or 24).
Backend tests: `tests/Feature/Admin/ProductCatalogueSetupTest.php`. Run those with
supported PHP, installed development dependencies and an isolated test database,
never the live database. Local PHP 8.2 cannot run this project's backend suite;
PHP syntax checks do not replace runtime tests.
