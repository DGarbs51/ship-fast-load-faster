<?php

namespace App\Console\Commands;

use App\Services\DashboardStats;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;

#[Signature('workshop:stampede {--workers=8 : Concurrent processes hitting the cold cache}')]
#[Description('Invalidate the dashboard cache, then hit it from several processes at once and count how many rebuilt it')]
class WorkshopStampede extends Command
{
    public function handle(): int
    {
        DashboardStats::flush();

        $worker = function (): array {
            $rebuilds = 0;

            DB::listen(function (QueryExecuted $query) use (&$rebuilds): void {
                if (str_contains($query->sql, 'sum(line_total)')) {
                    $rebuilds++;
                }
            });

            $startedAt = hrtime(true);
            app(DashboardStats::class)->topProducts();

            return ['rebuilds' => $rebuilds, 'ms' => (hrtime(true) - $startedAt) / 1_000_000];
        };

        $results = Concurrency::run(array_fill(0, max(1, (int) $this->option('workers')), $worker));

        $this->table(['Worker', 'Rebuilt cache?', 'ms'], collect($results)->map(fn (array $result, int $index): array => [
            $index + 1,
            $result['rebuilds'] > 0 ? 'yes' : 'no',
            number_format($result['ms'], 1),
        ]));

        $this->info(collect($results)->sum('rebuilds').' of '.count($results).' workers ran the expensive query.');

        return self::SUCCESS;
    }
}
