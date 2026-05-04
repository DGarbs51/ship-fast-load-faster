<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Telescope\Telescope;

class DatabaseSeeder extends Seeder
{
    private const int USER_COUNT = 50;

    private const int CUSTOMER_COUNT = 20000;

    private const int CATEGORY_COUNT = 50;

    private const int PRODUCT_COUNT = 5000;

    private const int ORDER_COUNT = 100000;

    private const int REVIEW_COUNT = 80000;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::disableQueryLog();

        if (class_exists(Telescope::class)) {
            Telescope::stopRecording();
        }

        DB::statement('PRAGMA foreign_keys = OFF');

        $now = now()->timestamp;

        DB::transaction(function () use ($now): void {
            $this->seedUsers($now);
            $this->seedCustomers($now);
            $categoryNames = $this->seedCategories($now);
            $productPrices = $this->seedProducts($now, $categoryNames);
            $this->seedOrders($now, $productPrices);
            $this->seedReviews($now);
        });

        DB::statement('PRAGMA foreign_keys = ON');
    }

    private function seedUsers(int $now): void
    {
        $rows = [];
        $password = Hash::make('password');

        for ($id = 1; $id <= self::USER_COUNT; $id++) {
            $rows[] = [
                'id' => $id,
                'name' => match ($id) {
                    1 => 'Admin User',
                    2 => 'Test User',
                    default => "Admin User {$id}",
                },
                'email' => match ($id) {
                    1 => 'admin@example.com',
                    2 => 'test@example.com',
                    default => "admin{$id}@example.com",
                },
                'email_verified_at' => date('Y-m-d H:i:s', $now),
                'password' => $password,
                'remember_token' => Str::random(10),
                'created_at' => date('Y-m-d H:i:s', $now - mt_rand(0, 365) * 86400),
                'updated_at' => date('Y-m-d H:i:s', $now),
            ];
        }

        DB::table('users')->upsert($rows, ['email'], [
            'name',
            'email_verified_at',
            'password',
            'remember_token',
            'created_at',
            'updated_at',
        ]);
    }

    private function seedCustomers(int $now): void
    {
        $firstNames = ['Ava', 'Mia', 'Noah', 'Leo', 'Ruby', 'Luca', 'Ella', 'Ivy', 'Finn', 'Zoe', 'Aria', 'Kai', 'Nora', 'Theo', 'Mila', 'Owen'];
        $lastNames = ['Stone', 'Nguyen', 'Patel', 'Wilson', 'Kim', 'Singh', 'Taylor', 'Chen', 'Brown', 'Martin', 'Walker', 'King', 'Lopez', 'Scott', 'Young', 'Clark'];
        $cities = [
            ['Melbourne', 'VIC', 'AU'],
            ['Sydney', 'NSW', 'AU'],
            ['Brisbane', 'QLD', 'AU'],
            ['Perth', 'WA', 'AU'],
            ['Auckland', null, 'NZ'],
            ['Wellington', null, 'NZ'],
            ['San Francisco', 'CA', 'US'],
            ['Portland', 'OR', 'US'],
            ['Austin', 'TX', 'US'],
            ['Toronto', 'ON', 'CA'],
        ];

        $rows = [];

        for ($id = 1; $id <= self::CUSTOMER_COUNT; $id++) {
            $city = $cities[($id + mt_rand(0, count($cities) - 1)) % count($cities)];
            $createdAt = $this->weightedTimestamp($now);

            $rows[] = [
                'id' => $id,
                'name' => $firstNames[$id % count($firstNames)].' '.$lastNames[($id + mt_rand(0, 7)) % count($lastNames)],
                'email' => "customer{$id}@example.com",
                'phone' => mt_rand(1, 100) <= 82 ? '+61 4'.str_pad((string) mt_rand(10000000, 99999999), 8, '0', STR_PAD_LEFT) : null,
                'city' => $city[0],
                'state' => $city[1],
                'country' => $city[2],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            $this->flushWhenFull('customers', $rows);
        }

        $this->flush('customers', $rows);
    }

    /**
     * @return array<int, string>
     */
    private function seedCategories(int $now): array
    {
        $roots = [
            'Kitchen',
            'Home',
            'Apparel',
            'Electronics',
            'Beauty',
            'Fitness',
            'Office',
            'Garden',
            'Pets',
            'Travel',
        ];

        $children = [
            [1, 'Cookware'], [1, 'Coffee'], [1, 'Food Storage'], [1, 'Tabletop'],
            [2, 'Bedding'], [2, 'Cleaning'], [2, 'Lighting'], [2, 'Decor'],
            [3, 'Outerwear'], [3, 'Footwear'], [3, 'Workwear'], [3, 'Accessories'],
            [4, 'Audio'], [4, 'Smart Home'], [4, 'Chargers'], [4, 'Cameras'],
            [5, 'Skin Care'], [5, 'Hair Care'], [5, 'Fragrance'], [5, 'Wellness'],
            [6, 'Yoga'], [6, 'Strength'], [6, 'Recovery'], [6, 'Hydration'],
            [7, 'Desk Gear'], [7, 'Paper Goods'], [7, 'Storage'], [7, 'Meeting Rooms'],
            [8, 'Planters'], [8, 'Tools'], [8, 'Outdoor Dining'], [8, 'Watering'],
            [9, 'Dog'], [9, 'Cat'], [9, 'Grooming'], [9, 'Travel Carriers'],
            [10, 'Luggage'], [10, 'Packing'], [10, 'Adapters'], [10, 'Day Bags'],
        ];

        $rows = [];
        $names = [];
        $id = 1;

        foreach ($roots as $name) {
            $names[$id] = $name;
            $rows[] = $this->categoryRow($id, null, $name, $now);
            $id++;
        }

        foreach ($children as [$parentId, $name]) {
            $names[$id] = $name;
            $rows[] = $this->categoryRow($id, $parentId, $name, $now);
            $id++;
        }

        DB::table('categories')->insert($rows);

        return $names;
    }

    /**
     * @param  array<int, string>  $categoryNames
     * @return array<int, int>
     */
    private function seedProducts(int $now, array $categoryNames): array
    {
        $adjectives = ['Everyday', 'Signature', 'Compact', 'Heritage', 'Modular', 'Studio', 'Essential', 'Summit', 'Coastal', 'Urban', 'Smart', 'Classic'];
        $materials = ['stainless steel', 'recycled cotton', 'tempered glass', 'bamboo', 'ceramic', 'brushed aluminum', 'wool blend', 'silicone', 'linen', 'oak'];
        $productTypes = ['prep set', 'storage kit', 'travel pouch', 'desk lamp', 'serving bowl', 'hooded jacket', 'training mat', 'planter box', 'wireless speaker', 'carry tote', 'coffee scale', 'hydration bottle', 'skin serum', 'charging dock'];
        $benefits = ['quick setup', 'daily durability', 'small spaces', 'easy cleaning', 'giftable presentation', 'busy households', 'weekend projects', 'hybrid work', 'travel days', 'repeat use'];

        $rows = [];
        $prices = [];

        for ($id = 1; $id <= self::PRODUCT_COUNT; $id++) {
            $categoryId = (($id + mt_rand(0, self::CATEGORY_COUNT - 1)) % self::CATEGORY_COUNT) + 1;
            $type = $productTypes[($id + mt_rand(0, count($productTypes) - 1)) % count($productTypes)];
            $name = $adjectives[$id % count($adjectives)].' '.Str::title($type).' '.$id;
            $priceCents = mt_rand(599, 32999);
            $createdAt = $this->weightedTimestamp($now);
            $prices[$id] = $priceCents;

            $rows[] = [
                'id' => $id,
                'category_id' => $categoryId,
                'sku' => 'SFLF-'.str_pad((string) $id, 6, '0', STR_PAD_LEFT),
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => 'A '.$materials[$id % count($materials)].' '.$type.' for '.$categoryNames[$categoryId].' buyers who want '.$benefits[mt_rand(0, count($benefits) - 1)].'. Designed for practical comparison across price, category, stock, and customer ratings.',
                'price' => $this->money($priceCents),
                'stock_count' => mt_rand(1, 100) <= 12 ? mt_rand(0, 10) : mt_rand(11, 450),
                'active' => mt_rand(1, 100) <= 94,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            $this->flushWhenFull('products', $rows);
        }

        $this->flush('products', $rows);

        return $prices;
    }

    /**
     * @param  array<int, int>  $productPrices
     */
    private function seedOrders(int $now, array $productPrices): void
    {
        $orders = [];
        $items = [];
        $itemId = 1;

        for ($orderId = 1; $orderId <= self::ORDER_COUNT; $orderId++) {
            $createdAt = $this->weightedTimestamp($now);
            $itemCount = $this->orderItemCount();
            $totalCents = 0;

            for ($position = 1; $position <= $itemCount; $position++) {
                $productId = mt_rand(1, self::PRODUCT_COUNT);
                $quantity = mt_rand(1, 4);
                $unitCents = max(199, (int) round($productPrices[$productId] * (mt_rand(85, 115) / 100)));
                $lineCents = $unitCents * $quantity;
                $totalCents += $lineCents;

                $items[] = [
                    'id' => $itemId++,
                    'order_id' => $orderId,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_price' => $this->money($unitCents),
                    'line_total' => $this->money($lineCents),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];

                $this->flushWhenFull('order_items', $items);
            }

            $orders[] = [
                'id' => $orderId,
                'customer_id' => mt_rand(1, self::CUSTOMER_COUNT),
                'number' => 'SF-'.str_pad((string) $orderId, 8, '0', STR_PAD_LEFT),
                'status' => $this->status(),
                'total' => $this->money($totalCents),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            $this->flushWhenFull('orders', $orders);
        }

        $this->flush('orders', $orders);
        $this->flush('order_items', $items);
    }

    private function seedReviews(int $now): void
    {
        $titles = ['Exactly what I needed', 'Solid everyday choice', 'Good value', 'Would buy again', 'Better than expected', 'Simple and reliable', 'Looks great in person'];
        $bodies = [
            'The quality is consistent and the details match the listing. It has held up well with normal use.',
            'Good balance of price, finish, and practical features. Delivery was straightforward and the packaging was clean.',
            'I compared a few options and this one made the most sense for our space. The rating feels deserved.',
            'Useful for daily routines and easy to recommend. The material feels right for the price point.',
        ];

        $rows = [];

        for ($id = 1; $id <= self::REVIEW_COUNT; $id++) {
            $createdAt = $this->weightedTimestamp($now);

            $rows[] = [
                'id' => $id,
                'product_id' => mt_rand(1, self::PRODUCT_COUNT),
                'customer_id' => mt_rand(1, self::CUSTOMER_COUNT),
                'rating' => $this->rating(),
                'title' => $titles[$id % count($titles)],
                'body' => $bodies[mt_rand(0, count($bodies) - 1)],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            $this->flushWhenFull('reviews', $rows);
        }

        $this->flush('reviews', $rows);
    }

    /**
     * @return array<string, mixed>
     */
    private function categoryRow(int $id, ?int $parentId, string $name, int $now): array
    {
        $createdAt = date('Y-m-d H:i:s', $now - mt_rand(30, 730) * 86400);

        return [
            'id' => $id,
            'parent_id' => $parentId,
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => "Products for {$name} operators and customers.",
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }

    private function weightedTimestamp(int $now): string
    {
        $ratio = mt_rand(0, 1000000) / 1000000;
        $daysAgo = (int) floor($ratio * $ratio * 730);

        return date('Y-m-d H:i:s', $now - ($daysAgo * 86400) - mt_rand(0, 86399));
    }

    private function money(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    private function orderItemCount(): int
    {
        $roll = mt_rand(1, 100);

        return match (true) {
            $roll <= 5 => 1,
            $roll <= 20 => 2,
            $roll <= 65 => 3,
            $roll <= 90 => 4,
            default => 5,
        };
    }

    private function status(): string
    {
        $roll = mt_rand(1, 100);

        return match (true) {
            $roll <= 9 => 'pending',
            $roll <= 61 => 'paid',
            $roll <= 96 => 'shipped',
            default => 'cancelled',
        };
    }

    private function rating(): int
    {
        $roll = mt_rand(1, 100);

        return match (true) {
            $roll <= 3 => 1,
            $roll <= 10 => 2,
            $roll <= 28 => 3,
            $roll <= 66 => 4,
            default => 5,
        };
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function flushWhenFull(string $table, array &$rows): void
    {
        if (count($rows) >= 1000) {
            $this->flush($table, $rows);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function flush(string $table, array &$rows): void
    {
        if ($rows === []) {
            return;
        }

        DB::table($table)->insert($rows);

        $rows = [];
    }
}
