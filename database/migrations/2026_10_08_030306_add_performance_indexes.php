<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Index the foreign keys and filter/sort columns the app queries on.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->index('parent_id');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->index('created_at');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('category_id');
            $table->index('stock_count');
            $table->index('created_at');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['customer_id', 'created_at']);
            $table->index('created_at');
            $table->index('status');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index('order_id');
            $table->index(['product_id', 'created_at']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->index(['product_id', 'created_at']);
            $table->index('customer_id');
        });
    }
};
