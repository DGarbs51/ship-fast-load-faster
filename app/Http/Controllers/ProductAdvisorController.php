<?php

namespace App\Http\Controllers;

use App\Ai\Agents\ProductAdvisor;
use App\Http\Requests\AskProductAdvisorRequest;
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
        ]);
    }

    /**
     * @return array{recommendations: list<array{product_id: int, name: string, reason: string}>, confidence: float, reasoning: string, tokens: int}|array{error: string}
     */
    private function ask(string $question): array
    {
        try {
            $response = (new ProductAdvisor)->prompt($question);
        } catch (Throwable $exception) {
            report($exception);

            return ['error' => 'The advisor is unavailable right now. Check your AI provider key in .env.'];
        }

        return [
            'recommendations' => $response['recommendations'],
            'confidence' => (float) $response['confidence'],
            'reasoning' => $response['reasoning'],
            'tokens' => $response->usage->inputTokens + $response->usage->outputTokens,
        ];
    }
}
