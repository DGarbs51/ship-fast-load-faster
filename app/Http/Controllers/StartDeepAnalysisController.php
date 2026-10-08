<?php

namespace App\Http\Controllers;

use App\Ai\AdvisorCache;
use App\Http\Requests\AskProductAdvisorRequest;
use App\Jobs\RunDeepAnalysis;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;

class StartDeepAnalysisController extends Controller
{
    public function __invoke(AskProductAdvisorRequest $request): RedirectResponse
    {
        $question = (string) $request->validated('question');

        if ($question !== '' && Cache::missing(AdvisorCache::deepAnalysis($question))) {
            Cache::put(AdvisorCache::deepAnalysisPending($question), true, now()->addMinutes(10));
            RunDeepAnalysis::dispatch($question);
        }

        return to_route('advisor', ['question' => $question]);
    }
}
