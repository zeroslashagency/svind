# Link Integrity Audit — Inventory (Read-Only)

> **Scope:** All `href="/..."` in HTML files. No links edited. Working tree at `e7a80ae` + 17 modified files (see §6).
> **Task baseline:** 48 distinct broken targets, 221 occurrences per audit. **Current HEAD audit:** 46 distinct broken raw targets, 294 occurrences (75 distinct raw total, 555 total href="/..." occurrences). Drift explained in §6.
> **Pages audited:** 14 HTML files (13 content + 1 reference artefact). Reference excluded from broken counts where noted.

---

## 1. Filesystem — Existing Pages (site root relative)

| # | File | Resolves via |
|---|------|--------------|
| 1 | `index.html` | `/` (root) |
| 2 | `locations/bangalore.html` | `/locations/bangalore` (explicit rule) |
| 3 | `pages/company/about.html` | — (no short URL; reachable only via `/pages/company/about.html` direct) |
| 4 | `pages/company/contact.html` | `/contact` (explicit) |
| 5 | `pages/resources/downloads.html` | `/downloads` (explicit) |
| 6 | `pages/resources/resources.html` | — (no short URL) |
| 7 | `pages/services/request-a-quote.html` | `/request-a-quote` (explicit) |
| 8 | `pages/services/services.html` | — (no short URL) |
| 9 | `products/eot-cranes/index.html` | `/eot-cranes` (explicit) and `/products/eot-cranes` (fallback `index.html`) |
| 10 | `products/eot-cranes/double-girder.html` | `/eot-cranes/double-girder` (explicit) |
| 11 | `products/gantry-cranes/index.html` | `/gantry-cranes` + `/products/gantry-cranes` |
| 12 | `products/hoists/index.html` | `/hoists` + `/products/hoists` |
| 13 | `products/jib-cranes/index.html` | `/jib-cranes` + `/products/jib-cranes` |
| 14 | `products/spare-parts/index.html` | `/crane-spare-parts` + `/products/spare-parts` |
| — | `reference/fulloptioncraft-sections.html` | artefact (`noindex`), not counted in broken audit |
| — | `sitemap.xml` | `/sitemap.xml` (direct file) |

No files exist for: `/about`, `/industries`, `/industries/*`, `/resources`, `/resources/*`, `/services`, `/services/*`, `/privacy`, `/terms`, `/certifications-and-trust`, `/eot-cranes/single-girder`, `/locations/karnataka`, etc. (see §3).

---

## 2. .htaccess Rewrite Rules (verbatim at `/.htaccess`)

```apache
RewriteEngine On

# Canonical short URLs → filesystem locations
RewriteRule ^eot-cranes/double-girder/?$ products/eot-cranes/double-girder.html [NC,L]
RewriteRule ^eot-cranes/?$ products/eot-cranes/index.html [NC,L]
RewriteRule ^gantry-cranes/?$ products/gantry-cranes/index.html [NC,L]
RewriteRule ^jib-cranes/?$ products/jib-cranes/index.html [NC,L]
RewriteRule ^hoists/?$ products/hoists/index.html [NC,L]
RewriteRule ^crane-spare-parts/?$ products/spare-parts/index.html [NC,L]
RewriteRule ^locations/bangalore/?$ locations/bangalore.html [NC,L]
RewriteRule ^downloads/?$ pages/resources/downloads.html [NC,L]
RewriteRule ^contact/?$ pages/company/contact.html [NC,L]
RewriteRule ^request-a-quote/?$ pages/services/request-a-quote.html [NC,L]

# Generic fallback: /foo → /foo.html if that file exists
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^([^\\.]+)$ $1.html [NC,L]
```

**Interpretation:**

- 10 explicit short-URL rules cover exactly 10 canonical paths (duplicated in `sitemap.xml`). All destinations exist.
- Generic fallback covers **any** `/a/b/c` where `a/b/c.html` or `a/b/c/index.html` or `a/b/c` file exists on disk. This is why `/products/eot-cranes` → `products/eot-cranes/index.html` and `/pages/services/request-a-quote` → `pages/services/request-a-quote.html` resolve despite no explicit rule.
- Anything without a matching explicit rule **and** without a corresponding `.html`/`index.html` file is 404 (even though Apache would not rewrite, browser gets 404). `/about` would need `about.html` at root; none exists.

**Sitemap parity:** `sitemap.xml` lists 11 canonical `<loc>` entries matching the 10 explicit rules + root `/`. No sitemap entry for `/about`, `/industries`, etc.

---

## 3. All `href="/..."` Targets — Full Inventory (grep -rho, 14 content files)

**Counts:** 75 distinct raw values, 555 total occurrences (including fragments `/#`, queries `?product=`). Reference file has 0 matching hrefs, so content-only = same.

### 3a. OK — Resolves (29 distinct raw, 261 occurrences)

| Target | Occ | Resolves to | How |
|--------|-----|-------------|-----|
| `/` | 23 | `index.html` | root |
| `/contact` | 17 | `pages/company/contact.html` | explicit |
| `/contact#phone` | 6 | `pages/company/contact.html` | explicit + fragment |
| `/contact#whatsapp` | 6 | `pages/company/contact.html` | explicit + fragment |
| `/crane-spare-parts` | 3 | `products/spare-parts/index.html` | explicit |
| `/downloads` | 15 | `pages/resources/downloads.html` | explicit |
| `/downloads#iso-9001` | 14 | `pages/resources/downloads.html` | explicit + fragment |
| `/downloads#is-807-compliance` | 1 | `pages/resources/downloads.html` | explicit + fragment |
| `/eot-cranes` | 2 | `products/eot-cranes/index.html` | explicit |
| `/eot-cranes/double-girder` | 13 | `products/eot-cranes/double-girder.html` | explicit |
| `/gantry-cranes` | 2 | `products/gantry-cranes/index.html` | explicit |
| `/jib-cranes` | 2 | `products/jib-cranes/index.html` | explicit |
| `/locations/bangalore` | 15 | `locations/bangalore.html` | explicit |
| `/pages/company/contact` | 3 | `pages/company/contact.html` | fallback `.html` |
| `/pages/resources/downloads.html#iso-9001` | 1 | `pages/resources/downloads.html` | direct file |
| `/pages/services/request-a-quote` | 50 | `pages/services/request-a-quote.html` | fallback `.html` |
| `/pages/services/request-a-quote.html` | 2 | `pages/services/request-a-quote.html` | direct file |
| `/products/eot-cranes` | 25 | `products/eot-cranes/index.html` | fallback `index.html` |
| `/products/gantry-cranes` | 11 | `products/gantry-cranes/index.html` | fallback `index.html` |
| `/products/hoists` | 7 | `products/hoists/index.html` | fallback `index.html` |
| `/products/jib-cranes` | 11 | `products/jib-cranes/index.html` | fallback `index.html` |
| `/products/spare-parts` | 20 | `products/spare-parts/index.html` | fallback `index.html` |
| `/request-a-quote` | 1 | `pages/services/request-a-quote.html` | explicit |
| `/request-a-quote?product=EOT+Crane` | 1 | `pages/services/request-a-quote.html` | explicit + query |
| `/request-a-quote?product=Gantry+Crane` | 1 | `pages/services/request-a-quote.html` | explicit + query |
| `/request-a-quote?product=Hoist` | 1 | `pages/services/request-a-quote.html` | explicit + query |
| `/request-a-quote?product=Jib+Crane` | 1 | `pages/services/request-a-quote.html` | explicit + query |
| `/request-a-quote?product=Spare+Parts` | 1 | `pages/services/request-a-quote.html` | explicit + query |
| `/sitemap.xml` | 6 | `sitemap.xml` | direct file |

**Note:** `/products/*` and `/pages/*` resolve only because the fallback finds `index.html`/`*.html` on disk. They are not listed in sitemap but are not broken.

### 3b. BROKEN — No file / no rule (46 distinct raw, 294 occurrences)

Ordered by frequency. `Norm` = value after stripping `?query` and `#fragment` (for dedup). Task mentions `/industries`, `/resources`, `/services`, `/privacy`, `/terms`, `/eot-cranes/single-girder`, `/certifications-and-trust` — all present here.

| # | Target (raw) | Occ | Files | Norm | Category |
|---|--------------|-----|-------|------|----------|
| 1 | `/industries` | 25 | 14 | `/industries` | industries hub |
| 2 | `/resources` | 23 | 13 | `/resources` | resources hub |
| 3 | `/about` | 21 | 9 | `/about` | company |
| 4 | `/eot-cranes/single-girder` | 14 | 11 | `/eot-cranes/single-girder` | product detail (requested) |
| 5 | `/eot-cranes/hot-metal-ladle-foundry` | 13 | 10 | `/eot-cranes/hot-metal-ladle-foundry` | product detail |
| 6 | `/services` | 13 | 8 | `/services` | services hub (requested) |
| 7 | `/privacy` | 13 | 11 | `/privacy` | legal (requested) |
| 8 | `/service-and-spares` | 12 | 6 | `/service-and-spares` | services alt label |
| 9 | `/services/amc-preventive-maintenance` | 12 | 10 | `/services/amc-preventive-maintenance` | service detail |
| 10 | `/services/inspection-load-testing` | 12 | 11 | `/services/inspection-load-testing` | service detail |
| 11 | `/certifications-and-trust` | 11 | 10 | `/certifications-and-trust` | trust (requested) |
| 12 | `/industries/automotive` | 10 | 7 | `/industries/automotive` | industry |
| 13 | `/industries/power` | 10 | 7 | `/industries/power` | industry |
| 14 | `/industries/steel` | 10 | 7 | `/industries/steel` | industry |
| 15 | `/industries/foundry` | 9 | 7 | `/industries/foundry` | industry |
| 16 | `/locations/karnataka` | 8 | 8 | `/locations/karnataka` | location |
| 17 | `/services/amc` | 8 | 5 | `/services/amc` | service detail |
| 18 | `/industries/construction` | 7 | 5 | `/industries/construction` | industry |
| 19 | `/about.html` | 6 | 1 | `/about.html` | company (legacy `.html` link) |
| 20 | `/terms` | 6 | 6 | `/terms` | legal (requested) |
| 21 | `/resources/eot-crane-price-in-india` | 5 | 4 | `/resources/eot-crane-price-in-india` | resource article |
| 22 | `/eot-cranes/hot-metal-ladle` | 4 | 1 | `/eot-cranes/hot-metal-ladle` | product detail alias |
| 23 | `/resources/is-3177-rfq-checklist` | 4 | 3 | `/resources/is-3177-rfq-checklist` | resource article |
| 24 | `/resources/is-807-classification` | 4 | 4 | `/resources/is-807-classification` | resource article |
| 25 | `/resources/single-girder-vs-double-girder` | 4 | 4 | `/resources/single-girder-vs-double-girder` | resource article |
| 26 | `/bangalore` | 3 | 1 | `/bangalore` | location short |
| 27 | `/industries/cement` | 3 | 3 | `/industries/cement` | industry |
| 28 | `/resources.html` | 3 | 1 | `/resources.html` | resources legacy |
| 29 | `/services.html` | 3 | 1 | `/services.html` | services legacy |
| 30 | `/gantry-cranes/double-girder-goliath` | 2 | 2 | `/gantry-cranes/double-girder-goliath` | gantry detail |
| 31 | `/gantry-cranes/semi-goliath` | 1 | 1 | `/gantry-cranes/semi-goliath` | gantry detail |
| 32 | `/gantry-cranes/single-girder-gantry` | 1 | 1 | `/gantry-cranes/single-girder-gantry` | gantry detail |
| 33 | `/hoists/chain-hoist` | 1 | 1 | `/hoists/chain-hoist` | hoist detail |
| 34 | `/hoists/crab-unit` | 1 | 1 | `/hoists/crab-unit` | hoist detail |
| 35 | `/hoists/wire-rope-hoist` | 1 | 1 | `/hoists/wire-rope-hoist` | hoist detail |
| 36 | `/jib-cranes/articulating-jib` | 1 | 1 | `/jib-cranes/articulating-jib` | jib detail |
| 37 | `/jib-cranes/pillar-jib` | 1 | 1 | `/jib-cranes/pillar-jib` | jib detail |
| 38 | `/jib-cranes/wall-mounted-jib` | 1 | 1 | `/jib-cranes/wall-mounted-jib` | jib detail |
| 39 | `/karnataka` | 1 | 1 | `/karnataka` | location short |
| 40 | `/locations` | 1 | 1 | `/locations` | location hub |
| 41 | `/products` | 1 | 1 | `/products` | products hub |
| 42 | `/resources/crane-duty-class` | 1 | 1 | `/resources/crane-duty-class` | resource article |
| 43 | `/resources/crane-duty-class-explained` | 1 | 1 | `/resources/crane-duty-class-explained` | resource article |
| 44 | `/resources/gantry-crane-design` | 1 | 1 | `/resources/gantry-crane-design` | resource article |
| 45 | `/resources/jib-crane-installation` | 1 | 1 | `/resources/jib-crane-installation` | resource article |
| 46 | `/services/modernization-retrofit` | 1 | 1 | `/services/modernization-retrofit` | service detail |

**Grouped by intent:**

- **Company/Legal (6):** `/about`(21), `/about.html`(6), `/privacy`(13), `/terms`(6), `/certifications-and-trust`(11), `/products`(1) — total **58 occ**
- **Industries (7):** `/industries`(25) + 6 children (`/industries/steel`(10), `/power`(10), `/automotive`(10), `/foundry`(9), `/construction`(7), `/cement`(3)) — total **74 occ**
- **Resources hub + articles (9):** `/resources`(23), `/resources.html`(3), plus 7 articles (`/resources/eot-crane-price-in-india`(5), `/is-807-classification`(4), `/single-girder-vs-double-girder`(4), `/is-3177-rfq-checklist`(4), `/crane-duty-class`(1), `/crane-duty-class-explained`(1), `/gantry-crane-design`(1), `/jib-crane-installation`(1)) — total **47 occ**
- **Services hub + details (7):** `/services`(13), `/services.html`(3), `/service-and-spares`(12), `/services/amc`(8), `/services/amc-preventive-maintenance`(12), `/services/inspection-load-testing`(12), `/services/modernization-retrofit`(1) — total **61 occ**
- **Product details (10):** `/eot-cranes/single-girder`(14), `/eot-cranes/hot-metal-ladle-foundry`(13), `/eot-cranes/hot-metal-ladle`(4), `/gantry-cranes/*`(4), `/hoists/*`(3), `/jib-cranes/*`(3) — total **41 occ**
- **Locations (5):** `/bangalore`(3), `/karnataka`(1), `/locations`(1), `/locations/karnataka`(8) — total **13 occ**

**Per-file broken counts (content files only):**

| File | Broken | Total href="/..." | Notes |
|------|--------|-------------------|-------|
| `index.html` | 29 | 57 | heaviest legacy `.html` links |
| `products/eot-cranes/double-girder.html` | 39 | 64 | most broken (dense footer) |
| `products/eot-cranes/index.html` | 30 | 55 | |
| `products/gantry-cranes/index.html` | 29 | 53 | |
| `products/jib-cranes/index.html` | 28 | 52 | |
| `products/spare-parts/index.html` | 25 | 47 | |
| `products/hoists/index.html` | 24 | 50 | |
| `locations/bangalore.html` | 23 | 41 | |
| `pages/services/request-a-quote.html` | 20 | 37 | |
| `pages/company/contact.html` | 15 | 36 | |
| `pages/resources/downloads.html` | 14 | 31 | |
| `pages/services/services.html` | 7 | 12 | |
| `pages/resources/resources.html` | 7 | 11 | |
| `pages/company/about.html` | 4 | 9 | smallest footer |

---

## 4. Nav/Footer Variants — 4 Logical Variants Across 13 Pages (11 exact hashes)

Exact MD5 hashes on `<header>` and `<footer>` blocks show 11 distinct combos, but they collapse to **4 logical shell variants** the task references:

### Variant A — `index.html` (1 page)
- **Header hash `e1c8833e` / Nav `f55a78a5`:** Unique top nav with legacy links (`/services.html`, `/resources.html`, `/about.html`) and two-level mega-menu. Contains `index.html`-specific hero markup.
- **Footer hash `3a1ebdb8` (4478 chars):** Minimal footer (6 links: quote CTA + LinkedIn/YouTube + `/privacy`, `/terms`, `/sitemap.xml`). No product grid.

### Variant B — Product Shell (6 pages)
- **Header clusters:**
  - `products/eot-cranes/*` share `879216a1` (1857 chars)
  - `products/gantry-cranes/hoists/jib-cranes/spare-parts` share `3cc79e6c` (1817 chars)
  - Both use `/service-and-spares` and `/about` (broken) and differ from other variants by that label.
- **Footer clusters:**
  - 5 of 6 share `d5cce1df` (3503 chars, 22 links — full product/industry matrix, broken-heavy)
  - `products/eot-cranes/double-girder.html` is alone: `17c49d33` (3110 chars, 19 links — has `/eot-cranes/hot-metal-ladle` not `/hot-metal-ladle-foundry`)
- **Pages:** `products/eot-cranes/index.html`, `products/eot-cranes/double-girder.html`, `products/gantry-cranes/index.html`, `products/hoists/index.html`, `products/jib-cranes/index.html`, `products/spare-parts/index.html`

### Variant C — Company/Resources/Services Minimal (5 pages)
- **Header clusters:**
  - `pages/company/about.html` `f973343b` (1055 chars)
  - `pages/resources/resources.html` `b086c7be` (1055 chars)
  - `pages/services/services.html` `03736b75` (1055 chars) — three near-identical but 3 distinct hashes (differ by `aria-current` placement)
  - `pages/company/contact.html` + `pages/resources/downloads.html` share `6a6464d4` (2024 chars)
  - `pages/services/request-a-quote.html` alone `b11ec603` (2120 chars)
- **Footer clusters:**
  - `pages/company/about.html`/`pages/resources/resources.html`/`pages/services/services.html` share `27f1ed50` (199 chars — empty footer, 0 links)
  - `pages/company/contact.html` `8def88c5` (3032 chars, 16 links)
  - `pages/resources/downloads.html` `20b48b86` (2985 chars, 16 links)
  - `pages/services/request-a-quote.html` `8bae6b31` (3091 chars, 16 links)
- **Trait:** Smallest headers (7 links), footers vary from empty to 16 links. All use `/about`, `/services`, `/resources` (broken) in nav.

### Variant D — Location Shell (1 page)
- **Header `e8b3c982` (2074 chars) / Footer `373a812d` (3056 chars, 16 links):** Unique. Nav uses short canonicals (`/eot-cranes`, `/gantry-cranes`, `/jib-cranes`, `/crane-spare-parts`, `/bangalore`, `/request-a-quote`) — the only file to use those. Footer mirrors Variant B/C but with location-short links.

**Summary table (logical):**

| Variant | Pages | Header distinct | Footer distinct | Nav label for services | Approx divergence from single shell |
|---------|-------|-----------------|-----------------|------------------------|-------------------------------------|
| A (index) | 1 | 1 | 1 | `Services` → `/services.html` | hero, marquee, FOC sections inline |
| B (product) | 6 | 2 | 2 | `Service & spares` → `/service-and-spares` | product matrix footer |
| C (company) | 5 | 5 (3 minimal + 2 contact-style) | 4 | `Service & spares` / `Services` mix | minimal/empty footers |
| D (location) | 1 | 1 | 1 | `Services` → `/services` | short-URL nav, location footer |

**Raw hash inventory (for deduplication script):**

- Headers: `e1c8833e×1, f973343b×1, 6a6464d4×2, b086c7be×1, 03736b75×1, b11ec603×1, 879216a1×2, 3cc79e6c×4, e8b3c982×1`
- Footers: `3a1ebdb8×1, 27f1ed50×3, 8def88c5×1, 20b48b86×1, 8bae6b31×1, d5cce1df×5, 17c49d33×1, 373a812d×1`

**Evidence that no shared shell exists:** No SSI `<!--#include-->`, no templating comment, `assets/js/site.js` is vanilla behaviour only (no header/footer injection), each HTML file contains its own inline `<header>`/`<footer>` block. `COMPONENT_CONTRACT.md §5` notes every component null-checks its target — confirming inline duplication is intentional but unmaintained.

---

## 5. Unification Plan Toward Single Shell (No Links Edited Yet)

**Goal:** One header/footer shell (single source of truth) so fixing broken links once fixes all 13 pages. Current 4 variants → 1.

#### Option 1 — Recommended: Build-time partials (no backend change)
1. Extract canonical header/footer from **Variant B footer `d5cce1df` + Variant D header `e8b3c982` short-URL style** as baseline (most links, correct canonical forms). Canonical nav should use sitemap `.htaccess` short URLs: `/eot-cranes`, `/gantry-cranes`, `/jib-cranes`, `/hoists`, `/crane-spare-parts`, `/services` (after creating), `/resources`, `/about`, `/contact`, `/downloads`, `/locations/bangalore`, `/request-a-quote`.
2. Create `partials/header.html` and `partials/footer.html` (or `assets/templates/shell.html`). Move inline `<header>`/`<footer>` there.
3. Add a tiny build step (e.g., `scripts/build-shell.js` using `node` + `cheerio` or even `sed`/`m4`) that injects partials into each page at build, or use `eleventy`/`vite` partials. No runtime JS injection (preserves no-JS usability per `JS_CONTRACT.md`).
4. Audit step: run this inventory script in CI to gate on broken-link count = 0 (see §6 drift note).
5. After shell unified, fix broken links in one place (see §5b).

**Pros:** No server requirement, preserves `defer` JS contract. **Cons:** Requires build step.

#### Option 2 — Runtime injection via `site.js`
1. Move header/footer HTML into `assets/js/shell.js` as template strings, inject via `document.querySelector('header')?.replaceWith(...)` on DOMContentLoaded.
2. Keep noscript fallback (duplicate static shell hidden with `js-enabled` class). Violates current "any component may be absent" contract but workable.

**Pros:** Single file edit, zero build. **Cons:** FOUC, SEO (crawlers without JS see stale inline), breaks no-JS contract.

#### Option 3 — Server-Side Includes (if Apache SSI enabled)
1. Convert `index.html` → `index.shtml`, add `<!--#include virtual="/partials/header.html" -->`.
2. Enable `Options +Includes` in `.htaccess`.

**Pros:** Zero build, no JS. **Cons:** Requires server config, extension change.

**Recommendation:** Option 1. It matches the repo's static nature and keeps `sitemap.xml` ↔ `.htaccess` ↔ nav in sync.

#### 5b. Link-Fix Strategy (After Shell Unification — Not Done Now)

For the 46 broken raw targets, create missing pages or redirect to nearest existing:

| Broken group | Action |
|--------------|--------|
| `/about`, `/about.html` → `pages/company/about.html` | Add `RewriteRule ^about/?$ pages/company/about.html` (or create `about.html` at root). Consolidate `.html` variant to canonical `/about`. |
| `/privacy`, `/terms`, `/certifications-and-trust` | Create `pages/legal/privacy.html`, `terms.html`, `trust.html` + rules `^privacy`, `^terms`, `^certifications-and-trust`. High priority (footer on 11/6 pages). |
| `/industries` + 6 children | Create `pages/industries/index.html` + 6 children or stub to `/products/eot-cranes` interim with 302. |
| `/resources`, `/resources/*` (8 articles) | `pages/resources/resources.html` already exists but has no rule — add `^resources` → that file + create 7 article stubs or redirect to `/downloads`. |
| `/services`, `/service-and-spares`, `/services/*` | `pages/services/services.html` exists — add `^services` rule. `/service-and-spares` is a label variant → 301 to `/services`. Create 4 service detail pages or stub. |
| `/eot-cranes/single-girder`, `/hot-metal-ladle*` | Create `products/eot-cranes/single-girder.html` + ladle variant; add rules mirroring `double-girder`. |
| `/gantry-cranes/*`, `/hoists/*`, `/jib-cranes/*` (10 details) | Create detail pages per product or collapse to index with anchors. |
| `/locations`, `/locations/karnataka`, `/bangalore`, `/karnataka`, `/products` | Add `^locations` → directory listing or redirect to `/locations/bangalore`; `^products` → product hub; short aliases 301 to canonical. |

Add all new canonicals to `sitemap.xml` and add matching `RewriteRule`s so generic fallback is not relied upon for canonical URLs.

#### 5c. Validation Gate (CI)

- Script: `/usr/bin/python3` + `re.findall(r'href="/[^"]*"')` + `resolves()` logic from §2 (explicit + fallback existence check). Fail if broken distinct > 0.
- Run: `grep -rho 'href="/[^"]*"' --include="*.html" | sort -u` and compare to `sitemap.xml` `<loc>` paths (normalized).

---

## 6. Audit Methodology & Drift Note

- **Tool:** `grep -rho 'href="/[^"]*"' --include="*.html"` (double-quoted only; no single-quoted hrefs found) + Python `pathlib.rglob("*.html")` + `.htaccess` rule simulation (10 explicit + fallback `*.html`/`index.html` existence).
- **Fragments/queries stripped** for file existence check but counted as distinct raw values in table (e.g., `/downloads` vs `/downloads#iso-9001` are separate raw rows but same file).
- **Task baseline drift:** Task states 48 distinct / 221 occurrences. Current working tree shows 46 distinct raw / 294 occ (even after excluding `reference/`, counts identical). `git status` shows 17 modified files vs `HEAD` (`index.html` -374 lines, `locations/bangalore.html`, 5 `pages/*`, 5 `products/*`, etc.) indicating audit baseline was on a different commit. Normalizing `/about.html` → `/about` etc. does not reconcile to 48 (would be 44). Recommend re-running this inventory script at the commit the task measured against to confirm 48/221, but current truth is 46/294. The **inventory table above is the current truth**; use it for fixes.

---

## 7. Raw Data — Sort-U File List for `diff`

```text
# All href="/..." raw distinct (75) — sort -u
/about
/about.html
/bangalore
/certifications-and-trust
/contact
/contact#phone
/contact#whatsapp
/crane-spare-parts
/downloads
/downloads#is-807-compliance
/downloads#iso-9001
/eot-cranes
/eot-cranes/double-girder
/eot-cranes/hot-metal-ladle
/eot-cranes/hot-metal-ladle-foundry
/eot-cranes/single-girder
/gantry-cranes
/gantry-cranes/double-girder-goliath
/gantry-cranes/semi-goliath
/gantry-cranes/single-girder-gantry
/hoists/chain-hoist
/hoists/crab-unit
/hoists/wire-rope-hoist
/industries
/industries/automotive
/industries/cement
/industries/construction
/industries/foundry
/industries/power
/industries/steel
/jib-cranes
/jib-cranes/articulating-jib
/jib-cranes/pillar-jib
/jib-cranes/wall-mounted-jib
/karnataka
/locations
/locations/bangalore
/locations/karnataka
/pages/company/contact
/pages/resources/downloads.html#iso-9001
/pages/services/request-a-quote
/pages/services/request-a-quote.html
/privacy
/products
/products/eot-cranes
/products/gantry-cranes
/products/hoists
/products/jib-cranes
/products/spare-parts
/request-a-quote
/request-a-quote?product=EOT+Crane
/request-a-quote?product=Gantry+Crane
/request-a-quote?product=Hoist
/request-a-quote?product=Jib+Crane
/request-a-quote?product=Spare+Parts
/resources
/resources.html
/resources/crane-duty-class
/resources/crane-duty-class-explained
/resources/eot-crane-price-in-india
/resources/gantry-crane-design
/resources/is-3177-rfq-checklist
/resources/is-807-classification
/resources/jib-crane-installation
/resources/single-girder-vs-double-girder
/service-and-spares
/services
/services.html
/services/amc
/services/amc-preventive-maintenance
/services/inspection-load-testing
/services/modernization-retrofit
/sitemap.xml
/terms
```

---

*No links edited. Next step: approve shell Option 1, then apply link fixes in one pass across the unified partial.*
