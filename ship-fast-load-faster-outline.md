# Ship Fast, Load Faster

**LaraconAU 2026 · Day Zero · Afternoon Session (1:00 – 5:00 PM)**

**Total runtime: 4h 10min** (10 min buffer for setup hiccups)

---

## Marketing bullets (for the conference site)

### What prior knowledge will students need?

Working knowledge of Laravel — you've built apps with Eloquent, you know what a migration is, and you've deployed something to production at least once. The workshop is aimed at mid-to-senior developers, but motivated learners with solid Laravel fundamentals will get a lot out of it too.

You'll need PHP 8.4 or 8.5 installed locally. Examples will assume you're running the app with `php artisan serve` and `npm run dev`, using SQLite for both the database and cache to keep setup friction low. If you prefer Herd, Sail, or another local setup, you're welcome to use it — just be ready to adapt on the fly. No prior experience with Octane or AI SDKs is required; we'll cover them from the ground up.

### What trade-offs, edge cases, or difficult decisions will you explore?

Performance work is full of "it depends" moments, and we'll work through them honestly. When does caching cost you more than it saves? How do you invalidate without writing a brittle web of observers? When is Octane the right tool versus a footgun waiting to leak memory? We'll also wrestle with the tension between premature optimization and shipping — knowing when to reach for these patterns and when to leave well enough alone.

### Is this based on a real production system?

Yes. The patterns in this workshop come from real Laravel applications running at scale — including systems I've worked on at Laravel and previously in regulated financial services, where slow queries and missed cache invalidations have real consequences. The starter app is a deliberately unoptimized e-commerce dashboard, but every bottleneck we fix and every pattern we apply is one I've seen (or written, or had to debug at 2am) in production. The AI integration reflects what teams are actually building right now with Laravel's new AI SDK — and the cost and latency challenges that come with it.

### What will attendees understand differently after the workshop?

You'll leave knowing how to *diagnose* performance problems instead of guessing at them — reading EXPLAIN output, spotting N+1s, and recognizing whether a slow page is a query, cache, or architecture problem. You'll have hands-on experience with the full Laravel performance stack — query optimization, smart caching with proper invalidation, queues, and Octane — plus a working AI agent built with the Laravel AI SDK and the patterns to keep it fast and affordable. You'll walk away with a starter repo, a checklist of patterns, and the judgment to know when to apply them.

---

## Act 1 — Diagnose (45 min)

**Goal:** Attendees understand how to *find* performance problems before trying to fix them.

### 1.1 — Welcome & the slow app (15 min)

- Quick intro, workshop arc, what to expect
- Everyone clones the starter repo (already pre-cloned per setup guide, but we verify)
- Run migrations + seeders (100k+ rows pre-baked into seeders for speed)
- Boot the app: `php artisan serve` + `npm run dev`
- Hit the dashboard. Feel the 4-6 second loads. Audible groans = success.
- **Banter moment:** "If you've ever inherited an app that felt like this, raise your hand."

### 1.2 — The profiling toolkit (20 min)

- **Laravel Debugbar tour** — query count, duplicate queries, timing
- **Telescope tour** — slow queries panel, dashboard view
- **EXPLAIN ANALYZE** in SQLite — yes, it works, and it's revelatory
- **`DB::listen()`** for one-off query logging in custom contexts

### 1.3 — Diagnostic exercise (10 min)

- Hands-on: attendees identify the top 3 slow endpoints using Debugbar
- Document findings in a shared format (we provide a template)
- Quick group discussion: "What did you find?"

**Act 1 outcome:** Everyone knows *where* the problems are. No fixing yet.

---

## Act 2 — Optimize (75 min)

**Goal:** Apply the three foundational layers — queries, caches, queues — and benchmark gains at each step.

### 2.1 — Query layer (25 min)

- The N+1 problem (live demo with the dashboard)
- Eager loading patterns: `with()`, `withCount()`, `withSum()`, `withAvg()`
- Subquery selects for "latest order" / "most recent" patterns
- Indexes that matter: where to add them, how to verify they're used
- **Hands-on:** fix the dashboard's product list and order summary
- **Checkpoint benchmark:** measure response time after query fixes

### 2.2 — Cache layer (30 min)

- `Cache::remember()` fundamentals
- SQLite cache driver — yes, it's faster than you think
- Cache tags vs key prefixes (and why tags don't work everywhere)
- Cache invalidation via model observers
- **Hands-on:** cache the dashboard aggregates with proper invalidation
- **The "what about Redis?" sidebar (5 min):** when SQLite is fine, when you need Redis/Valkey, the rough perf delta
- **Checkpoint benchmark**

### 2.3 — Async layer (20 min)

- The "this doesn't need to happen now" mindset
- Queued jobs for report generation, email, analytics rollups
- Queue drivers: SQLite again is your friend here
- **Hands-on:** move the analytics rollup off the request thread into a job
- **Checkpoint benchmark**

**Act 2 outcome:** Dashboard goes from 4-6s to ~200-400ms. Real, measurable wins.

### Break (15 min)

---

## Act 3 — Scale (30 min)

**Goal:** Move beyond foundational patterns into territory that handles real production traffic.

### 3.1 — Stampede protection & locks (15 min)

- The thundering herd problem (live demo: hammer the cached endpoint right after invalidation)
- `Cache::lock()` for atomic operations
- `Cache::flexible()` for stale-while-revalidate
- **Hands-on:** wrap one expensive cached query with stampede protection
- **Quick aside:** this matters even more under Octane (foreshadowing)

### 3.2 — Lazy collections & memory (5 min)

- Brief tour of `LazyCollection` for large dataset processing
- Real-world case: exports, imports, batch jobs
- "Now you know this exists" — no exercise

### 3.3 — Octane: a glimpse of what's next (10 min, show-and-tell)

- The persistent worker model — what changes when your app stays in memory between requests
- Octane's value prop: boot once, serve fast
- **Live demo:** boot the app on Octane, show the same dashboard at Octane speed
- The state-leak gotcha (singletons, static state) — show one, fix one
- "Try this on your own after the workshop — here's the setup guide"

**Act 3 outcome:** Foundational scale patterns in hand, plus a taste of where the production deployment story goes.

### Break (10 min)

---

## Act 4 — Intelligence (65 min)

**Goal:** Build a working AI agent on top of the optimized app, then apply the same performance patterns to AI workloads.

### 4.1 — The Laravel AI SDK (15 min)

- Install + configure (API keys handed out — destroyed after the session)
- Anatomy of an agent: prompts, tools, structured output, streaming
- Quick architectural overview: how it fits into a Laravel app
- **Hands-on:** scaffold a `ProductAdvisor` agent with `php artisan make:agent`

### 4.2 — Tools & structured output (20 min)

- Build a `SearchProducts` tool that queries the (now fast) catalog
- Define a structured response schema — recommendations, confidence score, reasoning
- Why structured output beats parsing free text
- **Hands-on:** wire up the tool, ask the agent natural-language questions
- Live discussion: the agent is *using* our cached queries — performance gains compound

### 4.3 — Performance patterns for AI (20 min)

- Where to cache — three layers:
  1. Full agent responses (safe when?)
  2. Tool call results (almost always safe)
  3. Embeddings if we use them (the cheap layer to cache)
- Stale-while-revalidate for AI: when "slightly old" is fine
- Queueing agent work — long-running deep analysis as a job
- The cost dimension: tokens × requests, why caching is a budget tool not just a speed tool
- **Hands-on:** cache the tool calls, queue a "deep analysis" agent run

### 4.4 — Final benchmark & "the journey" (10 min)

- Original dashboard: 4-6s, hundreds of queries
- Final dashboard: <100ms, cached, with a working AI agent
- API cost projection: 1k requests/day with vs without caching strategies
- The full journey on one screen — visual recap of what we built

---

## Wrap-up & Q&A (10 min)

- Cheat sheet (one-page PDF) handed out
- Starter repo + final repo links
- "What I'd do next" suggestions by experience level
- Open Q&A

---

## Time accounting

| Segment | Duration |
|---|---|
| Act 1 — Diagnose | 45 min |
| Act 2 — Optimize | 75 min |
| Break | 15 min |
| Act 3 — Scale | 30 min |
| Break | 10 min |
| Act 4 — Intelligence | 65 min |
| Wrap-up & Q&A | 10 min |
| **Total** | **4h 10min** |

---

## Open questions / next steps

- Define the starter app concept (models, features, intentional bottlenecks)
- Build prompts for scaffolding the starter repo
- Build prompts for generating per-segment exercise instructions
- Build the cheat sheet (one-page PDF)
- Pre-workshop setup guide (sent ~1 week before)
- Decide on revenue-share approach with Laravel before replying to Michael
- Confirm TA / helper support for the workshop given 30-70 attendee size
