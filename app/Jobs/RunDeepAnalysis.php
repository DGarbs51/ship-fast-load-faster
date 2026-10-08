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

    public function handle(): void
    {
        $response = (new DeepProductAnalyst)->prompt($this->question);

        Cache::put(AdvisorCache::deepAnalysis($this->question), [
            'recommendations' => $response['recommendations'],
            'confidence' => (float) $response['confidence'],
            'reasoning' => $response['reasoning'],
            'tokens' => $response->usage->inputTokens + $response->usage->outputTokens,
        ], now()->addDay());

        Cache::forget(AdvisorCache::deepAnalysisPending($this->question));
    }

    public function failed(?Throwable $exception): void
    {
        Cache::forget(AdvisorCache::deepAnalysisPending($this->question));
        Cache::put(AdvisorCache::deepAnalysis($this->question), ['error' => 'Deep analysis failed. Try again later.'], now()->addMinutes(5));
    }
}
