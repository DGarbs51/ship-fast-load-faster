<?php

use App\Models\Order;
use App\Models\User;
use App\Support\AuditContext;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

test('audit context is resolved fresh for each request on a long-lived worker', function () {
    Notification::fake();
    Log::spy();
    $order = Order::factory()->create(['status' => 'pending']);
    [$alice, $bob] = User::factory()->count(2)->create();

    $this->actingAs($alice)->patch("/orders/{$order->id}/status", ['status' => 'paid']);

    // Octane flushes scoped instances between requests on the same worker.
    app()->forgetScopedInstances();

    $this->actingAs($bob)->patch("/orders/{$order->id}/status", ['status' => 'shipped']);

    Log::shouldHaveReceived('info')->with('Order status changed', Mockery::on(fn (array $context) => $context['to'] === 'paid' && $context['by'] === $alice->email));
    Log::shouldHaveReceived('info')->with('Order status changed', Mockery::on(fn (array $context) => $context['to'] === 'shipped' && $context['by'] === $bob->email));
});

test('audit context is a scoped binding, not a singleton', function () {
    $this->actingAs(User::factory()->create());
    $first = app(AuditContext::class);

    app()->forgetScopedInstances();

    expect(app(AuditContext::class))->not->toBe($first);
});
