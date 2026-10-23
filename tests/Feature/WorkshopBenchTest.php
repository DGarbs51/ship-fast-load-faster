<?php

use App\Models\User;

test('bench reports timing and query count for each path', function () {
    User::factory()->create(['email' => 'bench@example.com']);

    $this->artisan('workshop:bench', ['paths' => ['/dashboard'], '--runs' => 1, '--user' => 'bench@example.com'])
        ->expectsOutputToContain('/dashboard')
        ->assertSuccessful();
});

test('bench fails when a path does not return 200', function () {
    User::factory()->create(['email' => 'bench@example.com']);

    $this->artisan('workshop:bench', ['paths' => ['/does-not-exist'], '--runs' => 1, '--user' => 'bench@example.com'])
        ->expectsOutputToContain('Non-200 responses')
        ->assertFailed();
});

test('bench fails when the user does not exist', function () {
    $this->artisan('workshop:bench', ['--user' => 'missing@example.com'])
        ->assertFailed();
});
