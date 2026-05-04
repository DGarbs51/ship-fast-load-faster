<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $products = Product::latest()
            ->paginate(25)
            ->withQueryString()
            ->through(function (Product $product): array {
                $orderItems = $product->orderItems;
                $reviews = $product->reviews;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => (float) $product->price,
                    'stock_count' => $product->stock_count,
                    'active' => $product->active,
                    'category' => $product->category?->name,
                    'units_sold' => (int) $orderItems->sum('quantity'),
                    'revenue' => (float) $orderItems->sum(fn (OrderItem $item): float => (float) $item->line_total),
                    'average_rating' => round((float) $reviews->avg('rating'), 1),
                    'review_count' => $reviews->count(),
                ];
            });

        return Inertia::render('products/index', [
            'products' => $products,
        ]);
    }

    public function show(Product $product): Response
    {
        $recentOrders = $product->orderItems()
            ->latest()
            ->take(50)
            ->get()
            ->map(function (OrderItem $item): array {
                $order = $item->order;

                return [
                    'id' => $order?->id,
                    'number' => $order?->number,
                    'customer' => $order?->customer?->name,
                    'status' => $order?->status,
                    'quantity' => $item->quantity,
                    'line_total' => (float) $item->line_total,
                    'created_at' => $order?->created_at?->toISOString(),
                ];
            });

        $reviews = $product->reviews()
            ->latest()
            ->get()
            ->map(fn ($review): array => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'customer' => $review->customer?->name,
                'created_at' => $review->created_at?->toISOString(),
            ]);

        return Inertia::render('products/show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'description' => $product->description,
                'price' => (float) $product->price,
                'stock_count' => $product->stock_count,
                'active' => $product->active,
                'category' => $product->category?->name,
                'units_sold' => (int) $product->orderItems->sum('quantity'),
                'revenue' => (float) $product->orderItems->sum(fn (OrderItem $item): float => (float) $item->line_total),
                'average_rating' => round((float) $product->reviews->avg('rating'), 1),
                'review_count' => $product->reviews->count(),
            ],
            'recentOrders' => $recentOrders,
            'reviews' => $reviews,
        ]);
    }
}
