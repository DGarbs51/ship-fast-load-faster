---
paths: "**/*.{php,tsx,jsx,vue}"
---

# Inertia.js v3 + Laravel Rules

**Requirements**: Laravel 11+, PHP 8.2+, Vue 3 or React 19+. ESM-only (no `require()`). Build target: ES2022.

### v2 → v3 Breaking Changes

| v2 | v3 |
|----|----|
| `router.cancel()` | `router.cancelAll()` (cancels sync, async, and prefetch) |
| `invalid` event | `httpException` event / `inertia:httpException` |
| `exception` event | `networkError` event / `inertia:networkError` |
| `<head inertia>` | `<head data-inertia>` |
| `data-page` attribute for initial data | `<script type="application/json">` |
| `hideProgress()` / `revealProgress()` | Use `progress` object |
| `Inertia::lazy()` / `LazyProp` | `Inertia::optional()` |
| `future` config namespace | Removed — all v2 future flags always enabled |
| Axios bundled | Removed — use built-in XHR client or install separately |
| `qs` package bundled | Removed — install separately if needed |
| `lodash-es` bundled | Replaced with `es-toolkit` |
| `Inertia\Testing\Concerns\Has`, `Matching`, `Debugging` | Removed |
| React `<Deferred>` resets fallback on partial reload | No longer resets — use `reloading` slot prop |
| `useForm` resets processing/progress anywhere | Only resets in `onFinish` callback |
| Config flat structure | Page settings nested under `pages` key |

### New v3 Features

**Vite Plugin (`@inertiajs/vite`)**: Automatic page resolution and SSR setup — eliminates boilerplate.

**`useHttp` hook**: Standalone HTTP requests without triggering page visits:
```typescript
import { useHttp } from '@inertiajs/vue3'

const http = useHttp()
const response = await http.post('/api/upload', formData)
```

**Optimistic Updates**: Data changes apply instantly with automatic rollback on failure.

**Layout Props (`useLayoutProps`)**: Share dynamic data between pages and persistent layouts:
```typescript
import { useLayoutProps } from '@inertiajs/vue3'

const { title } = useLayoutProps()
```

**Instant Visits**: Swap target component before server responds for perceived speed.

**Custom Exception Handling**: Render Inertia error pages directly from exception handlers with shared data support.

**Per-visit error callbacks**:
```javascript
router.post('/users', data, {
    onHttpException: (response) => { /* return false to prevent error page */ },
    onNetworkError: (error) => { ... },
})
```

**`preserveErrors` option**: Keep validation errors during partial reloads.

**Default layout** in `createInertiaApp`:
```javascript
createInertiaApp({
    defaults: {
        layout: DefaultLayout,
    },
})
```

**Blade component alternatives**:
```blade
<x-inertia::head />
<x-inertia::app />
```

**Per-route SSR disabling** via middleware/facade.

**Form component generics** for type-safe errors.

### Prop Types

| Method | Standard | Partial Reload | Evaluated |
|--------|----------|----------------|-----------|
| `User::all()` | ✓ | optional | always |
| `fn () => User::all()` | ✓ | optional | when needed |
| `Inertia::optional(fn)` | ✗ | optional | when needed |
| `Inertia::defer(fn)` | after render | optional | after load |
| `Inertia::once(fn)` | cached | cached | once |
| `Inertia::defer(fn)->once()` | cached | cached | once |
| `Inertia::always(val)` | ✓ always | ✓ always | always |
| `Inertia::merge(arr)` | append | append | when included |

Nested prop types (`optional()`, `defer()`, `merge()`) work inside closures with dot-notation paths.

### HTTP Resources (Required)

NEVER pass Eloquent models directly to Inertia. Always use HTTP Resources:

```php
// Bad - exposes all attributes, no control
return Inertia::render('Users', [
    'users' => User::all(),
    'posts' => Post::paginate(10),
]);

// Good - explicit serialization control
return Inertia::render('Users', [
    'users' => UserResource::collection(User::all()),
    'posts' => PostResource::collection(Post::paginate(10)),
]);
```

This applies to all prop types including `defer`, `once`, `merge`:
```php
'users' => Inertia::defer(fn () => UserResource::collection(User::active()->get())),
'plans' => Inertia::once(fn () => PlanResource::collection(Plan::all())),
```

### Once Props (Client-Side Caching)

Cache expensive or infrequently-changing data on the client:

```php
// Basic usage - cached on client after first load
return Inertia::render('Billing', [
    'plans' => Inertia::once(fn () => Plan::all()),
]);

// Chainable modifiers
Inertia::once(fn () => Data::get())
    ->fresh()              // force refresh (accepts bool for conditional)
    ->until(now()->addHour())  // expiration: DateTimeInterface, DateInterval, or seconds
    ->as('custom-key');    // custom cache key for cross-page sharing
```

**Global sharing:**
```php
// Option 1: share() with once()
Inertia::share('countries', Inertia::once(fn () => Country::all()));

// Option 2: Dedicated helper
Inertia::shareOnce('countries', fn () => Country::all());

// Option 3: Middleware method (HandleInertiaRequests.php)
public function shareOnce(Request $request): array
{
    return ['countries' => fn () => Country::all()];
}
```

### Deferred Props

```php
return Inertia::render('Dashboard', [
    'user' => $user,
    'permissions' => Inertia::defer(fn () => Permission::all()),
    'teams' => Inertia::defer(fn () => Team::all(), 'sidebar'),  // grouped
    'settings' => Inertia::defer(fn () => Settings::all())->once(),  // cached + deferred
]);
```

**Vue/React** — use `reloading` slot prop for loading indicators during partial reloads:
```vue
<Deferred data="permissions" :fallback="<Skeleton />">
    <template #default="{ reloading }">
        <div :class="{ 'opacity-50': reloading }">
            <PermissionsList :permissions="permissions" />
        </div>
    </template>
</Deferred>
<Deferred :data="['teams', 'projects']" :fallback="<Loading />">
    <Sidebar :teams="teams" :projects="projects" />
</Deferred>
```

### Prefetching

**IMPORTANT**: Prefetch only works on `<Link>` components, not on `<div onClick={router.visit()}>`. Convert clickable divs to Links for prefetch support.

```vue
<Link href="/users" prefetch>75ms hover</Link>
<Link prefetch="mount">On mount</Link>
<Link :prefetch="['mount','hover']">Both</Link>
<Link prefetch cache-for="1m">1m cache</Link>
<Link :cache-for="['30s','1m']">Stale-revalidate</Link>
```

**Global configuration:**
```typescript
import { config } from '@inertiajs/core';

// Reduce hover delay (default 75ms)
config.set('prefetch.hoverDelay', 15);
```

**Cache busting after mutations:**
```typescript
// Invalidate prefetch cache after POST/PUT/PATCH/DELETE
router.on('finish', (event) => {
  const visit = event.detail.visit;
  if (visit?.completed && ['post', 'put', 'patch', 'delete'].includes(visit.method)) {
    router.flushAll();
  }
});
```

Manual: `router.prefetch('/users', { method: 'get' }, { cacheFor: '1m' }); router.flushAll()`

### Merging Props (Infinite Scroll)

```php
return Inertia::render('Posts', [
    'posts' => Inertia::merge(Post::paginate(10)->items()),
    'hasMore' => $posts->hasMorePages(),
]);

Inertia::merge($items)                          // root append
Inertia::merge($items)->prepend()               // prepend
Inertia::merge($paginated)->append('data')      // nested
Inertia::merge($posts)->append('data', matchOn: 'id')  // update by ID
```

Reset: `router.reload({ data: { search: q }, reset: ['posts'], only: ['posts', 'hasMore'] })`

### InfiniteScroll Component

```tsx
import { InfiniteScroll } from '@inertiajs/react'

// Auto-load on scroll
<InfiniteScroll data="users">
    {users.data.map(user => <div key={user.id}>{user.name}</div>)}
</InfiniteScroll>

// Manual "Load More" button
<InfiniteScroll data="users" manual
    next={({ loading, fetch, hasMore }) => (
        hasMore && <button onClick={fetch} disabled={loading}>Load more</button>
    )}
>
    {users.data.map(user => <div key={user.id}>{user.name}</div>)}
</InfiniteScroll>

// Reverse mode (chat), custom buffer
<InfiniteScroll data="messages" reverse buffer={500} onlyPrevious>
    {messages.data.map(msg => <div key={msg.id}>{msg.text}</div>)}
</InfiniteScroll>
```

Server-side: `'users' => Inertia::scroll(fn () => User::paginate())`

### WhenVisible

```vue
<WhenVisible data="recommendations" :fallback="<Skeleton />">
    <Recommendations :items="recommendations" />
</WhenVisible>
<WhenVisible data="products" :buffer="500">  <!-- 500px buffer -->
    <ProductGrid :products="products" />
</WhenVisible>
```

Exclude from forms: `form.post('/users', { except: ['recommendations'] })`

### Polling

```vue
usePoll(5000, { only: ['notifications'] })  // ALWAYS use only

const { start, stop } = usePoll(2000, { only: ['live'] }, {
    autoStart: false, keepAlive: true,
})
```

### useHttp (Standalone Requests)

Replace Axios with built-in HTTP client for non-navigation requests:

```typescript
import { useHttp } from '@inertiajs/vue3'

const http = useHttp()

// Supports interceptors (replaces Axios interceptors)
const { data } = await http.post('/api/upload', formData)
const { data } = await http.get('/api/search', { params: { q: 'test' } })
```

### useForm

```vue
<script setup>
const form = useForm('CreateUser', { name: '', email: '', avatar: null })
const submit = () => form.post('/users', {
    preserveScroll: true,
    onSuccess: () => form.reset('password')
})
</script>

<template>
<form @submit.prevent="submit">
    <input v-model="form.name" :disabled="form.processing" />
    <span v-if="form.errors.name">{{ form.errors.name }}</span>
    <input type="file" @input="form.avatar = $event.target.files[0]" />
    <progress v-if="form.progress" :value="form.progress.percentage" max="100" />
    <button :disabled="form.processing || !form.isDirty">
        {{ form.processing ? 'Saving...' : 'Save' }}
    </button>
    <span v-if="form.recentlySuccessful">Saved!</span>
</form>
</template>
```

| Property | Description |
|----------|-------------|
| `errors`, `hasErrors` | Server validation |
| `processing`, `progress` | Submit state |
| `isDirty`, `wasSuccessful`, `recentlySuccessful` | Form state |
| `reset()`, `clearErrors()`, `transform()`, `setError()` | Methods |

**v3 change**: `useForm` only resets `processing` and `progress` in the `onFinish` callback — processing state persists until visit completion.

Transform: `form.transform(d => ({ ...d, remember: d.remember ? 'on' : '' })).post('/login')`

### Persistent Layouts

**Vue:** `defineOptions({ layout: Layout })`
**React:** `Dashboard.layout = page => <Layout>{page}</Layout>`
**Nested:** `layout: [SiteLayout, AdminLayout]`

**Default layout in createInertiaApp (v3):**
```javascript
createInertiaApp({
    defaults: {
        layout: DefaultLayout,  // v3: cleaner default layout
    },
    resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
        return pages[`./Pages/${name}.vue`]
    },
})
```

### Partial Reloads

`router.reload({ only: ['users'] })` | `router.reload({ except: ['notifications'] })`

**v3**: Use `preserveErrors` to keep validation errors during partial reloads.

```php
return Inertia::render('Dashboard', [
    'users' => User::all(),                          // always evaluated
    'stats' => fn () => Stats::calculate(),          // lazy
    'heavy' => Inertia::optional(fn () => Heavy()),  // only on request
]);
```

### Shared Data

```php
// HandleInertiaRequests.php
public function share(Request $request): array {
    return array_merge(parent::share($request), [
        'auth' => fn () => ['user' => $request->user()?->only('id', 'name', 'email')],
        'flash' => fn () => [
            'success' => $request->session()->get('success'),
            'error' => $request->session()->get('error'),
        ],
        'can' => fn () => $request->user() ? ['createPost' => $request->user()->can('create', Post::class)] : [],
    ]);
}
```

### Flash Data

```php
// Server-side
Inertia::flash('message', 'User created successfully!');
Inertia::flash(['message' => 'Created!', 'newUserId' => $user->id]);
```

```tsx
// Client-side access
const { flash } = usePage().props

// Client-side flash (no server request)
router.flash({ message: 'Local notification' })
```

### useFormContext

Access parent `<Form>` state from deeply nested children:
```tsx
import { useFormContext } from '@inertiajs/react'

function FormActions() {
    const form = useFormContext()
    return (
        <div>
            {form.isDirty && <span>Unsaved changes</span>}
            <button onClick={() => form.submit()}>Submit</button>
        </div>
    )
}
```

### View Transitions

```tsx
// Programmatic
router.visit('/page', { viewTransition: true })

// Link component
<Link href="/page" viewTransition>Navigate</Link>

// Global default
createInertiaApp({
    defaults: {
        visitOptions: () => ({ viewTransition: true }),
    },
})
```

### History Encryption

`'history' => ['encrypt' => true]` in config | `Inertia::encryptHistory()` per-request | `Inertia::clearHistory()` on logout

Client-side: `router.clearHistory()`

**v3**: `clearHistory` and `encryptHistory` page object properties are now optional.

### Head/Meta

```vue
<Head><title>Page</title><meta head-key="description" name="description" content="..." /></Head>
```

Use `head-key` to prevent duplicates from layouts.

**v3**: Head element uses `data-inertia` attribute (was `inertia` in v2).

### SSR

**v3 Simplified SSR** with `@inertiajs/vite` — no separate Node.js server needed during development:

1. **vite.config.ts** — the Vite plugin handles page resolution and SSR automatically:
```typescript
import inertia from '@inertiajs/vite'

export default {
    plugins: [
        inertia(),  // Handles page resolution + SSR setup
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.ts'],
            ssr: 'resources/js/ssr.ts',
            refresh: true,
        }),
    ],
}
```

2. **resources/js/ssr.ts** - SSR entry (note: uses `eager: true`, no `resolvePageComponent`):
```typescript
import { createSSRApp, h, type DefineComponent } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import createServer from '@inertiajs/vue3/server'
import { renderToString } from '@vue/server-renderer'

const pages = import.meta.glob<DefineComponent>('./Pages/**/*.vue', { eager: true })

createServer(
    (page) =>
        createInertiaApp({
            page,
            render: renderToString,
            title: (title) => title ? `${title} - App` : 'App',
            resolve: (name) => {
                const component = pages[`./Pages/${name}.vue`]
                if (!component) throw new Error(`Page not found: ${name}`)
                return component
            },
            setup({ App, props, plugin }) {
                return createSSRApp({ render: () => h(App, props) }).use(plugin)
            },
        }),
    Number(import.meta.env.VITE_INERTIA_SSR_PORT) || 13714
)
```

3. **config/inertia.php** - derive URL from port env var:
```php
'ssr' => [
    'enabled' => true,
    'url' => 'http://127.0.0.1:' . env('INERTIA_SSR_PORT', 13714) . '/render',
],
```

4. **package.json** - build both bundles:
```json
"build": "vite build && vite build --ssr"
```

5. **.env** - single source of truth for port:
```env
INERTIA_SSR_PORT=13714
VITE_INERTIA_SSR_PORT="${INERTIA_SSR_PORT}"
```

**v3**: SSR works automatically in Vite dev mode — no separate Node.js server needed during development. Enhanced SSR error messages include component names and actionable hints.

**Custom port** (e.g., multiple apps on same server): Just change `INERTIA_SSR_PORT` in .env.

**Forge setup**:
- Daemon: `php artisan inertia:start-ssr`
- Env vars (set both, interpolation doesn't work in Forge UI):
  - `INERTIA_SSR_PORT=13715`
  - `VITE_INERTIA_SSR_PORT=13715`

**Deploy script** (after.sh): `$FORGE_PHP artisan inertia:stop-ssr 2>/dev/null || true` — daemon auto-restarts

### Testing

```php
$this->actingAs($user)->get('/users')
    ->assertInertia(fn (Assert $page) => $page
        ->component('Users/Index')->has('users', 10)
        ->has('users.0', fn ($p) => $p->has('id')->has('name')->etc()));
```

**Vitest mocks:**
```javascript
vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div><slot /></div>' }, Link: { template: '<a><slot /></a>' },
    usePage: () => ({ props: { auth: { user: { id: 1 } } } }),
})); global.route = vi.fn(name => `/${name}`)
```

### Progress Bar

`progress: { delay: 250, color: '#4B5563', includeCSS: true, showSpinner: false }`

**v3**: `hideProgress()` / `revealProgress()` removed — use the `progress` object directly.

### TypeScript

```typescript
// Global type config via declaration merging
declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps {
        auth: { user: User | null }; flash: { success?: string; error?: string }
    }
}

// Typed InertiaConfig
declare module "@inertiajs/core" {
    export interface InertiaConfig {
        sharedPageProps: {
            auth: { user: { id: number; name: string } | null };
        };
        flashDataType: {
            toast?: { type: "success" | "error"; message: string };
        };
    }
}

// Typed hooks
const page = usePage<{ posts: { id: number; title: string }[] }>()
const form = useForm<{ name: string; email: string }>({ name: '', email: '' })
form.dontRemember('password', 'password_confirmation')  // Exclude from persistence
```

### Common Mistakes

| Don't | Do |
|-------|-----|
| `User::all()` to Inertia | `UserResource::collection(User::all())` |
| Props without closures | `fn () => Query::run()` for lazy eval |
| `usePoll(2000)` | `usePoll(2000, { only: ['x'] })` |
| Mutating props | `router.reload()` |
| Missing `disabled` | `:disabled="form.processing"` |
| Large shared data | Lazy evaluate with `fn ()` |
| Missing `head-key` | Add attribute on meta tags |
| `usePage().props` in layouts | `computed(() => usePage().props)` |
| WhenVisible props in forms | `except: ['lazy']` |
| SSR with `resolvePageComponent` + `eager: true` | Direct glob access (type error) |
| SSR port conflict on shared server | Set `INERTIA_SSR_PORT` + `VITE_INERTIA_SSR_PORT` in env |
| `<div onClick={router.visit()}>` for nav | `<Link href prefetch>` (prefetch requires Link) |
| Stale prefetch cache after mutations | `router.flushAll()` in router finish event |
| Missing `disableWhileProcessing` on Form | `<Form disableWhileProcessing>` adds `inert` during submit |
| No form persistence key | `useForm('LoginForm', { ... })` persists across navigations |
| Using `router.cancel()` (v2) | `router.cancelAll()` (v3) |
| `import axios from 'axios'` | `useHttp()` hook or install axios separately |
| `Inertia::lazy(fn)` | `Inertia::optional(fn)` (lazy/LazyProp removed) |
| `<head inertia>` in Blade | `<head data-inertia>` (v3 attribute rename) |
| `require()` for Inertia packages | ESM `import` only (v3 is ESM-only) |
