# Ship Fast, Load Faster

This is the starter application for the LaraconAU 2026 performance workshop. It is a Laravel and Inertia React e-commerce admin dashboard that is intentionally unoptimized so attendees can diagnose and improve it during the exercises.

## Prerequisites

- PHP 8.5
- Composer
- Node.js 22+
- SQLite

## Setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
```

## Run The App

Use two terminal windows:

```bash
php artisan serve
```

```bash
npm run dev
```

Open `http://127.0.0.1:8000`, sign in with `test@example.com` and `password`, then visit the dashboard.

Debugbar and Telescope are available in local development. Telescope uses its default `/telescope` route.
