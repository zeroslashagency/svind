# Spec — Homepage-Only Prune

**Source:** `plans/svind-homepage-preserve/plan.md` (Markdown-only, homepage frozen)
**Date:** 2026-08-11
**Approved:** yes (user: /agent-team-orchestration yes)

## Goal
Keep `index.html` byte-identical. Delete every other page/section in the codebase. Deploy as homepage-only site.

## Frozen (read-only)
- `index.html` (53,003 bytes, 13 sections, fc5ecfd)
- `assets/css/tokens.css`, `base.css`, `components.css`, `core.css`, `hro.css`, `abt.css`, `foc.css`, `arz.css`, `mpz.css`, `exp.css`, `value-prop.css`
- `assets/js/site.js`
- `assets/img/bands/*`, `cards/*`, `cutouts/*`, `hero/*`, `logos/*`, `people/*`

## Delete
- `products/eot-cranes/index.html`, `products/eot-cranes/double-girder.html`, `products/gantry-cranes/index.html`, `products/hoists/index.html`, `products/jib-cranes/index.html`, `products/spare-parts/index.html`
- `pages/company/about.html`, `pages/company/contact.html`, `pages/resources/downloads.html`, `pages/resources/resources.html`, `pages/services/request-a-quote.html`, `pages/services/services.html`
- `locations/bangalore.html`
- `reference/fulloptioncraft-sections.html`
- `testing/resources-concepts/**`
- Trim `.htaccess` (remove 10 product/location rules, keep generic fallback)
- Replace `sitemap.xml` (11 locs → 1 loc for `/`)
- Archive `LINK_INVENTORY.md` → `shared/artifacts/` (audit of deleted pages)

## Internal links
Homepage hrefs to `/products/*`, `/industries`, `/services`, `/resources`, `/about` etc. are left as-is (Option A: 301 → / via .htaccess catch-all) — no `index.html` edit.

## Verification gates
1. `sha256sum -c plans/svind-homepage-preserve/fingerprints.txt` identical
2. `find . -name "*.html" | wc -l` == 1 (only index.html)
3. `curl -I https://www.svind.co.in/` → 200, canonical unchanged
4. `sitemap.xml` has exactly 1 `<loc>`
5. LINK_INVENTORY broken count on / does not increase (all now 301 → /)
