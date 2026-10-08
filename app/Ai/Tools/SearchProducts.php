<?php

namespace App\Ai\Tools;

use App\Models\Product;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchProducts implements Tool
{
    public function description(): Stringable|string
    {
        return 'Search the active product catalog by keyword, optional category name, and optional maximum price. Returns up to 10 products with price, stock, units sold, and average rating.';
    }

    public function handle(Request $request): Stringable|string
    {
        $arguments = $request->validate([
            'query' => ['required', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        return json_encode($this->search($arguments['query'], $arguments['category'] ?? null, $arguments['max_price'] ?? null), JSON_THROW_ON_ERROR);
    }

    /**
     * @return list<array{id: int, name: string, category: string|null, price: float, stock_count: int, units_sold: int, average_rating: float}>
     */
    public function search(string $query, ?string $category = null, int|float|null $maxPrice = null): array
    {
        $key = 'ai:tool:search-products:'.hash('xxh128', json_encode([mb_strtolower($query), mb_strtolower((string) $category), $maxPrice]));

        // Tool results are plain catalog data, so they are almost always safe to cache.
        // The model calls the same search for many different questions.
        return Cache::flexible($key, [300, 900], fn (): array => $this->query($query, $category, $maxPrice));
    }

    /**
     * @return list<array{id: int, name: string, category: string|null, price: float, stock_count: int, units_sold: int, average_rating: float}>
     */
    private function query(string $query, ?string $category, int|float|null $maxPrice): array
    {
        return Product::query()
            ->with('category:id,name')
            ->withSum('orderItems', 'quantity')
            ->withAvg('reviews', 'rating')
            ->where('active', true)
            ->where(fn (Builder $builder) => $builder
                ->where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%"))
            ->when($category, fn (Builder $builder) => $builder->whereRelation('category', 'name', 'like', "%{$category}%"))
            ->when($maxPrice !== null, fn (Builder $builder) => $builder->where('price', '<=', $maxPrice))
            ->orderByDesc('order_items_sum_quantity')
            ->limit(10)
            ->get()
            ->map(fn (Product $product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category?->name,
                'price' => (float) $product->price,
                'stock_count' => $product->stock_count,
                'units_sold' => (int) $product->order_items_sum_quantity,
                'average_rating' => round((float) $product->reviews_avg_rating, 1),
            ])
            ->all();
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()->description('Keyword to match against product name or description, e.g. "lamp".')->required(),
            'category' => $schema->string()->description('Optional category name, e.g. "Lighting".'),
            'max_price' => $schema->number()->description('Optional maximum unit price in dollars.'),
        ];
    }
}
