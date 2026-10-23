<?php

namespace App\Jobs;

use App\Ai\AdvisorCache;
use App\Ai\Agents\DeepProductAnalyst;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Throwable;

class RunDeepAnalysis implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 240;

    public function __construct(public string $question) {}

    public function uniqueId(): string
    {
        return AdvisorCache::hash($this->question);
    }

    /**
     * Exercise 4.3: paste handle() here. No request dispatches this job until checkpoint 08.
     *
     * @see DeepProductAnalyst
     */
    public function handle(): void {}

    public function failed(?Throwable $exception): void
    {
        Cache::forget(AdvisorCache::deepAnalysisPending($this->question));
        Cache::put(AdvisorCache::deepAnalysis($this->question), ['error' => 'Deep analysis failed. Try again later.'], now()->addMinutes(5));
    }
}
