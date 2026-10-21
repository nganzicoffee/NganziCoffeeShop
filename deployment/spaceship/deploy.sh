#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
revision=${1:?Missing revision}
run=${2:?Missing run ID}
attempt=${3:?Missing attempt}
digest=${4:?Missing archive checksum}
[[ "$revision" =~ ^[0-9a-f]{40}$ && "$run" =~ ^[0-9]+$ && "$attempt" =~ ^[0-9]+$ && "$digest" =~ ^[0-9a-f]{64}$ ]]
test "$HOME" = /home/qpcgrmbjuy
app="$HOME/nganzi-app"
public="$HOME/nganzicoffee.com"
work="$HOME/.nganzi-deploy"
release="$revision-$run-$attempt"
archive="$work/incoming/$release.tar.gz"
stage="$work/staging/$release"
backup="$work/backups/$release"
mkdir -p "$work"
exec 9>"$work/deploy.lock"
flock -w 600 9
test -f "$app/.env" && test -f "$public/index.php"
test -f "$archive"
echo "$digest  $archive" | sha256sum --check --status
if tar -tzf "$archive" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
    echo 'Unsafe archive path.' >&2
    exit 1
fi
mkdir -p "$stage" "$backup/app" "$backup/public"
# Private parent directories protect staging; preserve package modes within it.
tar --no-same-owner --same-permissions -xzf "$archive" -C "$stage"
chmod 755 "$stage"
test -f "$stage/vendor/autoload.php"
test -f "$stage/public/build/manifest.json"
test ! -e "$stage/.env"
nganzi_php() {
    /opt/alt/php85/usr/bin/php -d extension=phar.so -d extension=mbstring.so -d extension=dom.so -d extension=fileinfo.so -d extension=bcmath.so -d extension=gd.so -d extension=zip.so "$@"
}

# Backups stay outside the domain document root.
nganzi_php "$stage/deployment/spaceship/backup-database.php" "$app" "$backup/database.sql"
for directory in app bootstrap config database resources routes vendor; do
    rsync -a "$app/$directory/" "$backup/app/$directory/"
done
for file in artisan composer.json composer.lock; do
    cp -p "$app/$file" "$backup/app/$file"
done
for directory in build assets; do
    if [ -d "$public/$directory" ]; then
        rsync -a "$public/$directory/" "$backup/public/$directory/"
    fi
done

mutated=false
rollback() {
    status=$?
    trap - ERR
    if [ "$mutated" = true ]; then
        echo 'Deployment failed; restoring application and public assets.' >&2
        for directory in app bootstrap config database resources routes vendor; do
            rsync -a --delete "$backup/app/$directory/" "$app/$directory/" || true
        done
        for file in artisan composer.json composer.lock; do
            cp -p "$backup/app/$file" "$app/$file" || true
        done
        for directory in build assets; do
            if [ -d "$backup/public/$directory" ]; then
                rsync -a --delete --chmod=D755,F644 "$backup/public/$directory/" "$public/$directory/" || true
            fi
        done
        chmod 755 "$public" || true
        cd "$app"
        nganzi_php artisan config:clear || true
        nganzi_php artisan route:clear || true
        nganzi_php artisan view:clear || true
        nganzi_php artisan up || true
        echo "File rollback attempted. Database backup: $backup/database.sql; migrations are not automatically reversed." >&2
    fi
    exit "$status"
}
trap rollback ERR
cd "$app"
mutated=true
nganzi_php artisan down --retry=60
for directory in app config resources routes vendor; do
    rsync -a --delete "$stage/$directory/" "$app/$directory/"
done
rsync -a --delete --exclude '/cache/' "$stage/bootstrap/" "$app/bootstrap/"
rsync -a --exclude '*.sqlite' --exclude '*.sqlite-*' "$stage/database/" "$app/database/"
rsync -a --exclude '/.env' --exclude '/storage/' --exclude '/public/' --exclude '/vendor/' --exclude '/app/' --exclude '/config/' --exclude '/resources/' --exclude '/routes/' --exclude '/bootstrap/' --exclude '/database/' "$stage/" "$app/"
rm -f "$app/bootstrap/cache/packages.php" "$app/bootstrap/cache/services.php" "$app/bootstrap/cache/config.php"
nganzi_php artisan package:discover
nganzi_php artisan migrate --force
nganzi_php artisan config:clear
nganzi_php artisan route:clear
nganzi_php artisan view:clear

# Preserve the domain's customized index.php, .htaccess and storage link.
mkdir -p "$public/build" "$public/assets"
rsync -a --chmod=D755,F644 --exclude '/manifest.json' "$stage/public/build/" "$public/build/"
cp "$stage/public/build/manifest.json" "$public/build/manifest.json.next"
mv "$public/build/manifest.json.next" "$public/build/manifest.json"
rsync -a --delete --chmod=D755,F644 "$stage/public/assets/" "$public/assets/"
rsync -a --chmod=D755,F644 --exclude '/index.php' --exclude '/.htaccess' --exclude '/storage' --exclude '/build/' --exclude '/assets/' "$stage/public/" "$public/"
chmod 755 "$public"
if [ ! -e "$public/storage" ] && [ ! -L "$public/storage" ]; then
    ln -s "$app/storage/app/public" "$public/storage"
fi
nganzi_php artisan queue:restart
nganzi_php artisan up
curl --fail --silent --show-error --retry 3 --retry-delay 2 'https://nganzicoffee.com/up' -o /dev/null
curl --fail --silent --show-error --retry 3 --retry-delay 2 'https://nganzicoffee.com/shop' -o /dev/null
printf '%s\n' "$revision" > "$public/deployment-revision.txt"
chmod 644 "$public/deployment-revision.txt"
printf '%s\n' "$revision" > "$work/current-revision"
trap - ERR
echo "Deployed $revision. Backups: $backup"
# Only remove validated, private deployment working paths after success.
rm -rf -- "$stage"
rm -f -- "$archive"
while read -r retired; do
    [[ "$retired" =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]] || exit 1
    rm -rf -- "$work/backups/$retired"
done < <(find "$work/backups" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %f\n' | sort -nr | awk 'NR > 5 {print $2}')
