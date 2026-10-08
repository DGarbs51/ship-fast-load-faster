<?php

use App\Ai\AdvisorCache;
use App\Ai\Agents\DeepProductAnalyst;
use App\Ai\Agents\ProductAdvisor;
use App\Ai\Tools\SearchProducts;
use App\Http\Middleware\HandleInertiaRequests;
use App\Jobs\RunDeepAnalysis;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

$structured = [
    'recommendations' => [['product_id' => 1, 'name' => 'Lamp', 'reason' => 'Bright.']],
    'confidence' => 0.9,
    'reasoning' => 'Searched lamps.',
];

/**
 * Headers the page's usePoll sends: a partial reload of just the deep-analysis props.
 *
 * @return array<string, string>
 */
function deepAnalysisPartialReload(): array
{
    return [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
        'X-Inertia-Partial-Component' => 'advisor',
        'X-Inertia-Partial-Data' => 'deepAnalysis,deepAnalysisPending',
    ];
}

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('equivalent questions reuse the cached full response', function () use ($structured) {
    ProductAdvisor::fake([$structured]);

    $this->get('/advisor?question='.urlencode('Desk lamps?'))
        ->assertInertia(fn (Assert $page) => $page->where('answer.cached', false)->etc());

    $this->get('/advisor?question='.urlencode('  desk LAMPS '))
        ->assertInertia(fn (Assert $page) => $page->where('answer.cached', true)->where('answer.confidence', 0.9)->etc());

    ProductAdvisor::assertPromptedTimes(1);
});

test('failed answers are not cached', function () use ($structured) {
    $calls = 0;
    ProductAdvisor::fake(function () use (&$calls, $structured) {
        if ($calls++ === 0) {
            throw new RuntimeException('down');
        }

        return $structured;
    });

    $this->get('/advisor?question=lamps')->assertInertia(fn (Assert $page) => $page->has('answer.error'));
    $this->get('/advisor?question=lamps')->assertInertia(fn (Assert $page) => $page->where('answer.cached', false)->etc());
});

test('repeated tool searches are served from cache', function () {
    Product::factory()->create(['name' => 'Travel Pouch', 'active' => true]);
    $tool = new SearchProducts;

    $tool->search('pouch');

    DB::flushQueryLog();
    DB::enableQueryLog();
    $results = $tool->search('POUCH');

    expect($results)->toHaveCount(1)
        ->and(DB::getQueryLog())->toBeEmpty();
});

test('starting a deep analysis queues it once and marks it pending', function () {
    Queue::fake();

    $this->post('/advisor/deep-analysis', ['question' => 'lamps'])->assertRedirect('/advisor?question=lamps');
    $this->post('/advisor/deep-analysis', ['question' => 'lamps'])->assertRedirect('/advisor?question=lamps');

    Queue::assertPushedTimes(RunDeepAnalysis::class, 1);
    expect(Cache::has(AdvisorCache::deepAnalysisPending('lamps')))->toBeTrue();
});

test('polling for the deep analysis never prompts a model', function () {
    ProductAdvisor::fake();
    Cache::put(AdvisorCache::deepAnalysisPending('lamps'), true);

    $this->get('/advisor?question=lamps', deepAnalysisPartialReload())
        ->assertOk()
        ->assertJsonPath('props.deepAnalysisPending', true)
        ->assertJsonMissingPath('props.answer');

    ProductAdvisor::assertNeverPrompted();
});

test('polling and asking do not use up the deep analysis allowance', function () {
    ProductAdvisor::fake();
    Queue::fake();

    foreach (range(1, 30) as $poll) {
        $this->get('/advisor?question=lamps', deepAnalysisPartialReload())->assertOk();
    }

    foreach (range(1, 6) as $ask) {
        $this->get('/advisor?question=lamps')->assertOk();
    }

    $this->post('/advisor/deep-analysis', ['question' => 'lamps'])->assertRedirect();
});

test('the database queue does not re-reserve a deep analysis that is still running', function () {
    expect(config('queue.connections.database.retry_after'))->toBeGreaterThan((new RunDeepAnalysis('lamps'))->timeout);
});

test('only trivially different questions share a cache key', function () {
    expect(AdvisorCache::hash('Desk lamps?'))->toBe(AdvisorCache::hash('  desk   LAMPS '))
        ->and(AdvisorCache::hash('lamps < $100'))->not->toBe(AdvisorCache::hash('lamps > $100'))
        ->and(AdvisorCache::hash('under $10.50'))->not->toBe(AdvisorCache::hash('under $1050'))
        ->and(AdvisorCache::hash('ランプ'))->not->toBe(AdvisorCache::hash('椅子'));
});

test('the deep analysis job stores its result and clears the pending flag', function () use ($structured) {
    DeepProductAnalyst::fake([$structured]);
    ProductAdvisor::fake();
    Cache::put(AdvisorCache::deepAnalysisPending('lamps'), true);

    (new RunDeepAnalysis('lamps'))->handle();

    expect(Cache::has(AdvisorCache::deepAnalysisPending('lamps')))->toBeFalse()
        ->and(Cache::get(AdvisorCache::deepAnalysis('lamps'))['confidence'])->toBe(0.9);

    $this->get('/advisor?question=lamps', deepAnalysisPartialReload())
        ->assertOk()
        ->assertJsonPath('props.deepAnalysis.reasoning', 'Searched lamps.')
        ->assertJsonPath('props.deepAnalysisPending', false);

    ProductAdvisor::assertNeverPrompted();
});

test('a failed deep analysis clears pending and shows an error', function () {
    Cache::put(AdvisorCache::deepAnalysisPending('lamps'), true);

    (new RunDeepAnalysis('lamps'))->failed(new RuntimeException('timeout'));

    expect(Cache::has(AdvisorCache::deepAnalysisPending('lamps')))->toBeFalse()
        ->and(Cache::get(AdvisorCache::deepAnalysis('lamps')))->toHaveKey('error');
});

test('cost projection compares cached and uncached spend', function () {
    $this->artisan('workshop:ai-cost', ['--requests' => 1000, '--hit-rate' => 0.5, '--input-tokens' => 1000000, '--output-tokens' => 0, '--input-price' => 1])
        ->expectsOutputToContain('$1,000.00')
        ->expectsOutputToContain('$500.00')
        ->assertSuccessful();
});
