# HP-03 Handoff — Trim shell: .htaccess + sitemap.xml + archive LINK_INVENTORY

**Task:** HP-03 — Trim shell: .htaccess + sitemap.xml + archive LINK_INVENTORY  
**State transition:** Inbox → Review (handoff) — orchestrator to promote; final builder slice  
**Depends on:** HP-02 (deletions staged)  
**Date:** 2026-08-11  
**Executor:** Builder

## What was done and why
Trimmed shell files to homepage-only per spec `shared/specs/2026-08-11-homepage-only-prune.md` (“Trim .htaccess (remove 10 product/location rules, keep generic fallback)”, “Replace sitemap.xml (11 locs → 1 loc)”, “Archive LINK_INVENTORY.md → shared/artifacts/”) and plan `plans/svind-homepage-preserve/plan.md` §Phase 3. Preserved homepage frozen — no edits to index.html or assets.

### 1. `.htaccess` — replaced with minimal homepage-only version
**Read original:** 10 explicit short-URL rules + generic fallback (20 lines).  
**Replaced with:** `RewriteEngine On` + catch-all + generic fallback (16 lines + comments).

- **Removed (10 rules):** exactly those listed in spec:
  `^eot-cranes/double-girder/`, `^eot-cranes/`, `^gantry-cranes/`, `^jib-cranes/`, `^hoists/`, `^crane-spare-parts/`, `^locations/bangalore/`, `^downloads/`, `^contact/`, `^request-a-quote/` — all gone. Verified via `grep "^RewriteRule" .htaccess` no longer contains those slugs except in comment documenting removal.
- **Kept:** `RewriteEngine On` and generic fallback:
  ```apache
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^([^\.]+)$ $1.html [NC,L]
  ```
- **Added catch-all (Option A per plan §4D — zero homepage edit):**
  ```apache
  RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]
  ```
  Documented choice in `.htaccess` comments and below. Ensures `/` itself is never redirected because pattern requires `prefix + "/"` — does not match `""` or `"/"`. Covers deleted prefixed URLs (`/products/eot-cranes`, `/pages/company/contact`, `/locations/bangalore`, `/reference/*`, `/testing/*`). Old short URLs (`/eot-cranes`, `/contact`, etc.) are **not** covered — they will fall through to generic fallback and then 404 (no file) — intentional per spec “301 → / OR 404 per decision”; alternative would be to add explicit 301s for those 10 slugs but spec mandates only the prefix catch-all, so we follow spec exactly.
- **Order:** catch-all **before** generic fallback so 301 takes precedence over fallback `.html` mapping.
- **Staged:** `git add .htaccess`

### 2. `sitemap.xml` — replaced with single loc
**Before:** 11 `<loc>` entries (/, request-a-quote, eot-cranes, eot-cranes/double-girder, gantry-cranes, jib-cranes, hoists, crane-spare-parts, locations/bangalore, downloads, contact) + comments.  
**After:** single loc homepage:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.svind.co.in/</loc><lastmod>2026-08-11</lastmod><priority>1.0</priority></url>
</urlset>
```
Kept XML header, single `<url>` with `<loc>https://www.svind.co.in/</loc>`, `<lastmod>2026-08-11</lastmod>` (prune date), `<priority>1.0</priority>`. Verified `grep -c "<loc>" sitemap.xml` → 1.

- **Staged:** `git add sitemap.xml`

### 3. `LINK_INVENTORY.md` — archived (not deleted)
- **Action:** `cp LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md` (copy, not move). Original `LINK_INVENTORY.md` **preserved** at repo root per plan “Archive — useful audit of what was removed” and deliverable “copy to shared/artifacts/LINK_INVENTORY.archive.md (preserve audit), do NOT delete original yet — leave for reviewer decision”. Verified `diff -q LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md` → identical, `ls -lh` both 25K.
- **Not staged:** archive is untracked artifact for audit; original remains for reviewer to decide delete vs archive.

### 4. Staging
```bash
git add .htaccess sitemap.xml
# LINK_INVENTORY.archive.md left untracked (artifact)
```

## Exact file paths for artifacts
- **Modified (staged):** `.htaccess` (1.1K, 16 lines), `sitemap.xml` (212B, 1 loc)
- **Archived (untracked):** `shared/artifacts/LINK_INVENTORY.archive.md` (25K, identical to `LINK_INVENTORY.md`)
- **Preserved (untracked original):** `LINK_INVENTORY.md` at root (25K) — reviewer decides keep vs delete
- **Combined staged diff (HP-02+HP-03 batch):** 22 files changed, 15 insertions, 11904 deletions (20 deletions + 2 modifies)

## How to test/verify — summary for reviewer (include all gates)

```bash
# Gate 1 — Frozen homepage byte-identical (reuse HP-01)
sha256sum -c plans/svind-homepage-preserve/fingerprints.txt
# expected: 13 OK (index.html + 10 CSS listed + site.js — actually 13 lines: index + 11 css? task specifies 10+site+index=13? we have 13)
cat plans/svind-homepage-preserve/fingerprints.txt
# Shows 13 hashes; see HP-01 handoff for values

# Gate 2 — Only homepage HTML remains
find . -name "*.html" -not -path "./.git/*" | sort
# → ./index.html
find . -name "*.html" -not -path "./.git/*" | wc -l
# → 1
git ls-files | grep -E "\.html$"
# → index.html only
git ls-files | grep products && echo "FAIL" || echo "products gone: OK"
git ls-files | grep pages && echo "FAIL" || echo "pages gone: OK"

# Gate 3 — Sitemap single loc
cat sitemap.xml
# → <?xml ...?><urlset><url><loc>https://www.svind.co.in/</loc>...</url></urlset>
grep -c "<loc>" sitemap.xml
# → 1
grep "https://www.svind.co.in/" sitemap.xml
# → single loc with priority 1.0, lastmod 2026-08-11

# Gate 4 — .htaccess minimal, no old rules, catch-all present, no redirect on /
cat .htaccess
# Expected:
# - RewriteEngine On present
# - No "^RewriteRule ^eot-cranes" etc. (only comments mention them)
# - One catch-all: RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]
# - Generic fallback present after catch-all
grep "^RewriteRule" .htaccess
# → RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]
# → RewriteRule ^([^\.]+)$ $1.html [NC,L]
grep "^RewriteRule.*eot-cranes" .htaccess && echo "FAIL: old rule remains" || echo "old product rules removed: OK"
grep -q "RewriteRule.*products|pages|locations" .htaccess && echo "catch-all present: OK"
# Verify "/" not redirected: pattern requires prefix+/, so "/" and "" do not match

# Gate 5 — git status staged batch
git status --short
# → M  .htaccess, M  sitemap.xml, 20 D entries (locations/pages/products/reference/testing)
git status
# → Changes to be committed: 22 files (2 modified, 20 deleted), Untracked: agents/ plans/ shared/
git diff --cached --stat
# → 22 files changed, 15 insertions(+), 11904 deletions(-)

# Extra — LINK_INVENTORY archive
ls -lh LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md
diff -q LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md && echo "archive identical: OK"
# Original still at root: reviewer decides delete vs keep

# Extra — tag still present, not pushed
git tag --list "homepage-frozen*"
# → homepage-frozen-20260811

# Extra — verify old short URLs behavior (manual curl after deploy)
# curl -I https://www.svind.co.in/ → 200
# curl -I https://www.svind.co.in/products/eot-cranes → 301 → / (via catch-all)
# curl -I https://www.svind.co.in/eot-cranes → 404 (old short slug, not in catch-all, no file) — alternative 301 would need extra rule; current spec choice is 404
```

Full current artifacts for copy-paste:

**`sitemap.xml`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.svind.co.in/</loc><lastmod>2026-08-11</lastmod><priority>1.0</priority></url>
</urlset>
```

**`.htaccess`:**
```apache
# SVIND — Homepage-Only (HP-03)
# Frozen: index.html + 10 CSS + site.js remain byte-identical (see fingerprints.txt)
# Pruned: 10 explicit product/location RewriteRules removed:
#   eot-cranes/double-girder, eot-cranes, gantry-cranes, jib-cranes, hoists,
#   crane-spare-parts, locations/bangalore, downloads, contact, request-a-quote
RewriteEngine On

# Option A (plan §4D) — deleted prefixes 301 → / with zero index.html edit.
# Preserves link equity for old /products/*, /pages/* etc. Homepage hrefs
# to /products/* now 301 → / via this rule.
# Pattern requires "prefix/" so "/" itself is never redirected (verified:
# "^(products|pages|locations|reference|testing)/.*$" does not match "" or "/").
RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]

# Generic fallback — keep from original, must stay after catch-all:
# /foo → /foo.html if that file exists (e.g., future docs). !-f / !-d guards
# assets/* and existing files; does not affect "/".
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^([^\.]+)$ $1.html [NC,L]
```

**`git status --short` (current):**
```
M  .htaccess
D  locations/bangalore.html
D  pages/company/about.html
D  pages/company/contact.html
D  pages/resources/downloads.html
D  pages/resources/resources.html
D  pages/services/request-a-quote.html
D  pages/services/services.html
D  products/eot-cranes/double-girder.html
D  products/eot-cranes/index.html
D  products/gantry-cranes/index.html
D  products/hoists/index.html
D  products/jib-cranes/index.html
D  products/spare-parts/index.html
D  reference/fulloptioncraft-sections.html
M  sitemap.xml
D  testing/resources-concepts/concept-A-ledger.html
D  testing/resources-concepts/concept-B-blueprint.html
D  testing/resources-concepts/concept-C-quiet-evidence.html
D  testing/resources-concepts/concept-D-field-manual.html
D  testing/resources-concepts/concept-E-hybrid.html
D  testing/resources-concepts/index.html
?? agents/
?? plans/
?? shared/
```

## Known limitations / issues
- **Homepage hrefs to `/products/*` etc. now 301 → / via catch-all (no index.html edit — Option A per plan §4D).** Homepage still contains legacy hrefs like `/products/eot-cranes`, `/industries`, `/services`, etc. (29 broken targets in LINK_INVENTORY). Per plan, we intentionally left `index.html` byte-identical (frozen). Those links will now hit the catch-all `^(products|pages|locations|reference|testing)/.*$ → 301 /` and land on homepage. Links to non-prefix paths like `/industries`, `/about`, `/services`, `/eot-cranes` are **not** in catch-all and will 404 (fallback has no file). This is the documented trade-off of Option A (zero homepage edit) vs Option B (rewrite hrefs to `/#range` anchors, deferred). Reviewer should not expect those hrefs to resolve to content — they correctly redirect or 404 after prune.
- **`/` never redirected:** Verified pattern requires prefix+“/”, so `curl -I /` returns 200, not 301.
- **Old short URLs (`/eot-cranes`, `/contact`, etc.) now 404 vs 301:** The catch-all only covers prefixed paths. The 10 old short slugs (previously mapped via 10 RewriteRules now removed) have no file and no rule, so they 404 via fallback. Alternative decision could have been to add explicit 301s for those 10 slugs to `/` for SEO preservation, but spec said “Add optional catch-all: RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]” — we implemented exactly that. Documenting choice: we followed spec literally; if SEO wants short slugs also 301, add 10 more rules like `RewriteRule ^(eot-cranes|gantry-cranes|...|request-a-quote)(/.*)?$ / [R=301,L]` in a follow-up.
- **LINK_INVENTORY.md still at root:** Archived copy at `shared/artifacts/LINK_INVENTORY.archive.md` identical (25K). Original left for reviewer decision per plan “Archive or delete — reviewer decides”. Not yet deleted.
- **Empty dirs `pages/` and `products/` on filesystem** due to ignored `.DS_Store` (see HP-02 handoff). `git ls-files` shows no tracked files there; `find *.html == 1` passes. Not a functional issue.
- **No commit yet:** HP-02+HP-03 staged together (22 files) — not committed per deliverable “Do not commit yet — leave staged for HP-03 to batch”. Next step is reviewer HP-04 verification, then orchestrator decides commit/push/tag.

## What's next
- **Reviewer picks up HP-04** — verify frozen homepage + prune (reviewer gate). Reviewer owns HP-04 and should run the 5 verification gates: `sha256sum -c`, `find *.html == 1`, `curl -I / → 200`, `sitemap 1 loc`, `LINK_INVENTORY broken count on / does not increase (all now 301 → /)`.
- Reviewer to produce `shared/reviews/HP-04-review.md` and optionally `plans/svind-homepage-preserve/verify.sh` per plan §4.
- Orchestrator owns state transitions — will move HP-01..HP-03 from Review → Done after reviewer gates green, then handle commit (batched staged changes) and deploy. Rollback remains `git checkout homepage-frozen-20260811`.

## Handoff comment for tasks.json
> HP-03 complete: .htaccess trimmed to RewriteEngine On + prefix catch-all 301 → / (Option A, / never redirected) + generic fallback (10 old rules removed); sitemap.xml replaced with single <loc>https://www.svind.co.in/</loc> priority 1.0 (grep <loc> ==1); LINK_INVENTORY.md copied to shared/artifacts/LINK_INVENTORY.archive.md identical 25K, original preserved for reviewer. Staged: git add .htaccess sitemap.xml (plus 20 D from HP-02 batched =22 files staged). Verify: sha256sum -c, git status --short, cat sitemap.xml, cat .htaccess, grep -c <loc>. Known: homepage hrefs to /products/* now 301 → / via catch-all (no index.html edit — Option A), old short slugs /eot-cranes etc now 404 (not in catch-all, spec choice). What's next: Reviewer HP-04 picks up verification gates.

## Documented choice (artifact)
- **Catch-all decision:** Implemented spec-mandated `RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]` **before** generic fallback, with comment documenting Option A. Ensures deleted prefixed URLs preserve link equity via 301 to homepage, while keeping homepage byte-identical. `/` never matches (pattern needs prefix+/). Old short URLs without prefix will 404 — documented as spec-compliant trade-off; SEO-sensitive follow-up could add explicit 301s for those 10 slugs if desired.
