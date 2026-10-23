<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Process\Exceptions\ProcessTimedOutException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;

#[Signature('workshop:doctor {--url= : Running app URL (defaults to APP_URL)}')]
#[Description('Check the local workshop setup and print fixes for anything missing')]
class WorkshopDoctor extends Command
{
    private bool $failed = false;

    public function handle(): int
    {
        $this->failed = false;
        $this->check(PHP_VERSION_ID >= 80500, 'Running PHP '.PHP_VERSION, 'use PHP 8.5 to run Artisan');

        preg_match('/PHP (\d+\.\d+\.\d+)/', $this->process('php -v'), $php);
        $version = $php[1] ?? 'missing';
        $this->check(isset($php[1]) && version_compare($version, '8.5', '>='), 'PHP on PATH '.$version,
            'your `php` alias points at '.$version.'; point Herd/your shell at PHP 8.5; also check `php -v` in your interactive shell');

        preg_match('/v(\d+\.\d+\.\d+)/', $this->process('node --version'), $node);
        $this->check(isset($node[1]) && version_compare($node[1], '24.0.0', '>='), 'Node '.($node[1] ?? 'missing'), 'install Node 24; run `nvm install && nvm use` if you use nvm');
        $this->check(File::exists(base_path('.env')), '.env', 'run `cp .env.example .env`');
        $this->check(filled(config('app.key')), 'APP_KEY', 'run `php artisan key:generate`');

        $sqlite = File::exists(database_path('database.sqlite'));
        $this->check($sqlite, 'SQLite file', 'run `touch database/database.sqlite && php artisan migrate:fresh --seed`');

        $seeded = false;

        try {
            $seeded = $sqlite && config('database.default') === 'sqlite'
                && DB::table('users')->where('email', 'admin@example.com')->exists();
        } catch (QueryException) {
            // A missing users table means migrations have not run yet.
        }

        $this->check($seeded, 'Seeded SQLite admin@example.com', 'set DB_CONNECTION=sqlite and run `touch database/database.sqlite && php artisan migrate:fresh --seed` (resets local workshop data)');

        $memoryFix = 'set Herd › PHP › memory_limit = -1, or set memory_limit=512M in the active php.ini; CLI and web limits differ; `php artisan serve` commonly runs unbounded';
        $memory = (string) ini_get('memory_limit');
        $this->check($this->enoughMemory($memory), 'CLI memory_limit='.$memory, $memoryFix);

        $url = rtrim($this->option('url') ?: config('app.url'), '/').'/__workshop/php-info';
        $webMemory = $this->webMemory($url);
        $this->check($webMemory !== null && $this->enoughMemory($webMemory), 'Web memory_limit='.($webMemory ?? 'unverified'),
            $webMemory === null
                ? 'start `php artisan serve` and rerun to verify the web memory limit; set APP_URL or pass --url to match your local server (APP_ENV=local)'
                : $memoryFix);

        $this->check(File::isDirectory(base_path('vendor')), 'vendor/', 'run `composer install`');
        $this->check(File::isDirectory(base_path('node_modules')), 'node_modules/', 'run `npm install`');

        $built = File::exists(public_path('build/manifest.json'));

        if (! $built) {
            try {
                $built = Http::timeout(2)->get('http://localhost:5173/@vite/client')->successful();
            } catch (ConnectionException) {
                $built = false;
            }
        }

        $this->check($built, 'Vite assets', 'run `npm run dev` in a second terminal, or `npm run build`');

        $branch = $this->process('git branch --show-current');
        $this->check($branch !== '', 'Current branch: '.($branch ?: 'detached or unavailable'), 'run `git switch main` or switch to the checkpoint on screen');
        $refs = explode("\n", $this->process('git for-each-ref --format="%(refname:short)" refs/heads/checkpoint/ refs/remotes/origin/checkpoint/ refs/remotes/upstream/checkpoint/'));
        $missing = [];

        foreach (['01-diagnose', '02-queries', '03-cache', '04-queues', '05-stampede', '06-octane', '07-ai-agent', '08-ai-performance'] as $checkpoint) {
            if (! in_array('checkpoint/'.$checkpoint, $refs, true)
                && ! in_array('origin/checkpoint/'.$checkpoint, $refs, true)
                && ! in_array('upstream/checkpoint/'.$checkpoint, $refs, true)) {
                $missing[] = $checkpoint;
            }
        }

        $this->check($missing === [], 'Checkpoint branches'.($missing ? ' missing: '.implode(', ', $missing) : ': all 8 present'),
            'you forked main only — re-fork with all branches, or `git remote add upstream https://github.com/DGarbs51/ship-fast-load-faster && git fetch upstream`');

        return $this->failed ? self::FAILURE : self::SUCCESS;
    }

    private function check(bool $passes, string $label, string $fix): void
    {
        $this->line(($passes ? '✓ ' : '✗ ').$label.($passes ? '' : ' — '.$fix));
        $this->failed = $this->failed || ! $passes;
    }

    private function process(string $command): string
    {
        try {
            $result = Process::path(base_path())->timeout(5)->run($command);

            return $result->successful() ? trim($result->output()) : '';
        } catch (ProcessTimedOutException) {
            return '';
        }
    }

    private function webMemory(string $url): ?string
    {
        try {
            $response = Http::timeout(3)->get($url);
            $memory = $response->json('memory_limit');

            return $response->successful() && is_string($memory) ? $memory : null;
        } catch (ConnectionException) {
            return null;
        }
    }

    private function enoughMemory(string $limit): bool
    {
        return $limit === '-1' || (preg_match('/^\d+[KMG]?$/i', $limit) === 1 && ini_parse_quantity($limit) >= 512 * 1024 * 1024);
    }
}
