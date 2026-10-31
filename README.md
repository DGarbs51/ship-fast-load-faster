> **You are on `checkpoint/04-queues` — Act 2.3 "Async layer".**
> To be here from scratch: follow Setup below, then `git stash --include-untracked`, `git config checkout.defaultRemote origin`, `git switch checkpoint/04-queues`, `composer install && npm install`, `php artisan migrate:fresh --seed`, `php artisan cache:clear`, and `php artisan workshop:doctor`. Start the servers under Run, log in again, and rerun doctor. Then: `php artisan queue:listen` in a third terminal.

# Ship Fast, Load Faster

The dashboard is slow on purpose. We'll measure it, fix one layer at a time, and measure again. This is the attendee app for the LaraconAU 2026 workshop: Laravel 13, Inertia React, and SQLite for the database, cache, and queue.

- **Presentation:** [ship-fast-present.laravel-demo.cloud](https://ship-fast-present.laravel-demo.cloud). It follows the projector and tells you which branch to be on.
- **Log in:** `admin@example.com` / `password`. `/dashboard` redirects to `/login` until you do.
- **Using Herd?** Set Herd › PHP › `memory_limit` to `-1` and restart PHP. The slow dashboard runs out of memory at Herd's default 128M.

## Fork and clone

Fork [DGarbs51/ship-fast-load-faster](https://github.com/DGarbs51/ship-fast-load-faster). Untick *Copy the main branch only*. You need every branch.

```bash
git clone https://github.com/<your-username>/ship-fast-load-faster.git
cd ship-fast-load-faster
git config checkout.defaultRemote origin
git branch -r
```

You should see `origin/main` and eight `origin/checkpoint/*` branches. Start on `main`. The `git config` line lets `git switch checkpoint/...` work even if you also add an `upstream` remote; without it Git refuses with "matched multiple remote tracking branches".

## Prerequisites

- PHP 8.5 with SQLite support. `php -v` must say 8.5 — including in the terminal where you'll run Vite.
- Node 24. `node -v` should start with `v24`; `.nvmrc` is here if you use nvm.
- Composer
- SQLite

Use npm. Sail and Docker aren't supported for this workshop.

> **Using Herd?** Select PHP 8.5. Herd caps PHP at 128M. The slow dashboard needs more. Set Herd › PHP › `memory_limit` to `-1` and restart its PHP service. Check your shell's `php` alias too. Don't upgrade Herd during the workshop.

## Setup

Run these from the repository root. `migrate:fresh --seed` resets the local workshop database; don't point this app at data you need to keep.

**One shot:**

```bash
composer setup
composer run dev
```

`composer setup` installs dependencies, creates `.env` and the SQLite file, seeds the database, sets `checkout.defaultRemote`, and builds the frontend. `composer run dev` starts the web server, a queue listener, and Vite in one terminal; stop it with Ctrl+C. Then check the setup in another terminal with `php artisan workshop:doctor`.

**Step by step**, if you'd rather see each command:

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan workshop:doctor
```

Doctor prints a fix beside each failed check. On the first run, web memory and Vite will be unverified until the servers below are running. Start them, then rerun doctor. It exits 1 until every check passes.

## Run

Skip this section if `composer run dev` is already running; it starts all three.

Terminal 1:

```bash
php artisan serve
```

Terminal 2:

```bash
npm run dev
```

From `checkpoint/04-queues` onward, terminal 3:

```bash
php artisan queue:listen
```

`queue:listen` reloads your code for every job, so edits to a job take effect without restarting it.

Open the URL printed by `php artisan serve`. Keep the servers running and check the setup in another terminal:

```bash
php artisan workshop:doctor
php artisan workshop:bench
```

If Herd serves the app instead, set `APP_URL` in `.env` to its URL or pass that URL with `php artisan workshop:doctor --url=...`. Doctor checks web memory separately from CLI memory. A passing CLI check doesn't tell you what Herd is using.

## Log in

Email: `admin@example.com`. Password: `password`. Catching up resets the database, so log in again after each checkpoint switch.

Visit the dashboard. Debugbar and Telescope (`/telescope`) are available in local development. Record measurements in [the findings template](workshop/FINDINGS-TEMPLATE.md); `workshop:bench` works on every branch, including `main`.

## Follow along

Presenter: [ship-fast-present.laravel-demo.cloud](https://ship-fast-present.laravel-demo.cloud). The screen tells you which branch to be on, and **Catch me up** shows the commands below for the live branch. If the presenter isn't available, use the checkpoint table below.

## Catch up to a checkpoint

Each checkpoint includes the earlier ones. Checkpoint 01 now has the same app code as `main`: the benchmark and slow-query log are available from the start.

| Branch | Segment | What it adds |
| --- | --- | --- |
| `checkpoint/01-diagnose` | Act 1.3 — Diagnostic exercise | A catch-up point for profiling; benchmark, slow-query log, and findings template already exist on `main`. |
| `checkpoint/02-queries` | Act 2.1 — Query layer | Indexes, eager loading, database aggregates, and a latest-order subquery. |
| `checkpoint/03-cache` | Act 2.2 — Cache layer | Cached dashboard stats with versioned keys and observer invalidation. |
| `checkpoint/04-queues` | Act 2.3 — Async layer | Unique queued analytics rebuilds and queued order confirmations. Start `php artisan queue:listen`. |
| `checkpoint/05-stampede` | Acts 3.1–3.2 — Stampedes and memory | Stale-while-revalidate, a rebuild lock, and lazy customer exports. |
| `checkpoint/06-octane` | Act 3.3 — Octane | Octane configuration and a scoped audit context. The Octane demo is on screen; `artisan serve` still works locally. |
| `checkpoint/07-ai-agent` | Acts 4.1–4.2 — AI SDK and tools | Product advisor, product-search tool, structured output, and an advisor page. |
| `checkpoint/08-ai-performance` | Act 4.3 — AI performance | Cached tool results and responses, queued analysis, and a cost projection command. |

Stop the servers and queue listener before switching. Replace `checkpoint/NN-slug` with the branch on screen:

```bash
git stash --include-untracked
git config checkout.defaultRemote origin
git switch checkpoint/NN-slug
composer install && npm install
php artisan migrate:fresh --seed
php artisan cache:clear
php artisan workshop:doctor
```

Restart the servers from **Run**, log in again, and rerun doctor. `migrate:fresh --seed` rebuilds the local workshop database so it matches the checkpoint exactly, including indexes from a migration you ran earlier. Your code edits are in `git stash list`; don't pop them onto a later checkpoint unless you want to merge those changes. The `git config` line is harmless to repeat; it makes `git switch` pick `origin` when you also have an `upstream` remote, and still finds the branch on `upstream` if your fork only has `main`.

For checkpoints 07–08, real advisor requests need your own provider key and can incur charges. You can follow the demo without one; tests use fakes, and the default benchmark doesn't call an AI provider.

## Troubleshooting

**No checkpoint branches?** The fork copied only `main`. Re-fork with all branches, or fetch the original repository:

```bash
git remote add upstream https://github.com/DGarbs51/ship-fast-load-faster
git fetch upstream
```

**Wayfinder fails during `npm run dev`?** Run `php -v` in that terminal. An old shell alias can override Herd's PHP selection. Point both at PHP 8.5, open a new terminal, and restart Vite.

**Node 22 or an `EBADENGINE` error?** Use Node 24. If you have nvm:

```bash
nvm install
nvm use
npm install
```

**`fatal: 'checkpoint/...' matched multiple remote tracking branches`?** You have both `origin` and `upstream`. Run `git config checkout.defaultRemote origin`, then switch again.

**`Nothing to migrate` after editing the index migration, or `EXPLAIN QUERY PLAN` still says `SCAN orders`?** The migration ran before the `orders` block was in it, and Laravel won't run the same migration twice. Run `php artisan migrate:fresh --seed` (resets local workshop data). `php artisan workshop:doctor` reports this.

**“Allowed memory size exhausted” on `/dashboard`?** Set Herd's PHP `memory_limit` to `-1`, restart PHP, and rerun doctor against the Herd URL. CLI and web PHP can load different ini files. `php artisan serve` commonly runs unbounded; doctor reports the actual limit rather than assuming it.

Missing a key, tables, or frontend assets? Finish **Setup**, start both servers, and rerun `php artisan workshop:doctor`. If `workshop:bench` isn't defined, your checkout predates this README: fetch the updated branches before the workshop.
