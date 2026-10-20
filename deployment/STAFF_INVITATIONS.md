# Staff invitations on Spaceship

Owner/Admin accounts can invite any of the four staff roles from Admin → Staff.
The recipient gets a six-digit code and an unguessable setup link. They choose
their own password and are marked verified only after proving access to the email.
Existing accounts are never overwritten. Codes expire in 30 minutes, allow five
incorrect guesses, and cannot be reused. Resend rotates both link and code; owners
can cancel pending invitations. These actions are recorded in the audit log.

## Configure Resend without adding PHP dependencies

Use Resend's SMTP relay with Laravel's existing SMTP mailer. Verify the exact
sending domain in the Resend dashboard first. Existing DNS for `auth.nganzicoffee.com`
does not by itself verify `nganzicoffee.com`: if only the subdomain is verified,
use a sender such as `notifications@auth.nganzicoffee.com`, or verify the apex
domain to send as `auth@nganzicoffee.com`.

Set the following in the SERVER `.env` (never commit the real API key):

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_USERNAME=resend
MAIL_PASSWORD="YOUR_RESEND_API_KEY"
MAIL_FROM_ADDRESS="auth@nganzicoffee.com"
MAIL_FROM_NAME="Nganzi Coffee"
```

Remove an old `MAIL_URL` override if present. Use a sending key authorized for the
verified domain, paste it privately, and keep Resend's paid overages disabled if
you want to remain on its free plan. Check the current quota in your account.
An accepted SMTP send does not guarantee inbox delivery; check Resend delivery
events and spam folders when testing. Password resets use the same mailer.

Invitations send synchronously so they do not require a queue worker. Order
notifications still require the existing queue worker/cron setup.

Official references:

- https://resend.com/docs/send-with-smtp
- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/pricing

## Deployment

Back up the database and the PHP files being replaced. The update archive is
extracted into `~/nganzi-app`; it contains no `.env`, credentials, vendor directory,
or customer data. Keep the domain's customized `index.php` unchanged.

Run these commands from `~/nganzi-app` in the SSH session. Define this shell helper
once per session to use the right PHP binary and extensions:

```bash
nganzi_php() { /opt/alt/php85/usr/bin/php -d extension=phar.so -d extension=mbstring.so -d extension=dom.so -d extension=fileinfo.so -d extension=bcmath.so -d extension=gd.so -d extension=zip.so "$@"; }
nganzi_php artisan migrate --force
nganzi_php artisan config:clear
nganzi_php artisan route:clear
nganzi_php artisan view:clear
cp -a public/build/. ~/nganzicoffee.com/build/
```

The new migration creates only the staff invitations table. The established staff
accounts and passwords are unchanged. The CLI `staff:create` fix is included so
trusted CLI-provisioned staff also get their intended verified status.

Test with an owner and a NEW email address: invite, inspect delivery, accept with
the OTP and a strong password, log in, check the assigned role and Staff list,
and try replaying the setup link. Test resend and cancel using separate invitations.
If rollback is needed, restore the previous PHP/build files; leaving the additional
invitations table in place is safe. Do not run a broad migration rollback against
the production database.

## Validation limits

Feature coverage is in `tests/Feature/Admin/StaffInvitationTest.php`. Run it on
the project's supported PHP runtime with development dependencies and an isolated
test database, never the production database. Frontend type checking and the
production build can run locally using the downloaded Wayfinder helpers:

```powershell
$env:SKIP_WAYFINDER='1'
npm run types:check
npm run build
```

Regenerate Wayfinder helpers whenever backend routes change before a future build.
The invitation UI itself uses direct URLs and does not depend on newly generated
helpers.
