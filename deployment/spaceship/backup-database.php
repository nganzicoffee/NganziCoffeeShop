<?php

// CLI-only: credentials never appear in command arguments or release artifacts.
use Illuminate\Contracts\Console\Kernel;
use Symfony\Component\Process\Process;

if (PHP_SAPI !== 'cli' || count($argv) !== 3) {
    exit(1);
}

require $argv[1].'/vendor/autoload.php';
$app = require $argv[1].'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$database = config('database.connections.'.config('database.default'));
if ($database['driver'] !== 'mysql') {
    throw new RuntimeException('This hosting backup expects MySQL.');
}
$optionFile = tempnam(dirname($argv[2]), 'mysql-');
chmod($optionFile, 0600);
$quote = static fn (string $value): string => '"'.str_replace(
    ['\\', '"', "\n", "\r"], ['\\\\', '\\"', '\\n', '\\r'], $value,
).'"';
try {
    $options = "[client]\n";
    foreach (['host' => 'host', 'port' => 'port', 'username' => 'user', 'password' => 'password', 'unix_socket' => 'socket'] as $key => $option) {
        if (isset($database[$key]) && $database[$key] !== '') {
            $options .= $option.'='.$quote((string) $database[$key])."\n";
        }
    }
    file_put_contents($optionFile, $options);
    $process = new Process([
        'mysqldump', '--defaults-extra-file='.$optionFile,
        '--single-transaction', '--quick', '--skip-lock-tables', '--no-tablespaces',
        '--result-file='.$argv[2], $database['database'],
    ]);
    $process->setTimeout(300);
    $process->run();
    if (! $process->isSuccessful()) {
        throw new RuntimeException('Database backup failed; deployment stopped before changing application files.');
    }
    chmod($argv[2], 0600);
} finally {
    unlink($optionFile);
}
