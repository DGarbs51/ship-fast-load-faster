# Diagnostic findings

Fill one row per slow endpoint. Use Debugbar (Queries + Timeline tabs), Telescope (`/telescope/queries`), `php artisan workshop:bench`, and `storage/logs/laravel.log` (slow query log).

| Endpoint | Avg ms | Queries | Duplicate queries | Slowest query (ms) | Suspected cause (N+1 / missing index / PHP aggregation / blocking work) |
|---|---|---|---|---|---|
| `/dashboard` | | | | | |
| `/products` | | | | | |
| `/orders` | | | | | |

## EXPLAIN for the slowest query

```sql
-- paste the query, then run:
EXPLAIN QUERY PLAN <query>;
```

Plan output:

```
```

Does it say `SCAN` (full table) or `SEARCH ... USING INDEX`?

## Top 3 fixes I'd try first

1.
2.
3.
