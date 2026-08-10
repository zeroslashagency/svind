# SVIND — Homepage-Only Prune — Keep `/` , Remove Everything Else

> **Goal:** Keep the existing homepage **exactly as-is**. Remove every other page/section that exists in the codebase today. Homepage is frozen — this plan **deletes around it**, never edits it.

**Frozen:** `index.html` + its CSS/JS/images (53,003 bytes, 13 sections, `fc5ecfd`) are **read-only**. No DOM, copy, token, or style edits. Deletion scope is everything *except* the homepage bundle.

---

## 1. What You Have Today vs. What You Keep

### Existing site — full tree (codebase)

```
index.html                          ← KEEP (frozen)
products/eot-cranes/index.html      ← REMOVE
products/eot-cranes/double-girder.html   ← REMOVE
products/gantry-cranes/index.html      ← REMOVE
products/hoists/index.html    ← REMOVE
products/jib-cranes/index.html         ← REMOVE
products/spare-parts/index.html      ← REMOVE
pages/company/about.html            ← REMOVE
pages/company/contact.html          ← REMOVE (keep CTA → /#rfq on homepage instead)
pages/resources/downloads.html      ← REMOVE
pages/resources/resources.html      ← REMOVE
pages/services/request-a-quote.html ← REMOVE (homepage RFQ section stays)
pages/services/services.html        ← REMOVE
locations/bangalore.html            ← REMOVE
reference/fulloptioncraft-sections.html ← REMOVE (artefact)
testing/resources-concepts/**       ← REMOVE (concepts, not prod)
sitemap.xml (11 locs)               ← TRIM to 1 loc (/)
.htaccess (10 rules)                ← TRIM to 0 product/location rules (keep generic fallback)
```

### What remains after prune — homepage-only site

```
index.html                          ✅ keeps 13 sections: hero → marquee → expertise → value-prop → range → deliver → in-service → proof → works → industries → local → RFQ → abt → CTA → FAQ → footer
assets/css/*                        ✅ keep only what index.html actually loads (10 files, see §2)
assets/js/site.js                   ✅ keep
assets/img/bands, cards, cutouts, hero, logos, people  ✅ keep
sitemap.xml                         → single <url><loc>https://www.svind.co.in/</loc></url>
.htaccess                           → only DirectoryIndex + generic fallback (no product rules)
```

No other HTML pages are reachable. Every old URL either 404s or 301s to `/` (your choice — see Open Questions).

---

## 2. Homepage Bundle — What It Actually Loads (Keep)

`index.html` loads only these — everything else in `assets/` can go if unused:

```html
<link rel="stylesheet" href="assets/css/tokens.css">
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/core.css">
<link rel="stylesheet" href="assets/css/foc.css">
<link rel="stylesheet" href="assets/css/abt.css">
<link rel="stylesheet" href="assets/css/arz.css">
<link rel="stylesheet" href="assets/css/mpz.css">
<link rel="stylesheet" href="assets/css/exp.css">
<link rel="stylesheet" href="assets/css/value-prop.css">
<link rel="stylesheet" href="assets/css/hro.css">
<!-- resources-bento.css is already not loaded (removed with section) -->
<script src="assets/js/site.js" defer></script>
<img src="assets/img/bands/hero-goliath-lifting-load.jpg">
<img src="assets/img/cards/*">  ×6
<img src="assets/img/cutouts/cutout-crab-unit.png">
<img src="assets/img/logos/*"> ×6
<img src="assets/img/people/group.png">
```

**Keep all 10 CSS + site.js + those images.** Remove `resources-bento.css`, `vmc.css` if present, and any unused `assets/img/untitled folder/`.

---

## 3. Old Site Tree — For Reference (Not Kept)

You asked for this — this is the **old `http://svind.co.in` tree** (2016 template, not your current codebase). It is **not** merged into your homepage; listed only so 301 decisions are explicit:

```
old / → Slider + Jib/Monorail/Floor tiles + Welcome/Team/Why Us
old /industrial.html → Gantry / Double EOT / Single EOT / HOT / Floor / Monorail (monotube) / Jib
old /crane.html → Crab Units + Spares
old /maintenance.html, /rental.html, /fab.html, /inhouse.html (Bay 1/2/3), /customer.html → LISTOFCUSTOMERS2.pdf, /contact.html
```

All old URLs will 301 to `/` or 410 — they never create new pages in the homepage-only site.

---

## 4. Plan — Delete Around the Frozen Homepage (No Subtraction on `/`)

### Phase 1 — Freeze & Backup (5 min)

```bash
sha256sum index.html assets/css/tokens.css assets/css/base.css assets/css/components.css assets/css/core.css assets/css/hro.css assets/css/abt.css assets/css/foc.css assets/css/arz.css assets/css/mpz.css assets/css/exp.css assets/css/value-prop.css assets/js/site.js > plans/svind-homepage-preserve/fingerprints.txt
git tag homepage-frozen-$(date +%Y%m%d)   # rollback point
git diff --stat  # must be 0 on frozen set
```

### Phase 2 — Delete Non-Homepage Pages (10 min)

**Delete these files (git rm):**
```bash
git rm -r products/ pages/ locations/bangalore.html reference/ testing/
git rm sitemap.xml  # will recreate as single-url below
# keep: index.html, assets/, .htaccess (to be trimmed)
```

**Result:** `find . -name "*.html" | sort` → only `./index.html`

### Phase 3 — Trim Shell Files to Homepage-Only (10 min)

**A. `.htaccess` — strip to minimal (no product/location rules):**
```apache
RewriteEngine On
# Homepage only — keep generic fallback for / → index.html
# Remove: eot-cranes, gantry-cranes, jib-cranes, hoists, crane-spare-parts, locations/bangalore, downloads, contact, request-a-quote
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^([^\.]+)$ $1.html [NC,L]
# Optional: redirect everything else to / (see Open Questions)
# RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]
```

**B. `sitemap.xml` — single loc:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.svind.co.in/</loc><lastmod>2026-08-11</lastmod><priority>1.0</priority></url>
</urlset>
```

**C. `LINK_INVENTORY.md` — archive or delete (it audits the pages you're removing). Move to `plans/svind-homepage-preserve/LINK_INVENTORY.archive.md` or delete.

**D. Internal links in `index.html` — neutralize without editing homepage DOM if possible:**
- `index.html` currently links to `/products/eot-cranes`, `/industries`, `/services`, `/resources`, `/about`, `/contact`, `/request-a-quote` etc. (29 broken targets today).
- **Option A (recommended, zero homepage edit):** Keep homepage byte-identical and let those hrefs 301 to `/` via `.htaccess` catch-all — no `index.html` change.
- **Option B (clean):** Point them to `/#range`, `/#industries`, `/#rfq` anchors already on the homepage — requires a tiny `index.html` edit (violates frozen law, so deferred).

This plan uses **Option A** to honor "doesn't touch anything" on homepage.

### Phase 4 — Deploy & Verify (15 min)

```bash
./plans/svind-homepage-preserve/verify.sh
# verify.sh:
# 1. sha256sum -c fingerprints.txt  → homepage bundle unchanged
# 2. test -f index.html && ! ls products/ pages/  → only homepage exists
# 3. curl -I https://www.svind.co.in/ → 200
# 4. curl -I https://www.svind.co.in/eot-cranes → 301 → /  (or 404, per decision)
# 5. sitemap.xml has exactly 1 <loc>
# 6. Lighthouse on / delta <2% (no CSS/JS changed)
```

Zero-downtime: deploy homepage-only bundle to staging preview URL, run verify, then cut DNS. Rollback = revert DNS + `git checkout <tag>`.

---

## 5. File Changes — Summary

| Path | Action | Reason |
|---|---|---|
| `index.html` | **KEEP — FROZEN** | Homepage — no edits |
| `assets/css/tokens.css` ... `value-prop.css` (10 files) | **KEEP — FROZEN** | Homepage dependencies |
| `assets/js/site.js` | **KEEP — FROZEN** | — |
| `assets/img/**` | **KEEP** | Homepage images |
| `products/**` (6 pages) | **DELETE** | Non-homepage sections |
| `pages/**` (6 pages) | **DELETE** | — |
| `locations/bangalore.html` | **DELETE** | — |
| `reference/` , `testing/` | **DELETE** | Artefact / concepts |
| `.htaccess` | **TRIM** | Remove 10 product/location rules |
| `sitemap.xml` | **REPLACE** | Single `<loc>/</loc>` |
| `LINK_INVENTORY.md` | **ARCHIVE** | Audit of deleted pages |
| `old site 301s` | **ADD** (optional) | `RewriteRule ^(products|pages)/ → /` |

Net: `21 HTML files → 1`, `11 sitemap locs → 1`, `~300 broken links → 0` (all 301 to `/`).

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| SEO: indexed `/eot-cranes`, `/contact` etc. suddenly 404 | Add catch-all `301 → /` in `.htaccess` + submit trimmed `sitemap.xml` + Search Console removals for deleted URLs |
| External backlinks break | Catch-all 301 preserves link equity to homepage |
| Homepage internal links look broken (hover shows `/products/eot-cranes` → redirects) | Acceptable for homepage-only — no homepage edit. If you later want clean anchors, do a separate PR that rewrites hrefs to `/#range` |
| Assets orphaned (unused CSS/images from deleted pages) | No action now — homepage bundle is self-contained; orphan sweep is a later optimization |

---

## 7. Checklist — Approve Before Delete

- [ ] `fingerprints.txt` written + tag `homepage-frozen-YYYYMMDD`
- [ ] `git rm -r products/ pages/ locations/bangalore.html reference/ testing/` confirmed
- [ ] `.htaccess` trimmed to generic fallback only (no product rules)
- [ ] `sitemap.xml` replaced with single `/` loc
- [ ] Decide: deleted URLs → `301 → /` or `404` (see Open Questions)
- [ ] `verify.sh` passes: `sha256` identical + only `index.html` remains + `/` 200

---

## 8. Open Questions

**1. Deleted URLs — 301 to homepage or 404?**
- **Recommended: 301 → /** — preserves SEO juice, external links don't die. One catch-all rule.
- Alternative: **404/410** — cleaner signal that pages are gone, but link equity lost.

**2. Homepage internal links — leave as 301s or rewrite to anchors?**
- **Recommended: Leave as-is** — zero homepage edit, honors frozen law. Links like `/products/eot-cranes` will just 301 to `/`.
- Alternative: Rewrite to `/#range`, `/#industries`, `/#rfq` — cleaner UX but edits `index.html` (deferred to next PR).

**3. Keep or delete `LINK_INVENTORY.md`?**
- **Recommended: Archive** to `plans/svind-homepage-preserve/LINK_INVENTORY.archive.md` — useful audit of what was removed.
- Alternative: Delete entirely.

---

*Plan location: `plans/svind-homepage-preserve/plan.md` — Markdown-only, homepage frozen, deletions happen around it. No edits to `index.html` until you approve.*
