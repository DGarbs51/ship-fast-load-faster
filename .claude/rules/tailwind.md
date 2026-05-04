---
paths: "**/*.{css,scss,vue,tsx,jsx}"
---

# Tailwind CSS v4 Rules

### Core Changes from v3
- **CSS-first config** — no `tailwind.config.js` by default
- **Single import** — `@import "tailwindcss"` replaces `@tailwind base/components/utilities`
- **Auto content detection** — no `content` array needed
- **Built-in Lightning CSS** — no `autoprefixer` or `postcss-import` needed
- **5x faster builds**, 100x+ faster incremental

### Setup

**Vite**: `import tailwindcss from "@tailwindcss/vite"; export default { plugins: [tailwindcss()] }`

**PostCSS**: `export default { plugins: { "@tailwindcss/postcss": {} } }`

**CSS**: `@import "tailwindcss"`

### \@theme Directive

All customization in CSS via `@theme`. Variables auto-generate utilities:

```css
@theme {
  --color-brand: #3b82f6;        /* → bg-brand, text-brand */
  --font-display: "Inter";       /* → font-display */
  --spacing-18: 4.5rem;          /* → p-18, m-18, gap-18 */
  --breakpoint-3xl: 1920px;      /* → 3xl:flex */
  --radius-pill: 9999px;         /* → rounded-pill */
  --animate-fade-in: fade-in 0.3s ease-out;
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
}
```

**Override defaults**: `--color-*: initial;`. **Reference vars**: `@theme inline` (no :root variable)

### Directives Quick Reference

| Directive | Purpose |
|-----------|---------|
| `@import "tailwindcss"` | Load Tailwind |
| `@theme { }` | Define theme variables |
| `@config "./file.js"` | Load JS config (migration) |
| `@source "../path"` / `not` | Add/exclude content paths |
| `@plugin "@tailwindcss/forms"` | Load plugins |
| `@utility name { }` | Custom utility with variants |
| `@variant dark { }` | Apply variant in CSS |
| `@custom-variant name (selector)` | Define custom variant |
| `@reference "../app.css"` | Reference in scoped styles |

### Custom Utilities

**MUST use `@utility` for variant support** (not `@layer utilities`):
```css
@utility content-auto { content-visibility: auto; }  /* Works with hover:, dark:, lg: */

@utility tab-* {  /* Functional utilities */
  tab-size: --value(--tab-size-*, integer);  /* → tab-2, tab-4, tab-[8] */
}
```

### Layers

Order: `theme → base → components → utilities`

```css
@layer components {
  .card { background: var(--color-white); border-radius: var(--radius-lg); padding: var(--spacing-6); }
}
```

### Breaking Syntax Changes

**Important modifier position**: `!flex` → `flex!` (trailing, not leading)

**Variant stacking order reversed** (left-to-right in v4):
- v3: `first:*:pt-0` → v4: `*:first:pt-0`

**CSS variable syntax**: `bg-[--brand-color]` → `bg-(--brand-color)`

### Renamed Utilities (v3 → v4)

| v3 | v4 |
|----|-----|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `drop-shadow-sm` | `drop-shadow-xs` |
| `drop-shadow` | `drop-shadow-sm` |
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `backdrop-blur-sm` | `backdrop-blur-xs` |
| `backdrop-blur` | `backdrop-blur-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `outline-none` | `outline-hidden` |
| `ring` | `ring-3` (default now 1px) |
| `bg-gradient-to-r` | `bg-linear-to-r` |
| `bg-opacity-50` | `bg-black/50` |
| `border` (gray default) | `border border-gray-200` (now currentColor) |

### Gradients

```html
<!-- Linear with angle -->
<div class="bg-linear-45 from-indigo-500 via-purple-500 to-pink-500"></div>
<!-- Interpolation modifier (oklch for perceptually uniform) -->
<div class="bg-linear-to-r/oklch from-indigo-500 to-teal-400"></div>
<!-- Conic -->
<div class="bg-conic from-red-600 to-red-600"></div>
<!-- Radial -->
<div class="bg-radial-[at_25%_25%] from-white to-zinc-900"></div>
```

### Container Queries (Built-in)

```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-3 @lg:grid-cols-4"></div>
</div>
<!-- Max-width container queries -->
<div class="@container">
  <div class="grid grid-cols-3 @max-md:grid-cols-1"></div>
</div>
```

### @source Directive

```css
@import "tailwindcss";
@source "../node_modules/@my-company/ui-lib";   /* Include path not auto-detected */
@source not "./src/components/legacy";           /* Exclude a path */
@source inline("underline");                     /* Safelist specific utilities */
```

### New Utilities

- **3D transforms**: `rotate-x-*`, `rotate-y-*`, `perspective-*`, `transform-3d`
- **Shadows**: `inset-shadow-*`, `inset-ring-*` (composable, stack up to 4 layers)
- **Field sizing**: `field-sizing-content` (auto-resize textarea without JS)
- **Color scheme**: `scheme-light`, `scheme-dark`

### v4.1 Utilities

- **Text shadows**: `text-shadow-lg`, `text-shadow-2xs text-shadow-sky-300`
- **Masks**: `mask-b-from-50% bg-[url(/img/photo.jpg)]`
- **Overflow wrap**: `wrap-break-word`, `wrap-anywhere` (flex-aware)
- **Safe alignment**: `justify-center-safe` (prevents overflow clipping)

### v4.1 Variants

| Variant | Use |
|---------|-----|
| `user-valid` | `user-valid:border-green-500` (after interaction) |
| `user-invalid` | `user-invalid:border-red-500` (after interaction) |
| `noscript` | `hidden noscript:block` |
| `details-content` | `details-content:mt-3` |

### New Variants

| Variant | Use |
|---------|-----|
| `not-*` | `not-hover:opacity-75` |
| `in-*` | Like group-* without class |
| `nth-*` | `nth-3:bg-red-500` |
| `starting` | `starting:open:opacity-0` |
| `inert` | `inert:opacity-50` |
| `**` | Descendant: `**:text-red-500` |

**Stacked variants**: Order changed to left-to-right: `*:first:pt-0` (v4) vs `first:*:pt-0` (v3)

### Dark Mode

**System preference**: Works by default, just use `dark:`

**Class-based**: `@custom-variant dark (&:where(.dark, .dark *))`

**Data attribute**: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`

### Migration Checklist

Run `npx @tailwindcss/upgrade`, then verify:

1. `@tailwind` → `@import "tailwindcss"`, renamed utils (shadow/rounded/blur/ring)
2. `bg-opacity-*` → `bg-color/opacity`, CSS vars `[--var]` → `(--var)`
3. Reverse stacked variants, explicit `border-gray-200`, `ring` → `ring-3`
4. Remove autoprefixer/postcss-import, `tailwindcss` → `@tailwindcss/postcss`
5. Convert `tailwind.config.js` to `@theme`

### Styling Preference Order

1. **Theme utilities** over arbitrary: `text-secondary` vs `text-[var(--color-text-secondary)]`
2. **Arbitrary values** over style attr: `text-[#123456]` vs `style="color: #123456"`

### Common Mistakes

| Mistake | Fix |
|---------|-----|
| `@layer utilities` for custom | `@utility name { }` |
| `tailwindcss` as PostCSS plugin | `@tailwindcss/postcss` |
| Creating `tailwind.config.js` | Use `@theme` in CSS |
| `bg-opacity-50` | `bg-black/50` |
| `bg-[--var]` | `bg-(--var)` |
| Adding autoprefixer | Built-in, remove it |
| `@tailwind base` | `@import "tailwindcss"` |
| `text-[var(--color-text-secondary)]` | `text-secondary` |
| `!flex` (leading bang) | `flex!` (trailing bang) |
| `first:*:pt-0` (v3 stacking) | `*:first:pt-0` (v4 left-to-right) |
| `shadow-sm` (expecting v3 size) | `shadow-xs` (scale shifted down) |
| `rounded` (expecting v3 size) | `rounded-sm` (scale shifted down) |
