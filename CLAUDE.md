# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Laravel 13 (PHP 8.5) + Inertia v3 + React 19 + TypeScript + Tailwind v4. Auth via Laravel Fortify. Typed route/action helpers via Laravel Wayfinder. Tests via Pest 4.

Framework-specific rules live in `.claude/rules/` and auto-load by file pattern (don't import them from here):

- `laravel.md` — `**/*.php`
- `inertia.md` — `**/*.{php,tsx,jsx,vue}`
- `react.md` — `**/*.{tsx,jsx}`
- `tailwind.md` — `**/*.{css,scss,vue,tsx,jsx}`

## Commands

This is a workshop app that many attendees run on their own laptops. It must work with the minimal setup only: `php artisan serve` (http://127.0.0.1:8000) plus `npm run dev`, SQLite for the database, cache, and queue. Do not assume Herd, Valet, Sail, Docker, Redis, or any other service. From checkpoint 04 on, queued jobs also need `php artisan queue:work` in a third terminal.

```bash
php artisan serve         # app at http://127.0.0.1:8000
npm run dev               # vite
php artisan queue:work    # queued jobs (checkpoint 04+)
composer run dev          # all three at once (serve, queue:listen, vite)
npm run build             # production bundle
npm run build:ssr         # SSR bundle (build + ssr build)

php artisan test --compact                     # all tests, compact output
php artisan test --compact --filter=testName   # one test by name/file

vendor/bin/pint --dirty --format agent   # format changed PHP files (run before finishing PHP edits)
npm run lint                              # eslint --fix
npm run format                            # prettier write resources/
npm run types:check                       # tsc --noEmit

composer run ci:check     # lint:check + format:check + types:check + test (mirrors CI)
```

## Architecture

**Backend layout (`app/`)**

- `Actions/Fortify/` — Fortify single-purpose actions (`CreateNewUser`, `UpdateUserProfileInformation`, etc.). Auth flows are wired through Fortify, not custom controllers.
- `Http/Controllers/` — thin controllers, delegate to Actions or Services.
- `Http/Requests/` — form requests; always `$request->validated()`.
- `Models/`, `Providers/`, `Concerns/`.

**Frontend layout (`resources/js/`)**

- `pages/` — Inertia page components (resolved by `Inertia::render('Path/Name')`). Pattern includes `auth/`, `dashboard.tsx`, `settings/`, `welcome.tsx`.
- `layouts/` — persistent Inertia layouts (assigned via `Page.layout = page => <Layout>...`).
- `components/`, `hooks/`, `lib/`, `types/`.
- `actions/`, `routes/`, `wayfinder/` — **generated** by Laravel Wayfinder via the Vite plugin. Import controller actions from `@/actions/...` and named routes from `@/routes/...` instead of hardcoding URLs. Don't hand-edit these files; they regenerate on `vite build`/`vite dev`.

**Routing**

`routes/web.php` is the main entry; `routes/settings.php` is included for settings UI; `routes/console.php` for scheduled work. There is no `routes/api.php` (Laravel 13 default — run `php artisan install:api` if needed).

**Inertia data flow**

Controllers return `Inertia::render('Page', [...])`. Pass HTTP Resources (or arrays), never raw Eloquent models. `Inertia::lazy()` is gone — use `Inertia::optional()`. Shared data lives in `app/Http/Middleware/HandleInertiaRequests.php`.

**SSR**

Configured via `@inertiajs/vite`; SSR works automatically in dev. Production needs `npm run build:ssr` and the inertia SSR daemon.

## Conventions

- Use `php artisan make:*` to scaffold (pass `--no-interaction`). When making models, also create factories/seeders.
- Bias toward Actions for single operations and Services for grouped ones; avoid the Repository pattern (use Eloquent scopes).
- Migrations are forward-only — do not write `down()` methods.
- For frontend navigation between Inertia pages, prefer `<Link>` over `router.visit()` so prefetching works.
- Run `vendor/bin/pint --dirty --format agent` before finalizing PHP changes.

## Laravel Boost (MCP)

This project has the Laravel Boost MCP server. Prefer Boost tools over manual alternatives:

- `search-docs` for version-specific docs (always before changes touching package APIs) — use broad topic queries, no package names.
- `database-query` / `database-schema` instead of raw tinker SQL.
- `get-absolute-url` to resolve project URLs.
- `browser-logs` for recent browser errors.
- `tinker` for ad-hoc PHP — single-quote the `--execute` argument.

## Testing

- Pest 4. Create with `php artisan make:test --pest SomeFeatureTest` (no directory prefix; flag with `--unit` for unit tests).
- Most tests should be feature tests. Use factories and their states; don't construct models manually in tests.
- Every change must be covered by a new or updated test, then run with `--compact` and a filter.
- Don't write verification scripts or tinker snippets when a test would prove the same thing.
- Don't delete tests without approval.

## Skills

Project skills auto-activate from their descriptions — don't wait until stuck. Most relevant here: `inertia-react-development`, `wayfinder-development`, `fortify-development`, `laravel-best-practices`, `pest-testing`, `tailwindcss-development`.

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

## Foundational Context

This application is a Laravel application running on PHP 8.5. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:
- PHP packages: run `composer show --direct` to list direct dependencies with versions, or `composer show <vendor/package>` for a single package.
- JS packages: check `package.json` for the installed versions.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If a frontend change doesn't show in the UI or you get a "Unable to locate file in Vite manifest" error, run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Use `search-docs` before changes that depend on Laravel ecosystem APIs, behavior, configuration, or version-specific syntax. Skip it for copy-only edits and other changes where package documentation is irrelevant. Reuse sufficient results already in context instead of searching again.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Project Rules

- This project contains committed, area-grouped rules in `.ai/rules` when that directory exists, including path-scoped framework guidelines under `.ai/rules/boost`. Before you enter plan mode or create/edit any file, you MUST first: open @.ai/rules/index.md (it maps file globs to rule files), read every rule file whose globs cover the path(s) in scope, and run `grep -rin 'keyword' .ai/rules` to catch what a path match alone misses. Do not write code until you have read and are following every matching rule. If `.ai/rules` does not exist, continue without it.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.
- Activate the `deploying-to-cloud` skill whenever deploying to Laravel Cloud, configuring Cloud environments or resources, using the Cloud CLI, or troubleshooting Cloud deployments.

=== tests rules ===

# Test Enforcement

- Add or update tests for behavior and logic changes when a test provides meaningful regression coverage.
- Pure copy, styling, and layout-only changes do not require new or updated tests.
- When test coverage applies, run the affected tests and ensure they pass.
- Test the changed behavior and its important failure modes, but do not add tests beyond them.
- Read the `testing-best-practices` skill before writing tests.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

# Pest

- This project uses Pest. Create tests with `php artisan make:test --pest {name}`.
- Do not include the test suite directory in `{name}`. Use `SomeFeatureTest`, not `Feature/SomeFeatureTest`.
- Read the `testing-best-practices` skill for guidance on coverage, naming, structure, dependency isolation, and review.
- Do not delete tests or test files without approval. They are part of the application.

## Running Tests

- Run the narrowest set of tests that covers the change. Pass a file path or `--filter=testName` to `php artisan test --compact`.
- Rerun a test after each change to it.
- Run `vendor/bin/pest` to call the test runner directly. It accepts the same file path and `--filter=testName` arguments.
- After the feature tests pass, ask the user to run the complete suite with `php artisan test --compact`.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
