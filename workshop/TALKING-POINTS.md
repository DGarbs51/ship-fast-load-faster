# Ship Fast, Load Faster — Facilitator Talking Points

Companion to [`ship-fast-load-faster-outline.md`](../ship-fast-load-faster-outline.md). For each segment this doc gives:

- the talking points, in order;
- **where in the code** the problem lives on `main` and where the fix lands on its checkpoint branch (links go to `file:line` on GitHub);
- a short **concept blurb** for anything we explain on stage, such as indexes, query plans or stampedes: what it is and why it matters.

---

## How checkpoints work

Every segment ends on a branch. Each branch builds on the one before it, so an attendee who falls behind can jump to any of them.

| Branch | Outline segment | What it adds |
|---|---|---|
| `main` | 1.1 | The slow starter app |
| `checkpoint/01-diagnose` | 1.2 – 1.3 | `workshop:bench` command, slow-query log, findings template |
| `checkpoint/02-queries` | 2.1 | Indexes, eager loading, DB-side aggregates, subquery select, lazy-loading guard |
| `checkpoint/03-cache` | 2.2 | `DashboardStats` service, `Cache::remember`, versioned keys, observer invalidation |
| `checkpoint/04-queues` | 2.3 | Queued unique rollup job + schedule, queued order confirmation, `workshop:stampede` demo |
| `checkpoint/05-stampede` | 3.1 – 3.2 | `Cache::flexible` + rebuild lock, `lazy()` CSV export |
| `checkpoint/06-octane` | 3.3 | Octane (FrankenPHP), scoped-binding fix for a per-request state leak |
| `checkpoint/07-ai-agent` | 4.1 – 4.2 | `laravel/ai` `ProductAdvisor` agent, `SearchProducts` tool, structured output, `/advisor` page |
| `checkpoint/08-ai-performance` | 4.3 – 4.4 | Cached tool results and answers, queued deep analysis, `workshop:ai-cost` |

To catch up, attendees run:

```bash
git switch checkpoint/03-cache      # any checkpoint
composer install && npm install     # 06 adds laravel/octane, 07 adds laravel/ai
php artisan migrate                 # 02 adds the index migration
npm run build                       # or keep `npm run dev` running
php artisan cache:clear
```

### Reference benchmark numbers

These come from the facilitator's laptop (Apple Silicon, SQLite, 100k orders / 320k order items, `php artisan workshop:bench --runs=3`, Debugbar disabled). `workshop:bench` runs requests in-process, so it measures app time without HTTP overhead. Browser timings with Debugbar on will be higher; the 4–6s in the outline is what people see in the browser.

| Checkpoint | `/dashboard` | Queries | `/products` | `/orders` | `/customers` |
|---|---|---|---|---|---|
| `main` / 01 | ~2,950 ms | 262 | ~340 ms (82 q) | ~190 ms (57 q) | ~80 ms (32 q) |
| 02 queries | ~1,280 ms | 20 | ~13 ms (9 q) | ~7 ms (9 q) | ~7 ms (7 q) |
| 03 cache | ~1,200 ms | 16 | — | — | — |
| 04 queues | ~25 ms avg (58 cold / 7 warm) | 15 | ~18 ms | ~8 ms | ~8 ms |
| 06 Octane | `/login` throughput: 128 req/s on `artisan serve` vs 334 req/s on Octane (2 workers, `ab -n 200 -c 4`) | | | | |

Stampede demo (`php artisan workshop:stampede`, 8 processes hitting a cold key): **8 of 8 rebuilt on 04, 1 of 8 on 05.**

> Talking point: 03 barely moves the dashboard number. The query work is now cheap, and the fake 1-second analytics rollup that runs in the request is what dominates. That's the hook for Act 2.3.

---

## Act 1 — Diagnose (45 min)

### 1.1 Welcome & the slow app (15 min)

- Workshop arc in one breath: **diagnose → queries → cache → queues → scale → AI**. Diagnose first, then fix, then measure again.
- Setup check: `php artisan migrate:fresh --seed`. The seeder bulk-inserts with `DB::table()->insert()` in 1,000-row batches, so it takes seconds, not minutes. Sizes are set in [`database/seeders/DatabaseSeeder.php:15`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/database/seeders/DatabaseSeeder.php#L15) through [`database/seeders/DatabaseSeeder.php:23`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/database/seeders/DatabaseSeeder.php#L23) (20k customers, 5k products, 100k orders, ~320k items, 80k reviews).
  - Aside: bulk inserts instead of factories is itself a performance lesson. Factories fire model events and hydrate one model per row.
- Log in as `admin@example.com` / `password`, open `/dashboard`, and feel the wait. Banter: "If you've ever inherited an app that felt like this, raise your hand."
- Don't fix anything yet. Point at the dashboard and ask: *"Where do you think the time goes?"* Take guesses and write them down. We'll check them against the real data.

### 1.2 The profiling toolkit (20 min)

**Laravel Debugbar** (already installed):
- **Queries** tab: total count, **duplicate** count, and time per query. The dashboard shows ~260 queries with many duplicates.
- **Timeline** tab: a gap with no queries in it is PHP doing work. Here that's the `usleep` in the rollup ([`app/Http/Controllers/DashboardController.php:120`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L120)).
- Click a duplicated query to see the same SQL with different bindings. That's the N+1 fingerprint.

**Telescope** (`/telescope`):
- *Queries* lists each query with its duration and flags slow ones. *Requests* shows a per-request breakdown.
- Telescope stores everything it records, which makes it good for "what happened on that request 10 minutes ago". Debugbar only shows the request you're on.
- Telescope has its own overhead. Keep it local or sample it in production.

**`DB::listen()`**: the hook both tools are built on.
- Checkpoint 01 adds a local-only slow-query logger at [`app/Providers/AppServiceProvider.php:38`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/01-diagnose/app/Providers/AppServiceProvider.php#L38). Any query over 50 ms gets written to `storage/logs/laravel.log` with its SQL and URL.
- When to use it: queue workers, artisan commands, and anywhere else Debugbar can't see.

**`php artisan workshop:bench`** ([`app/Console/Commands/WorkshopBench.php:18`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/01-diagnose/app/Console/Commands/WorkshopBench.php#L18)):
- Logs in as the admin, sends each page through the HTTP kernel in-process, and reports average/min/max ms plus query count and query time.
- Sends Inertia headers (including the current asset version) so we time the JSON payload rather than the HTML shell ([`app/Console/Commands/WorkshopBench.php:66`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/01-diagnose/app/Console/Commands/WorkshopBench.php#L66)).
- **Exits non-zero if any page isn't a 200** ([`app/Console/Commands/WorkshopBench.php:97`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/01-diagnose/app/Console/Commands/WorkshopBench.php#L97)). A redirect to `/login` or a 409 version mismatch is very fast and will happily "benchmark" at 3 ms. Never trust a timing without its status code.
- We run it at every checkpoint to give before/after numbers.

**EXPLAIN / EXPLAIN QUERY PLAN** (see blurb below):
```bash
sqlite3 database/database.sqlite \
  "EXPLAIN QUERY PLAN select * from orders where created_at between '2026-10-01' and '2026-10-31'"
# main:  SCAN orders
# 02:    SEARCH orders USING INDEX orders_created_at_index (created_at>? AND created_at<?)
```
From Eloquent: `Order::whereBetween('created_at', [...])->explain()->dd();`

> **Blurb: What is a query plan, and what does EXPLAIN tell us?**
> The database never runs your SQL text as written. A *query planner* first picks a strategy: which table to read first, whether to use an index, how to join, and whether to sort in memory. `EXPLAIN QUERY PLAN` (SQLite) or `EXPLAIN` / `EXPLAIN ANALYZE` (MySQL 8 / Postgres) prints that strategy without guessing. The two words to look for in SQLite are **`SCAN`** (read every row: cost grows with table size) and **`SEARCH ... USING INDEX`** (jump straight to matching rows). Also watch for **`USE TEMP B-TREE FOR ORDER BY / GROUP BY`**, which means the database had to sort rows itself because no index already had them in order. `EXPLAIN ANALYZE` in Postgres/MySQL goes further: it *runs* the query and reports actual rows and time per step, so you can see where the planner's estimates were wrong. This is how you *prove* an index helps instead of hoping it does.

### 1.3 Diagnostic exercise (10 min)

- Attendees copy `workshop/FINDINGS-TEMPLATE.md` (on 01). For each of the top 3 slow pages they fill in: average ms, query count, duplicates, slowest query, the EXPLAIN output for it, and a suspected cause.
- Expected findings, to steer the group discussion:

| Page | What they should find | Where on `main` |
|---|---|---|
| `/dashboard` | The same month's orders loaded **4 times** into PHP collections and summed there | [`app/Http/Controllers/DashboardController.php:23`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L23) – [`app/Http/Controllers/DashboardController.php:27`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L27) |
| `/dashboard` | Top products: one `Product::find` per product, plus lazy-loaded category and reviews (N+1 ×3) | [`app/Http/Controllers/DashboardController.php:39`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L39), [`app/Http/Controllers/DashboardController.php:47`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L47) |
| `/dashboard` | Recent orders: customer, items, and each item's product lazy-loaded (nested N+1) | [`app/Http/Controllers/DashboardController.php:59`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L59), [`app/Http/Controllers/DashboardController.php:64`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L64) |
| `/dashboard` | `Product::all()` (5,000 models) just to count low stock | [`app/Http/Controllers/DashboardController.php:102`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L102) |
| `/dashboard` | `->get()->count()` loads every pending order just to count them | [`app/Http/Controllers/DashboardController.php:98`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L98) |
| `/dashboard` | Category tree/inventory: loads every product per category to count/sum | [`app/Http/Controllers/DashboardController.php:75`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L75), [`app/Http/Controllers/DashboardController.php:88`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L88) |
| `/dashboard` | ~1s of "analytics rollup" blocks every request | [`app/Http/Controllers/DashboardController.php:21`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/DashboardController.php#L21) |
| `/products` | Every order item and review for each of 25 products loaded just to sum/avg | [`app/Http/Controllers/ProductController.php:18`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/ProductController.php#L18) |
| `/orders` | Items loaded per order just to count them; customer lazy-loaded | [`app/Http/Controllers/OrderController.php:21`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/OrderController.php#L21) |
| `/customers` | All orders per customer loaded to count and sum | [`app/Http/Controllers/CustomerController.php:19`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/CustomerController.php#L19) |
| `/customers/export` | `Customer::all()` (20k models in memory) **plus** an N+1 per row: about 20,001 queries | [`app/Http/Controllers/CustomerController.php:41`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/CustomerController.php#L41) |
| `PATCH /orders/{id}/status` | 300 ms of fake "email sending" blocks the redirect | [`app/Http/Controllers/OrderController.php:93`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/OrderController.php#L93) |
| Schema | No indexes on any foreign key, `created_at`, or `status` | `database/migrations/2026_05_04_02*` |

- Close with the three buckets every slow page falls into: **query problem** (count or plan), **work that shouldn't be in the request**, or **work that shouldn't be repeated** (cache). Act 2 takes them in that order.

---

## Act 2 — Optimize (75 min)

### 2.1 Query layer (25 min) → `checkpoint/02-queries`

**The N+1 problem (live demo):**
- Open Debugbar on `/orders` and show 25 nearly identical `select * from customers where id = ?` queries.
- Fix it live with `with('customer:id,name')`: [`app/Http/Controllers/OrderController.php:17`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/OrderController.php#L17). The count drops to 1 query. Note the column list (`id,name`): only fetch what you render.

> **Blurb: N+1 queries**
> You run 1 query to get N parent rows. Then, in a loop, touching `$order->customer` triggers 1 more query per row: N+1 in total. Each query is fast alone, but the round-trips add up, and the cost grows with page size and data size. Eager loading (`with()`) replaces the N queries with **one** `where id in (...)` query. A good rule of thumb: **the number of queries on a page should not depend on how many rows it shows.** Checkpoint 02's tests assert exactly that ([`tests/Feature/QueryPerformanceTest.php:46`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/tests/Feature/QueryPerformanceTest.php#L46)).

**Make lazy loading impossible to miss:**
- `Model::preventLazyLoading(! app()->isProduction())` at [`app/Providers/AppServiceProvider.php:65`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Providers/AppServiceProvider.php#L65). Any N+1 now throws in local and test environments instead of quietly slowing the page.
- Trade-off: it only fires when the model came from a collection of more than one row. It's a guard, not a proof. Production stays lenient so a missed eager-load is slow rather than broken.

**Aggregate in the database, not in PHP:**
- `withCount()` / `withSum()` / `withAvg()` add a correlated subquery and return a single number per row instead of hydrating every child model.
  - Products list: [`app/Http/Controllers/ProductController.php:15`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/ProductController.php#L15). Before, every order item and review for 25 products was hydrated; after, 8–9 queries total.
  - Orders list: `withCount('items')`, [`app/Http/Controllers/OrderController.php:18`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/OrderController.php#L18).
  - Customers list: `withCount('orders')->withSum('orders', 'total')`, [`app/Http/Controllers/CustomerController.php:14`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/CustomerController.php#L14).
  - Single models use `loadSum` / `loadAvg` / `loadCount`: [`app/Http/Controllers/ProductController.php:46`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/ProductController.php#L46).
- Dashboard metrics: four `->get()` calls on the same month collapse into one `count(*)` + `sum(total)` query at [`app/Http/Controllers/DashboardController.php:28`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/DashboardController.php#L28).
- `->count()` instead of `->get()->count()`: [`app/Http/Controllers/DashboardController.php:113`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/DashboardController.php#L113). `where('stock_count', '<=', 10)->count()` instead of filtering 5,000 models in PHP: [`app/Http/Controllers/DashboardController.php:115`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/DashboardController.php#L115).
- Top products: `GROUP BY product_id ORDER BY revenue LIMIT 10` runs in SQL, with month orders as a **subquery** (`whereIn('order_id', $query->select('id'))`) instead of plucking 4,000 IDs into PHP and sending them back: [`app/Http/Controllers/DashboardController.php:35`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/DashboardController.php#L35). The 10 products are then loaded in one query with category and rating: [`app/Http/Controllers/DashboardController.php:43`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/DashboardController.php#L43).
- Category tree: `withCount('products')` plus a constrained eager load of children: [`app/Http/Controllers/DashboardController.php:82`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/DashboardController.php#L82). Inventory uses `withSum` + `orderByDesc` + `take(8)`, so sorting and limiting happen in SQL: [`app/Http/Controllers/DashboardController.php:96`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/DashboardController.php#L96).
- `toBase()` skips model hydration when you only need numbers ([`app/Http/Controllers/DashboardController.php:27`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Http/Controllers/DashboardController.php#L27)).

**Subquery selects for "latest / most recent":**
- Customers list gets a new "Last order" column without loading any orders: [`app/Models/Customer.php:33`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/app/Models/Customer.php#L33). The scope uses `addSelect(['last_order_at' => Order::select('created_at')->whereColumn(...)->latest()->limit(1)])` plus `withCasts` so it comes back as a date.
- The UI change is at [`resources/js/pages/customers/index.tsx:22`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/resources/js/pages/customers/index.tsx#L22).

> **Blurb: Correlated subquery selects**
> A subquery in the `SELECT` list that references the outer row (`where customer_id = customers.id`). The database evaluates it once per *returned* row, here 25 per page, and only needs an index on `orders(customer_id, created_at)` to answer each one in a single index lookup. It's the go-to for "latest X per parent", which would otherwise mean either loading all children or writing a window function. Laravel's `latestOfMany()` relationship does the same job when you need the whole related model rather than one column.

**Indexes that matter:**
- Migration: [`database/migrations/2026_10_08_030306_add_performance_indexes.php:12`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/database/migrations/2026_10_08_030306_add_performance_indexes.php#L12). Walk through *why* each index exists:
  - Foreign keys used by eager loads and `withCount`: `order_items.order_id`, `categories.parent_id`, `products.category_id`, `reviews.customer_id`.
  - `orders.created_at`: month range filter plus `latest()` pagination ([`database/migrations/2026_10_08_030306_add_performance_indexes.php:19`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/database/migrations/2026_10_08_030306_add_performance_indexes.php#L19)).
  - `orders.status`: the pending count becomes a **covering index** scan, so the table is never read.
  - **Composite** `orders(customer_id, created_at)`: serves both `where customer_id = ?` and the latest-order subquery's `order by created_at desc limit 1` ([`database/migrations/2026_10_08_030306_add_performance_indexes.php:29`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/02-queries/database/migrations/2026_10_08_030306_add_performance_indexes.php#L29)).
  - Composite `order_items(product_id, created_at)` and `reviews(product_id, created_at)`: product detail pages filter by product and sort by date.
  - `products.stock_count`: low-stock count. `products.created_at` / `customers.created_at`: `latest()->paginate()`.
- **Verify, don't assume.** Run EXPLAIN before and after (captured on the facilitator laptop):

```
order_items where order_id = ?   SCAN order_items          → SEARCH ... USING INDEX order_items_order_id_index
reviews where product_id = ?     SCAN reviews              → SEARCH ... USING INDEX reviews_product_id_created_at_index
orders where status = 'pending'  SCAN orders               → SEARCH orders USING COVERING INDEX orders_status_index
top products (subquery)          SCAN + SCAN               → SEARCH order_items USING INDEX ... / LIST SUBQUERY ... COVERING INDEX orders_created_at_index
                                                              (still: USE TEMP B-TREE FOR GROUP BY / ORDER BY, which is fine for ~4k rows)
```

- Teaching moment: the rollup's `order by created_at desc limit 5000` on `order_items` *still* shows `SCAN order_items` + `USE TEMP B-TREE FOR ORDER BY`. We deliberately didn't index `order_items.created_at`, because that query is moving to a queue in 2.3. **Not every slow query deserves an index.**

> **Blurb: Indexes, and why they aren't free**
> An index is a separate, sorted data structure (a B-tree) holding a copy of one or more columns plus a pointer back to the row. Lookups and range scans become O(log n) instead of reading the whole table, and because the index is already sorted, `ORDER BY` on it is free. **Composite indexes** are sorted by the first column, then the second, so `(customer_id, created_at)` serves `where customer_id = ?` *and* `where customer_id = ? order by created_at`, but **not** `where created_at > ?` on its own (the leftmost-prefix rule). A **covering index** contains every column the query needs, so the table itself is never touched. The costs: every `INSERT`/`UPDATE`/`DELETE` has to update every index, indexes take disk and memory, and low-selectivity columns (a boolean like `active`) rarely help. Leading-wildcard searches like `LIKE '%lamp%'` (which our AI tool does in Act 4) can't use a B-tree index at all; for that you want full-text search (SQLite FTS5, MySQL FULLTEXT, Postgres `tsvector`) or Scout. Index what you **filter, join, and sort** on, then confirm with EXPLAIN.

- **Hands-on:** attendees fix the products list and the dashboard order summary themselves, then compare with the checkpoint.
- **Checkpoint benchmark:** dashboard ~2.9s/262 queries → ~1.28s/20 queries. Products/orders/customers → single-digit to low-teens ms. Ask the room: *"Why is the dashboard still over a second?"* (Answer: the fake rollup. Cue 2.3.)

### 2.2 Cache layer (30 min) → `checkpoint/03-cache`

- The dashboard queries move into one service class, `DashboardStats` ([`app/Services/DashboardStats.php:15`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/app/Services/DashboardStats.php#L15)). The controller becomes 10 lines: [`app/Http/Controllers/DashboardController.php:13`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/app/Http/Controllers/DashboardController.php#L13). Moving the queries into one class is what makes caching them a single change.
- **`Cache::remember()` fundamentals**: [`app/Services/DashboardStats.php:173`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/app/Services/DashboardStats.php#L173). Talk through the cache-aside flow: read the key → on a miss, run the closure → store → return.
  - Cache **arrays, not models or collections**. Every section ends with `->all()` ([`app/Services/DashboardStats.php:96`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/app/Services/DashboardStats.php#L96)). Laravel 13 sets `cache.serializable_classes => false` by default ([`config/cache.php:128`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/config/cache.php#L128)), so cached PHP objects won't unserialize. That's a deliberate security default against deserialization attacks.
- **SQLite cache driver:** `CACHE_STORE=database` on SQLite. It's one indexed primary-key lookup per `get`, so it's very fast for a single box.
  - Gotcha to show in Debugbar: **each cache read is itself a query** (the `cache` table). The warm dashboard still shows ~15 queries, which are session, auth, and cache reads. Fewer and cheaper, but not zero.
- **Cache tags vs. key prefixes:**
  - Tags (`Cache::tags(['dashboard'])->flush()`) **aren't supported** by the `database`, `file`, or `dynamodb` stores, only Redis/Memcached/array.
  - Our portable alternative is a **versioned key prefix** ([`app/Services/DashboardStats.php:22`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/app/Services/DashboardStats.php#L22)). Every key looks like `dashboard:v{token}:metrics`, and invalidation writes a fresh random ULID as the token ([`app/Services/DashboardStats.php:28`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/app/Services/DashboardStats.php#L28)). Old keys are orphaned and expire on their own TTL.
  - Why a random token and not a counter? `Cache::add()` + `increment()` *looks* atomic but isn't on every store: two requests can both initialize the counter and roll it back, which resurrects stale keys. A single `forever()` write of a never-reused value can't race. (Found in code review. Good war story.)
  - Trade-off: orphaned keys use space until they expire, and every read costs one extra cache lookup for the version number.
- **Invalidation via model observers:**
  - One observer, [`app/Observers/DashboardCacheObserver.php:11`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/app/Observers/DashboardCacheObserver.php#L11), attached with `#[ObservedBy]` to every model the dashboard reads, e.g. [`app/Models/Order.php:8`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/app/Models/Order.php#L8). `saved` and `deleted` both bump the version.
  - The "brittle web of observers" problem from the abstract: we avoid it by having **one** observer and **one** invalidation action. It's coarse (any write flushes the whole dashboard) but impossible to get subtly wrong.
  - Gotcha: **query-builder mass updates and `DB::table()` writes skip observers** (`Order::where(...)->update([...])`). The seeder relies on this, and so does the stale-data test in 05. Call it out.
- Tests: [`tests/Feature/DashboardCacheTest.php:12`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/tests/Feature/DashboardCacheTest.php#L12) proves a warm request runs zero dashboard queries. [`tests/Feature/DashboardCacheTest.php:30`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/03-cache/tests/Feature/DashboardCacheTest.php#L30) proves invalidation.

> **Blurb: When does caching cost more than it saves?**
> A cache adds a read on *every* request, a write on every miss, an invalidation path, and a new failure mode: stale data. It pays off when reads far outnumber writes, the computation is expensive, and slightly old data is acceptable. It costs you when the hit rate is low (keys are too specific, or invalidation is too frequent), when the cached value is cheap to compute anyway (a primary-key lookup), or when correctness needs fresh data (checkout totals, permissions). Fix the queries first (2.1), *then* cache what is still expensive. Caching a slow query hides it until the next cold start.

- **The "what about Redis?" sidebar (5 min):**
  - SQLite/database cache is fine for one server with modest traffic. It needs no extra infrastructure, and reads are microseconds on local disk.
  - Reach for **Redis/Valkey** when you have multiple app servers (they need a *shared* cache, and SQLite on local disk isn't shared), need tags, have a high write rate (SQLite takes one writer at a time), or want atomic primitives at scale (locks, rate limiters, queues).
  - Rough delta: both are well under a millisecond per `get` locally. The real difference shows up under concurrent writes and across network hops, not in single-request benchmarks.
- **Checkpoint benchmark:** dashboard ~1.2s → still ~1.2s. The cache works, since the dashboard queries dropped to ~2 ms, but the 1-second rollup still runs on every request. *"Caching didn't fix it, because the slow part isn't a query."*

### 2.3 Async layer (20 min) → `checkpoint/04-queues`

- The mindset: *"Does the user need the result of this before we respond?"* If not, it doesn't belong in the request.
- **Analytics rollup → queued job:**
  - Removed from the controller ([`app/Http/Controllers/DashboardController.php:11`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/app/Http/Controllers/DashboardController.php#L11) no longer calls it).
  - New job: [`app/Jobs/RefreshAnalyticsRollup.php:15`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/app/Jobs/RefreshAnalyticsRollup.php#L15). It also aggregates in SQL ([`app/Jobs/RefreshAnalyticsRollup.php:26`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/app/Jobs/RefreshAnalyticsRollup.php#L26)) and stores the result with `Cache::forever`.
  - `ShouldBeUnique` means a burst of dispatches can't pile up duplicate jobs (it uses an atomic cache lock).
  - Scheduled every five minutes in [`routes/console.php:12`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/routes/console.php#L12). Run it with `php artisan schedule:work` (Solo's *Scheduler* process).
- **Order confirmation → queued notification:**
  - The 300 ms `usleep` "email" ([`app/Http/Controllers/OrderController.php:93`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/OrderController.php#L93)) becomes `$order->customer?->notify(new OrderConfirmation($order))` ([`app/Http/Controllers/OrderController.php:86`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/app/Http/Controllers/OrderController.php#L86)).
  - The notification `implements ShouldQueue` and calls `afterCommit()` ([`app/Notifications/OrderConfirmation.php:27`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/app/Notifications/OrderConfirmation.php#L27)), so it is only dispatched once the DB transaction commits. Otherwise the worker could pick it up before the order change is visible.
  - It **snapshots** the order number and status in the constructor ([`app/Notifications/OrderConfirmation.php:26`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/app/Notifications/OrderConfirmation.php#L26)). Queued jobs serialize models as IDs and re-fetch them when they run. If the order goes paid → shipped before the worker catches up, a notification that read `$order->status` at send time would say "shipped" twice. Test: [`tests/Feature/AsyncWorkTest.php:53`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/tests/Feature/AsyncWorkTest.php#L53).
  - `Customer` gets the `Notifiable` trait ([`app/Models/Customer.php:21`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/app/Models/Customer.php#L21)).
- **Queue drivers:** `QUEUE_CONNECTION=database` on SQLite works fine for a workshop and for many small production apps. Run `php artisan queue:work` (Solo's *Queue* process). Move to Redis/SQS when you need many workers, high throughput, or delayed jobs at scale.
- Gotchas to name:
  - Jobs serialize models by ID and re-fetch them in the worker (`SerializesModels`).
  - Deploys must restart workers (`queue:restart`), because they run old code until then.
  - A queued job that fails silently is worse than a slow request. Watch `failed_jobs` (Telescope → Jobs).
- **Hands-on:** move the rollup into a job and dispatch it; start a worker; watch the job run in Telescope.
- **Checkpoint benchmark:** dashboard → **~25 ms average (≈58 ms cold, ≈7 ms warm)**. Act 2 outcome reached: *"From ~3 s to single-digit milliseconds, and no single fix did it. It took all three layers."*

---

## Act 3 — Scale (30 min)

### 3.1 Stampede protection & locks (15 min) → `checkpoint/05-stampede`

- **Live demo first**, on checkpoint 04: `php artisan workshop:stampede` ([`app/Console/Commands/WorkshopStampede.php:15`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/04-queues/app/Console/Commands/WorkshopStampede.php#L15)).
  - It invalidates the dashboard cache, then uses `Concurrency::run()` to start 8 separate PHP processes that all request the top-products aggregate at the same moment.
  - Result on 04: **8 of 8 workers ran the expensive query.**

> **Blurb: The thundering herd / cache stampede**
> A popular key expires or is invalidated. In the window before anyone has rebuilt it, every concurrent request misses, and *every one* runs the expensive query at once. Load on the database jumps exactly when it's least able to cope, which can lengthen the rebuild, which keeps the window open longer. Caching makes this worse, not better: the more traffic you serve from cache, the bigger the herd when the cache goes cold. Invalidate-on-write (03) makes cold keys common.

- **Fix part 1: `Cache::lock()` around the cold rebuild.**
  - Code: [`app/Services/DashboardStats.php:185`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/05-stampede/app/Services/DashboardStats.php#L185). If the key is missing, take a lock named after the key. `block()` waits for whoever holds it.
  - Inside the lock, check the cache again before computing (`Cache::flexible` does that read for us), so waiters find the value the first request just stored.
  - Wait **as long as the lock lives** (30 s, [`app/Services/DashboardStats.php:29`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/05-stampede/app/Services/DashboardStats.php#L29)). Then a timeout only surfaces when a rebuild outlives its own lock, and that's a bug to fix (move the work to a queue).
  - Discussion: an earlier version caught `LockTimeoutException` and "just computed it". Code review flagged that as a stampede with extra steps: every waiter rebuilds at once, unlocked. **Never run an unowned rebuild.**
- **Fix part 2: `Cache::flexible()` (stale-while-revalidate).**
  - `[300, 900]`: fresh for 5 minutes, then *stale but servable* for another 10 ([`app/Services/DashboardStats.php:27`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/05-stampede/app/Services/DashboardStats.php#L27)).
  - In the stale window, users get the old value immediately and Laravel refreshes it **after the response is sent**, using `defer()`. Framework-internal locking means only one request refreshes.
- Why we need both:
  - `flexible` alone **does not protect a fully cold key**. On a total miss it computes inline with no lock (read `Illuminate\Cache\Repository::flexible`).
  - Our invalidation creates fully cold keys on every write. So: **lock for cold, flexible for expiry.**
- Result on 05: **1 of 8 workers ran the expensive query.** Point out that the waiters took ~290 ms: `block()` polls every 250 ms. That's the price of protection, and still far better than 8 parallel rebuilds.
- Tests:
  - SWR semantics: [`tests/Feature/StampedeProtectionTest.php:11`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/05-stampede/tests/Feature/StampedeProtectionTest.php#L11).
  - The rebuild only runs **while the lock is held**: [`tests/Feature/StampedeProtectionTest.php:27`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/05-stampede/tests/Feature/StampedeProtectionTest.php#L27). It fails if the lock is removed.
  - Waiters reuse the holder's value: [`tests/Feature/StampedeProtectionTest.php:49`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/05-stampede/tests/Feature/StampedeProtectionTest.php#L49).
- **Quick aside / foreshadow:** under Octane, the same hot workers serve far more requests per second, so a stampede arrives faster and with more concurrency. Locks become *more* important, not less.

> **Blurb: Atomic locks**
> `Cache::lock('name', $seconds)` uses the cache store's atomic "add if not exists" to give exactly one holder at a time, across processes and servers (when the store is shared). The TTL is a safety valve: if the holder crashes, the lock expires instead of deadlocking everyone. `get()` tries once; `block($wait)` polls until it succeeds or times out. Supported on redis, memcached, dynamodb, database, file, and array. The **database and file** stores only coordinate processes that share that database or disk, which is another reason multi-server apps move to Redis.

### 3.2 Lazy collections & memory (5 min)

- The customer export on `main` calls `Customer::all()`, which holds 20,000 models in memory, plus an N+1 per row ([`app/Http/Controllers/CustomerController.php:41`](https://github.com/DGarbs51/ship-fast-load-faster/blob/main/app/Http/Controllers/CustomerController.php#L41)).
- 02 fixed the N+1 with `withCount` / `withSum`. 05 adds `->lazy(1000)` inside the stream callback ([`app/Http/Controllers/CustomerController.php:49`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/05-stampede/app/Http/Controllers/CustomerController.php#L49)). Rows are fetched 1,000 at a time and written straight to the response, so memory stays flat no matter how many customers there are.
- "Now you know this exists":
  - `lazy()` / `lazyById()`: chunked queries behind a `LazyCollection`. Eager loads still work per chunk.
  - `cursor()`: a single query with one model hydrated at a time. Lowest memory, but **no eager loading** and the DB connection stays busy until you finish iterating.
  - `chunkById()`: the same idea with a callback, and the safe choice when you **update rows while iterating**.
- Real-world uses: exports, imports, batch jobs, backfills.

> **Blurb: LazyCollection**
> A collection backed by a PHP generator: items are produced only when they're consumed. `Customer::lazy()` runs `limit 1000` queries one after another, keyed by ID, and yields models one at a time, so peak memory is one chunk, not the whole table. It keeps the familiar collection API (`map`, `filter`, `each`), but each step runs as items stream through. Use it whenever "all rows" could mean millions.

### 3.3 Octane — a glimpse (10 min, show-and-tell) → `checkpoint/06-octane`

- **The persistent worker model:**
  - Normal PHP-FPM boots the framework on *every* request: load config, register providers, build the container, then throw it all away.
  - Octane boots once and keeps the app in memory. Each worker serves many requests. Boot cost drops to roughly zero, and so does *forgetting*.
- **Demo:**
  - `composer install` on 06 (adds `laravel/octane`). `php artisan octane:install --server=frankenphp` downloads the FrankenPHP binary, which is gitignored.
  - Then `php artisan octane:start` (Solo's *Octane* process).
  - The facilitator laptop measured `ab -n 200 -c 4 /login`: **128 req/s on `artisan serve` → 334 req/s on Octane with 2 workers** (31 ms → 12 ms per request).
  - Config: [`config/octane.php:41`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/06-octane/config/octane.php#L41) (defaults to `frankenphp`) and `max_requests` ([`config/octane.php:234`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/06-octane/config/octane.php#L234)), which recycles each worker after N requests. That's the safety net for slow memory leaks.
- **The state-leak gotcha: show one, fix one.**
  - `AuditContext` ([`app/Support/AuditContext.php:10`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/06-octane/app/Support/AuditContext.php#L10)) captures the signed-in user when it's built. Order status changes log *who* made them ([`app/Http/Controllers/OrderController.php:91`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/06-octane/app/Http/Controllers/OrderController.php#L91)).
  - Show the bug: change `scoped` to `singleton` at [`app/Providers/AppServiceProvider.php:30`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/06-octane/app/Providers/AppServiceProvider.php#L30), run Octane, change an order as user A, log in as user B, and change another order. **Both log entries say user A.** Under FPM, the same code is correct.
  - Fix: `$this->app->scoped()`. Octane flushes scoped instances between requests.
  - Test: [`tests/Feature/OctaneStateTest.php:9`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/06-octane/tests/Feature/OctaneStateTest.php#L9) simulates two requests on one worker with `forgetScopedInstances()`. It **fails** with `singleton` and passes with `scoped`.
- Other leak sources to name: `static` properties used as memo caches, singletons that capture `request()` or config at construction, and arrays that grow on every request (listeners registered inside a request handler).
- "Try this on your own after the workshop. The setup is two commands on checkpoint 06."

> **Blurb: Why Octane changes the rules**
> In FPM, process death after each request hides a whole class of bugs: anything you stash in a static property or singleton is wiped automatically. Octane removes that safety net in exchange for speed. The rules: never keep request-derived state (user, request, locale, tenant) in a singleton or static; use `scoped()` bindings or resolve per call; don't read `$_SERVER`/superglobals; set `max_requests` so a slow leak can't take a worker down. The framework's own state (auth, session, config) is reset for you. **Your** code is your responsibility.

---

## Act 4 — Intelligence (65 min)

> API keys: put the handed-out key in `.env` as `ANTHROPIC_API_KEY=` (or set `AI_DEFAULT_PROVIDER=openai` with `OPENAI_API_KEY=`). The default provider is read at [`config/ai.php:16`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/config/ai.php#L16). Without a key the page shows a friendly error rather than a 500 ([`app/Http/Controllers/ProductAdvisorController.php:30`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Http/Controllers/ProductAdvisorController.php#L30)). All tests use `ProductAdvisor::fake()`, so the suite never calls a real provider.

### 4.1 The Laravel AI SDK (15 min) → `checkpoint/07-ai-agent`

- Install: `composer require laravel/ai`, then `php artisan vendor:publish --tag=ai-config`. Scaffold: `php artisan make:agent ProductAdvisor --structured` and `php artisan make:tool SearchProducts`.
- **Anatomy of an agent** ([`app/Ai/Agents/ProductAdvisor.php:19`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Agents/ProductAdvisor.php#L19)):
  - `instructions()`: the system prompt ([`app/Ai/Agents/ProductAdvisor.php:23`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Agents/ProductAdvisor.php#L23)). Note the rule "Always call SearchProducts … only recommend products it returned". It grounds the model in **our** data.
  - `tools()`: what the model is allowed to call ([`app/Ai/Agents/ProductAdvisor.php:32`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Agents/ProductAdvisor.php#L32)).
  - `schema()`: structured output ([`app/Ai/Agents/ProductAdvisor.php:37`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Agents/ProductAdvisor.php#L37)).
  - Attributes as configuration: `#[UseCheapestModel]`, `#[MaxSteps(4)]`, `#[MaxTokens(1024)]` ([`app/Ai/Agents/ProductAdvisor.php:16`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Agents/ProductAdvisor.php#L16)). **`MaxSteps` caps the tool-call loop.** Each step is another round-trip to the model, which means more tokens and more latency.
- Architectural fit:
  - Agents are plain PHP classes, testable with `::fake()`.
  - Prompting is a synchronous HTTP call to the provider, so on Octane or FPM it ties up a worker for seconds. That's why 4.3 talks about queueing.
- **Hands-on:** scaffold `ProductAdvisor` with `php artisan make:agent`.

### 4.2 Tools & structured output (20 min)

- **`SearchProducts` tool** ([`app/Ai/Tools/SearchProducts.php:12`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Tools/SearchProducts.php#L12)):
  - The description and the JSON schema for its arguments are what the model sees ([`app/Ai/Tools/SearchProducts.php:60`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Tools/SearchProducts.php#L60)).
  - `handle()` **validates the model's arguments** like any other untrusted input ([`app/Ai/Tools/SearchProducts.php:21`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Tools/SearchProducts.php#L21)).
  - It reuses everything from Act 2: eager loads, `withSum`, `withAvg`, `limit(10)` ([`app/Ai/Tools/SearchProducts.php:37`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Tools/SearchProducts.php#L37)).
  - Live discussion: *the agent is using our fast catalog queries, so the performance gains compound.* An N+1 inside a tool runs on every step the model takes.
  - Index callout: `LIKE '%lamp%'` can't use a B-tree index ([`app/Ai/Tools/SearchProducts.php:41`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Tools/SearchProducts.php#L41)). At 5k products that's fine; at 5M, reach for full-text search or Scout.
- **Structured output** ([`app/Ai/Agents/ProductAdvisor.php:40`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Ai/Agents/ProductAdvisor.php#L40)): `recommendations[{product_id, name, reason}]`, `confidence` (0–1), `reasoning`. The controller reads it like an array ([`app/Http/Controllers/ProductAdvisorController.php:37`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Http/Controllers/ProductAdvisorController.php#L37)) and returns token usage so we can talk cost.
- Why structured output beats parsing free text:
  - The provider constrains generation to your JSON schema, so there's no regex over prose and no "the model added a friendly preamble" bugs.
  - Fields are typed, so you can render them directly (links to product pages: [`resources/js/pages/advisor.tsx:93`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/resources/js/pages/advisor.tsx#L93)) and test them with fakes ([`tests/Feature/ProductAdvisorTest.php:27`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/tests/Feature/ProductAdvisorTest.php#L27)).
  - `confidence` lets the UI decide how much to trust the answer.
- Guardrails on the route ([`routes/web.php:22`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/routes/web.php#L22)): `auth`, a throttle (every prompt costs money), and the question is validated to 500 characters ([`app/Http/Requests/AskProductAdvisorRequest.php:21`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/07-ai-agent/app/Http/Requests/AskProductAdvisorRequest.php#L21)).
- **Hands-on:** wire up the tool and ask questions at `/advisor`, e.g. *"Well-rated desk lamps under $100 that are in stock"*.

### 4.3 Performance patterns for AI (20 min) → `checkpoint/08-ai-performance`

**Where to cache: the three layers.**

1. **Full agent responses: safe when?** ([`app/Http/Controllers/ProductAdvisorController.php:35`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/app/Http/Controllers/ProductAdvisorController.php#L35))
   - Safe here because the prompt has **no per-user context**, and catalog advice that's an hour old is still useful.
   - *Not* safe when answers depend on who's asking, on conversation history, or on fast-changing data like stock levels or prices at checkout.
   - Questions are **normalized conservatively** (lowercase, whitespace squished, trailing `?!.` dropped) before hashing, so "Desk lamps?" and " desk LAMPS " share one entry ([`app/Ai/AdvisorCache.php:29`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/app/Ai/AdvisorCache.php#L29)).
   - Over-normalizing is a correctness bug: stripping punctuation would make "lamps < $100" and "lamps > $100" share an answer. Tested in [`tests/Feature/AiPerformanceTest.php:122`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/tests/Feature/AiPerformanceTest.php#L122).
   - **Failures are never cached** ([`tests/Feature/AiPerformanceTest.php:53`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/tests/Feature/AiPerformanceTest.php#L53)).
   - The UI badge says "served from cache (0 new tokens)" ([`resources/js/pages/advisor.tsx:57`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/resources/js/pages/advisor.tsx#L57)).
2. **Tool call results: almost always safe** ([`app/Ai/Tools/SearchProducts.php:40`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/app/Ai/Tools/SearchProducts.php#L40)).
   - They're plain data, and the model calls the same search for many different questions.
   - Reuses `Cache::flexible` from Act 3, with keys built from the normalized arguments.
   - Note what it saves: DB time and latency, **not tokens**. The result still goes into the model's context.
3. **Embeddings, if you use them: the cheap layer to cache.** We don't use them here (keyword search is enough at this size). When you do, embeddings for unchanged text never change, so cache them forever, keyed by a content hash. The SDK has built-in embedding caching in `config/ai.php` ([`config/ai.php:26`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/config/ai.php#L26)).

- **Stale-while-revalidate for AI:** "slightly old" is fine for recommendations and summaries, not for anything transactional. The same `[fresh, stale]` thinking from 3.1 applies.
- **Queueing agent work: deep analysis as a job.**
  - `DeepProductAnalyst` extends the advisor with `#[UseSmartestModel]`, `#[MaxSteps(8)]`, `#[Timeout(180)]` ([`app/Ai/Agents/DeepProductAnalyst.php:19`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/app/Ai/Agents/DeepProductAnalyst.php#L19)). Slow and expensive, so it never runs in a request.
  - The button POSTs to [`app/Http/Controllers/StartDeepAnalysisController.php:19`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/app/Http/Controllers/StartDeepAnalysisController.php#L19), which sets a *pending* flag and dispatches `RunDeepAnalysis` ([`app/Jobs/RunDeepAnalysis.php:13`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/app/Jobs/RunDeepAnalysis.php#L13)).
  - The job is `ShouldBeUnique` per question hash (double-clicks don't double-bill), with `tries = 1` (don't silently retry a paid call) and a `failed()` handler that clears the flag and stores an error.
  - **Gotcha: `retry_after`.** The database queue re-reserves any job still "running" after `retry_after` seconds (default 90). A 240 s job would get picked up by a second worker mid-run. With `tries = 1` that second attempt fails it, and the user sees an error while the first run is still going. We raised it to 300 ([`config/queue.php:45`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/config/queue.php#L45)). Rule: **`retry_after` > the longest job `timeout`**. `ShouldBeUnique` stops duplicate *dispatches*, not redelivery.
  - The page polls only the deep-analysis props with `usePoll(..., { only: [...] })` while the job is pending ([`resources/js/pages/advisor.tsx:75`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/resources/js/pages/advisor.tsx#L75)) and shows a pulsing skeleton.
  - **Named rate limiters** ([`app/Providers/AppServiceProvider.php:51`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/app/Providers/AppServiceProvider.php#L51)). Requests that can prompt a model count against 20/min per user. Polls (partial reloads that don't include `answer`) are free, and deep analysis has its own 5/min budget. With plain `throttle:20,1`, the 3-second poll alone would burn the whole budget in a minute.
- **The cost dimension:**
  - `php artisan workshop:ai-cost` ([`app/Console/Commands/WorkshopAiCost.php:17`](https://github.com/DGarbs51/ship-fast-load-faster/blob/checkpoint/08-ai-performance/app/Console/Commands/WorkshopAiCost.php#L17)): *cost = requests × (input tokens × input price + output tokens × output price)*. A 60% hit rate on 1,000 questions a day cuts model calls from 1,000 to 400.
  - Prices are **command options, not quotes**. Plug in your provider's current per-million-token pricing on the day.
  - Talking point: **caching is a budget tool, not just a speed tool.** Every cache hit is a model call you didn't pay for.
  - Mention provider-side **prompt caching** (cached system prompt and tool definitions billed at a discount) as a fourth layer you get almost for free with a stable `instructions()`.
- **Hands-on:** cache the tool calls, then queue a "deep analysis" run (`php artisan queue:work` must be running).

> **Blurb: Why AI calls need the same playbook as slow queries**
> A model call is the slowest, most variable, and only *metered* dependency in the app: seconds of latency, a token bill on every call, and rate limits you don't control. Everything from Acts 2–3 applies directly. Don't repeat work (cache answers and tool results), don't block the request (queue long runs), protect against bursts (unique jobs, throttles, locks), and keep the parts the model touches (tools) fast and indexed. The difference is that a cache miss here costs **money** as well as time.

### 4.4 Final benchmark & "the journey" (10 min)

- Run `php artisan workshop:bench` on `main` and on `checkpoint/08-ai-performance`, side by side.
  - Original dashboard: ~3 s in-process (4–6 s in the browser with Debugbar), 262 queries.
  - Final dashboard: single-digit ms warm, ~15 queries (mostly session, auth, and cache reads).
- Run `php artisan workshop:ai-cost --requests=1000 --hit-rate=0.6`. Ask the room what hit rate they'd expect for *their* product.
- The journey on one screen:
  1. **Diagnose:** measure, find the 3 buckets.
  2. **Queries:** stop N+1s, aggregate in SQL, index what you filter, join, and sort on.
  3. **Cache:** cache what's still expensive, invalidate in one place.
  4. **Queues:** move work that doesn't need to happen now out of the request.
  5. **Scale:** stampede locks plus stale-while-revalidate; Octane once state is clean.
  6. **AI:** the same playbook, plus tokens as a budget.

---

## Wrap-up & Q&A (10 min)

- Starter repo = `main`. Final repo = `checkpoint/08-ai-performance`.
- "What I'd do next," by experience level:
  - **Getting started:** turn on `preventLazyLoading` in your app tomorrow and fix what it finds.
  - **Mid-level:** run EXPLAIN on your 5 slowest queries; add indexes; add query-count tests like `QueryPerformanceTest`.
  - **Senior:** audit singletons and statics for Octane-readiness; put `Cache::flexible` + locks on your hottest keys; add cost tracking to every AI call.
- Open Q&A.

---

## Appendix: commands used on stage

```bash
php artisan workshop:bench                         # all pages
php artisan workshop:bench /dashboard --runs=5     # one page
php artisan workshop:stampede --workers=8          # 04 vs 05
php artisan workshop:ai-cost --hit-rate=0.6        # 08
sqlite3 database/database.sqlite "EXPLAIN QUERY PLAN <sql>"
php artisan queue:work                             # 04+
php artisan schedule:work                          # 04+
php artisan octane:start                           # 06+
php artisan test --compact                         # every checkpoint is green
```
