<?php

namespace App\Console\Commands;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

#[Signature('workshop:bench {paths?* : Paths to request (defaults to every workshop page)} {--runs=3 : Requests per path} {--user=admin@example.com : Email of the user to authenticate as}')]
#[Description('Request pages in-process and report response time and query count per path')]
class WorkshopBench extends Command
{
    /**
     * @var list<string>
     */
    private const array DEFAULT_PATHS = ['/dashboard', '/products', '/orders', '/customers'];

    public function handle(Kernel $kernel): int
    {
        $user = User::where('email', $this->option('user'))->first();

        if ($user === null) {
            $this->error('User not found. Run `php artisan migrate:fresh --seed` first.');

            return self::FAILURE;
        }

        if (app()->bound('debugbar')) {
            app('debugbar')->disable();
        }

        $queryCount = 0;
        $queryTimeMs = 0.0;

        DB::listen(function (QueryExecuted $query) use (&$queryCount, &$queryTimeMs): void {
            $queryCount++;
            $queryTimeMs += $query->time;
        });

        $runs = max(1, (int) $this->option('runs'));
        $rows = [];

        foreach ($this->argument('paths') ?: self::DEFAULT_PATHS as $path) {
            $timings = [];
            $queries = 0;
            $queryTime = 0.0;
            $status = 0;

            for ($run = 0; $run < $runs; $run++) {
                Auth::login($user);

                $queryCount = 0;
                $queryTimeMs = 0.0;

                $request = Request::create($path, 'GET', server: [
                    'HTTP_X_INERTIA' => 'true',
                    'HTTP_ACCEPT' => 'text/html, application/xhtml+xml',
                ]);
                $request->headers->set('X-Inertia-Version', (string) app(HandleInertiaRequests::class)->version($request));

                $startedAt = hrtime(true);
                $response = $kernel->handle($request);
                $timings[] = (hrtime(true) - $startedAt) / 1_000_000;

                $kernel->terminate($request, $response);

                $status = $response->getStatusCode();
                $queries = $queryCount;
                $queryTime = $queryTimeMs;
            }

            sort($timings);

            $rows[] = [
                $path,
                $status,
                number_format(array_sum($timings) / count($timings), 1),
                number_format($timings[0], 1),
                number_format($timings[count($timings) - 1], 1),
                $queries,
                number_format($queryTime, 1),
            ];
        }

        $this->table(['Path', 'Status', 'Avg ms', 'Min ms', 'Max ms', 'Queries (last run)', 'Query ms (last run)'], $rows);

        $failed = array_filter($rows, fn (array $row): bool => $row[1] !== 200);

        if ($failed !== []) {
            $this->error('Non-200 responses: timings for '.implode(', ', array_column($failed, 0)).' are not meaningful.');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
