#!/usr/bin/env bash
set -euo pipefail
test "$(id -un)" = qpcgrmbjuy
test "$HOME" = /home/qpcgrmbjuy
test -f "$HOME/nganzi-app/.env"
test -f "$HOME/nganzicoffee.com/index.php"
test -d "$HOME/nganzi-app/storage/app/public"
test -x /opt/alt/php85/usr/bin/php
for tool in tar rsync flock curl mysqldump sha256sum; do
    command -v "$tool" >/dev/null
done
/opt/alt/php85/usr/bin/php -d extension=phar.so -d extension=mbstring.so -d extension=dom.so -d extension=fileinfo.so -d extension=bcmath.so -d extension=gd.so -d extension=zip.so -r 'exit(PHP_VERSION_ID >= 80500 && extension_loaded("pdo_mysql") ? 0 : 1);'
echo 'Spaceship SSH connection, PHP 8.5 and deployment prerequisites passed.'
