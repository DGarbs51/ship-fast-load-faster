<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductAdvisorController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StartDeepAnalysisController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

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
    Route::get('advisor', ProductAdvisorController::class)->middleware('throttle:advisor')->name('advisor');
    Route::post('advisor/deep-analysis', StartDeepAnalysisController::class)->middleware('throttle:advisor-deep-analysis')->name('advisor.deep-analysis');
});
