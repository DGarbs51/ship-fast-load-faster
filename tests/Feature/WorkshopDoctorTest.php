<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Schema;

function fakeDoctorSetup(array $processes = [], array $missingFiles = [], mixed $webMemory = '512M', bool $vite = false, string $refPrefix = 'origin/'): void
{
    $refs = array_map(fn (string $name): string => $refPrefix.'checkpoint/'.$name,
        ['01-diagnose', '02-queries', '03-cache', '04-queues', '05-stampede', '06-octane', '07-ai-agent', '08-ai-performance']);

    Process::fake(array_merge([
        'php -v' => 'PHP 8.5.0 (cli)',
        'node --version' => 'v24.0.0',
        'git branch --show-current' => 'main',
        'git for-each-ref *' => implode("\n", $refs),
    ], $processes));
    Process::preventStrayProcesses();
    Http::fake([
        'http://workshop.test/__workshop/php-info' => $webMemory === null ? Http::failedConnection() : Http::response(['memory_limit' => $webMemory]),
        'http://localhost:5173/@vite/client' => $vite ? Http::response('vite client') : Http::failedConnection(),
    ]);
    Http::preventStrayRequests();
    File::partialMock()->shouldReceive('exists')->withArgs(fn (string $path): bool => in_array($path, [base_path('.env'), database_path('database.sqlite'), public_path('build/manifest.json')], true))
        ->andReturnUsing(fn (string $path): bool => ! in_array($path, $missingFiles, true));
    File::shouldReceive('isDirectory')->withArgs(fn (string $path): bool => in_array($path, [base_path('vendor'), base_path('node_modules')], true))
        ->andReturnUsing(fn (string $path): bool => ! in_array($path, $missingFiles, true));
    config(['app.url' => 'http://workshop.test', 'app.key' => 'base64:'.base64_encode(str_repeat('a', 32))]);
}

test('doctor accepts a ready setup and checkpoints from each supported remote', function (string $prefix) {
    fakeDoctorSetup(refPrefix: $prefix);

    $this->artisan('workshop:doctor')
        ->expectsOutputToContain('✓ Web memory_limit=512M')
        ->expectsOutputToContain('✓ Checkpoint branches: all 8 present')
        ->assertSuccessful();
})->with(['', 'origin/', 'upstream/']);

test('doctor rejects old or unavailable runtimes and incomplete git checkouts', function (string $command, mixed $output, string $message) {
    fakeDoctorSetup([$command => $output]);

    $this->artisan('workshop:doctor')->expectsOutputToContain($message)->assertFailed();
})->with([
    ['php -v', 'PHP 8.4.99 (cli)', 'your `php` alias points at 8.4.99'],
    ['node --version', 'v23.99.0', 'install Node 24'],
    ['node --version', '', 'Node missing'],
    ['git branch --show-current', '', 'detached or unavailable'],
    ['git for-each-ref *', 'origin/checkpoint/01-diagnose', 'you forked main only'],
]);

test('doctor rejects missing setup files and dependencies', function (string $path, string $message) {
    fakeDoctorSetup(missingFiles: [base_path($path)]);

    $this->artisan('workshop:doctor')->expectsOutputToContain($message)->assertFailed();
})->with([
    ['.env', '✗ .env'],
    ['database/database.sqlite', '✗ SQLite file'],
    ['vendor', '✗ vendor/'],
    ['node_modules', '✗ node_modules/'],
    ['public/build/manifest.json', '✗ Vite assets'],
]);

test('doctor accepts a running Vite server without a build', function () {
    fakeDoctorSetup(missingFiles: [public_path('build/manifest.json')], vite: true);

    $this->artisan('workshop:doctor')->expectsOutputToContain('✓ Vite assets')->assertSuccessful();
});

test('doctor reports an unset app key', function () {
    fakeDoctorSetup();
    config(['app.key' => '']);

    $this->artisan('workshop:doctor')->expectsOutputToContain('php artisan key:generate')->assertFailed();
});

test('doctor reports an unseeded or unmigrated database', function (bool $dropTable) {
    fakeDoctorSetup();

    if ($dropTable) {
        Schema::drop('users');
    } else {
        DB::table('users')->where('email', 'admin@example.com')->delete();
    }

    $this->artisan('workshop:doctor')->expectsOutputToContain('✗ Seeded SQLite admin@example.com')->assertFailed();
})->with([false, true]);

test('doctor reports an index migration that ran without the orders block', function () {
    fakeDoctorSetup();
    DB::table('migrations')->updateOrInsert(['migration' => '2026_10_08_030306_add_performance_indexes'], ['batch' => 99]);

    if (Schema::hasIndex('orders', ['created_at'])) {
        Schema::table('orders', fn ($table) => $table->dropIndex(['created_at']));
    }

    $this->artisan('workshop:doctor')
        ->expectsOutputToContain('✗ Performance indexes include orders — the index migration ran before the orders block was in it; run `php artisan migrate:fresh --seed`')
        ->assertFailed();
});

test('doctor validates web memory separately from CLI memory', function (mixed $memory, bool $passes) {
    fakeDoctorSetup(webMemory: $memory);

    $this->artisan('workshop:doctor')
        ->expectsOutputToContain(($passes ? '✓' : '✗').' Web memory_limit=')
        ->assertExitCode($passes ? 0 : 1);
})->with([
    ['-1', true], ['1G', true], ['536870912', true],
    ['511M', false], ['128M', false], ['garbage', false], [null, false],
]);

test('doctor rejects a low CLI limit even when the web limit passes', function () {
    fakeDoctorSetup();
    $previous = ini_set('memory_limit', '128M');

    try {
        $this->artisan('workshop:doctor')->expectsOutputToContain('✗ CLI memory_limit=128M')->assertFailed();
    } finally {
        ini_set('memory_limit', $previous);
    }
});

test('doctor reads the explicitly selected server', function () {
    fakeDoctorSetup();
    Http::fake(['http://127.0.0.1:8000/__workshop/php-info' => Http::response(['memory_limit' => '-1'])]);

    $this->artisan('workshop:doctor', ['--url' => 'http://127.0.0.1:8000/'])
        ->expectsOutputToContain('✓ Web memory_limit=-1')->assertSuccessful();
});

test('php info exposes only the memory limit in local development', function () {
    $this->app->instance('env', 'local');

    $this->getJson('/__workshop/php-info')->assertOk()->assertExactJson(['memory_limit' => ini_get('memory_limit')]);
});

test('php info is unavailable outside local development', function () {
    $this->app->instance('env', 'production');

    $this->getJson('/__workshop/php-info')->assertNotFound();
});
