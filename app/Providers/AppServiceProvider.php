<?php

namespace App\Providers;

use App\Support\AuditContext;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->environment('local') && class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);
        }

        // Under Octane, singleton() would capture the first request's user and log every
        // later change as them. scoped() is flushed and re-resolved for each request.
        $this->app->scoped(AuditContext::class, fn (Application $app): AuditContext => new AuditContext($app['auth']->user()));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimits();
        $this->logSlowQueries();
    }

    /**
     * Every advisor prompt costs money, so it is rate limited per user. Polling for a
     * queued deep analysis only reloads the deep-analysis props, never prompts a
     * model, and is not counted against that budget.
     */
    protected function configureRateLimits(): void
    {
        RateLimiter::for('advisor', function (Request $request): Limit {
            $partialProps = $request->header('X-Inertia-Partial-Data');
            $promptsModel = $request->filled('question') && ($partialProps === null || str_contains($partialProps, 'answer'));

            return $promptsModel
                ? Limit::perMinute(20)->by('advisor:'.$request->user()?->id)
                : Limit::none();
        });

        RateLimiter::for('advisor-deep-analysis', fn (Request $request): Limit => Limit::perMinute(5)->by('advisor-deep-analysis:'.$request->user()?->id));
    }

    /**
     * Log any query slower than the threshold so slow spots surface outside Debugbar too.
     */
    protected function logSlowQueries(): void
    {
        if (! $this->app->environment('local')) {
            return;
        }

        DB::listen(function (QueryExecuted $query): void {
            if ($query->time < 50) {
                return;
            }

            Log::channel('single')->warning('Slow query', [
                'ms' => $query->time,
                'sql' => $query->toRawSql(),
                'url' => request()->fullUrl(),
            ]);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        Model::preventLazyLoading(! app()->isProduction());

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
