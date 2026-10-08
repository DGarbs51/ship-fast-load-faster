<?php

namespace App\Http\Controllers;

use App\Ai\AdvisorCache;
use App\Ai\Agents\ProductAdvisor;
use App\Http\Requests\AskProductAdvisorRequest;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProductAdvisorController extends Controller
{
    public function __invoke(AskProductAdvisorRequest $request): Response
    {
        $question = $request->validated('question');

        return Inertia::render('advisor', [
            'question' => $question,
            'answer' => $question ? fn (): array => $this->ask($question) : null,
            'deepAnalysis' => $question ? fn (): ?array => Cache::get(AdvisorCache::deepAnalysis($question)) : null,
            'deepAnalysisPending' => $question && Cache::has(AdvisorCache::deepAnalysisPending($question)),
        ]);
    }

    /**
     * Full answers are safe to cache here: the prompt carries no per-user context,
     * and recommendations an hour old are still useful. Failures are never cached.
     *
     * @return array{recommendations: list<array{product_id: int, name: string, reason: string}>, confidence: float, reasoning: string, tokens: int, cached: bool}|array{error: string}
     */
    private function ask(string $question): array
    {
        $cached = Cache::get(AdvisorCache::answer($question));

        if ($cached !== null) {
            return [...$cached, 'cached' => true];
        }

        try {
            $response = (new ProductAdvisor)->prompt($question);
        } catch (Throwable $exception) {
            report($exception);

            return ['error' => 'The advisor is unavailable right now. Check your AI provider key in .env.'];
        }

        $answer = [
            'recommendations' => $response['recommendations'],
            'confidence' => (float) $response['confidence'],
            'reasoning' => $response['reasoning'],
            'tokens' => $response->usage->inputTokens + $response->usage->outputTokens,
        ];

        Cache::put(AdvisorCache::answer($question), $answer, now()->addHour());

        return [...$answer, 'cached' => false];
    }
}
