<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::get('/__workshop/php-info', function (): JsonResponse {
    abort_unless(app()->environment('local'), 404);

    return response()->json(['memory_limit' => ini_get('memory_limit')]);
})->name('workshop.php-info');

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::resource('products', ProductController::class)->only(['index', 'show']);
    Route::resource('orders', OrderController::class)->only(['index', 'show']);
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status.update');
    Route::get('customers/export', [CustomerController::class, 'export'])->name('customers.export');
    Route::resource('customers', CustomerController::class)->only(['index']);
});
