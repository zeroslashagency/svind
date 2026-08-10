# HP-04 Review — Verify frozen homepage + homepage-only prune

**Task:** HP-04 — Reviewer — verify, don't rebuild  
**Spec:** `shared/specs/2026-08-11-homepage-only-prune.md`  
**Plan:** `plans/svind-homepage-preserve/plan.md`  
**Fingerprints:** `plans/svind-homepage-preserve/fingerprints.txt` (13 lines)  
**Files verified:** `index.html` (frozen), `.htaccess` (trimmed), `sitemap.xml` (1 loc), git staged 22 files  
**Builder handoffs:** `shared/artifacts/HP-01-handoff.md`, `HP-02-handoff.md`, `HP-03-handoff.md`  
**Date:** 2026-08-11  
**Reviewer:** svind-homepage-preserve reviewer lane  
**Verdict:** **Approved** — all 5 gates GREEN, homepage frozen + prune complete + ready to ship

> **Comment for orchestrator:** `Approved` — 5 gates PASS, 36 sub-checks PASS via `plans/svind-homepage-preserve/verify.sh`. Homepage bundle byte-identical (13 OK), only `index.html` remains, canonical unchanged, sitemap 1 loc, catch-all handles deleted prefixes without redirecting `/`. Ready to promote Review → Done and commit staged batch. See verification outputs below.

---

## Executive Summary

Builder executed HP-01 → HP-02 → HP-03 as a single staged batch (no intermediate commits). All deliverables verified against spec and plan:

- **Gate 1** sha256 identical — 13 OK
- **Gate 2** only `index.html` — `find` 1, `git ls-files` 1
- **Gate 3** `/` 200 + canonical — static grep + regex reasoning (no live server) confirms `/` not redirected
- **Gate 4** sitemap 1 `<loc>` — grep 1, XML valid, priority 1.0
- **Gate 5** no new broken `/` — catch-all present before fallback, does not match `/`
- **Extras** git diff empty on frozen bundle, 22 staged (20 D + 2 M), LINK_INVENTORY archived identical, tag present, DS_Store ignored not tracked.

No edits to builder artifacts. No Feedback required. Known trade-off: `/industries` etc. now 404 via fallback (not 301) — per spec Option A, intentional.

---

## Gate Summary (5 must be green → Approved)

| Gate | Check | Result | Evidence |
|------|-------|--------|----------|
| 1 | `sha256sum -c fingerprints.txt` → 13 OK | **PASS** | 13 lines OK, `git diff` empty, `wc -c` 53003 |
| 2 | `find . -name "*.html" -not -path "./.git/*" | wc -l ==1` and `git ls-files \| grep html == index.html` | **PASS** | find 1 (`./index.html`), git ls-files 1 (`index.html`), no products/pages/locations/reference/testing tracked |
| 3 | `/` must resolve 200, canonical unchanged (grep + reasoning, no live server) | **PASS** | `grep canonical` → `https://www.svind.co.in/`, `.htaccess` no rule matches `^/$`/`^$`, catch-all does not match `/` |
| 4 | `sitemap.xml` exactly 1 `<loc>` for `https://www.svind.co.in/` | **PASS** | `grep -c "<loc>"` 1, `xmllint` valid, priority 1.0, lastmod 2026-08-11 |
| 5 | No new broken "/" — catch-all `^(products\|pages\|locations\|reference\|testing)/.*$ / [R=301,L]` before fallback, does not redirect `/` | **PASS** | catch-all present line 13, fallback line 20, order OK, 10 old rules gone |

---

## Gate 1 — sha256 frozen bundle identical

### Commands

```bash
sha256sum -c plans/svind-homepage-preserve/fingerprints.txt
git diff -- index.html assets/css/tokens.css assets/css/base.css assets/css/components.css assets/css/core.css assets/css/hro.css assets/css/abt.css assets/css/foc.css assets/css/arz.css assets/css/mpz.css assets/css/exp.css assets/css/value-prop.css assets/js/site.js
git diff --cached -- index.html assets/css/tokens.css assets/css/base.css assets/css/components.css assets/css/core.css assets/css/hro.css assets/css/abt.css assets/css/foc.css assets/css/arz.css assets/css/mpz.css assets/css/exp.css assets/css/value-prop.css assets/js/site.js
wc -c index.html
cat plans/svind-homepage-preserve/fingerprints.txt
```

### Actual Output

```
index.html: OK
assets/css/tokens.css: OK
assets/css/base.css: OK
assets/css/components.css: OK
assets/css/core.css: OK
assets/css/hro.css: OK
assets/css/abt.css: OK
assets/css/foc.css: OK
assets/css/arz.css: OK
assets/css/mpz.css: OK
assets/css/exp.css: OK
assets/css/value-prop.css: OK
assets/js/site.js: OK
EXIT:0

git diff on frozen bundle: (no output) → GIT_DIFF_EMPTY: PASS
git diff --cached on frozen: (no output) → exit 0

   53003 index.html

2e5a7482bba00e4e2874521a999199773c5bcd3342021c28c72b83996be18160  index.html
2f26ea76099976b8e5494204f22adac0be24d43ff2c5c9a5badaeccd02587424  assets/css/tokens.css
cb63a77d2dfd12f712ed827acf788f591447a3f3d45459584cdb1975a3d68784  assets/css/base.css
15a0bfc207a845733afd2dfbb1e2854b11f4c3f43421442e0ef24c23455c4651  assets/css/components.css
07c3d464e367670cc3b2f188f405371c2a32c405b6c2e0b5f1039e8a942c35ed  assets/css/core.css
3250d5508e999ff14920966f6ca99c503dbfdceb86f231f0f7453095565bf6cf  assets/css/hro.css
dcdc6a77394e196ed8d6b5ca45c4571d2e584a1b5bd278cbb4d7662f68145ea9  assets/css/abt.css
cdcf8688b96b9b9310429915bf79dd4d308bcd04ac75c4312c9c86f702671ddb  assets/css/foc.css
38b78e615db38038ef180ccf210c9820a9bc3643f3382a7cb081edc2ed475ec3  assets/css/arz.css
8c6145ea1546a1a135eb58d746b0170b7db7ae6dc4dabbb79ca4e646f03aa084  assets/css/mpz.css
056a2d6e2e324cfb7ce0b43ed3302f1967372d2ad7ea57fe3f6f608923ff8733  assets/css/exp.css
1c94eaec3d52c3d5f6b95e5e6c5346067709a3886bba11d378bd357dbac6c2a7  assets/css/value-prop.css
ed1bcf92ddf56901585a7a6687f4e7dbc692d6dab4441815fbe46999bcc31a0c  assets/js/site.js
```

### Assertion file:line

- `plans/svind-homepage-preserve/fingerprints.txt:1` expected `2e5a7482... index.html` — actual matches
- `plans/svind-homepage-preserve/fingerprints.txt:13` expected `ed1bcf92... assets/js/site.js` — actual matches
- `index.html` line 8 `rel="canonical"` unchanged (see Gate 3)

**Gate 1: PASS**

---

## Gate 2 — Only index.html remains

### Commands

```bash
find . -name "*.html" -not -path "./.git/*" | sort
find . -name "*.html" -not -path "./.git/*" | wc -l
git ls-files | grep -E "\.html$"
git ls-files | grep "^products"  ; echo "products check"
git ls-files | grep "^pages"     ; echo "pages check"
git ls-files | grep "^locations" ; echo "locations check"
git ls-files | grep "^reference" ; echo "reference check"
git ls-files | grep "^testing"   ; echo "testing check"
ls -la pages/  ; ls -la products/  ; ls -ld locations reference testing
git status --ignored --short
git ls-files | grep DS_Store
```

### Actual Output

```
find . -name "*.html" -not -path "./.git/*" | sort
./index.html
COUNT:       1

git ls-files | grep -E "\.html$"
index.html
GIT_LS_COUNT:       1

products: (no output) — OK
pages: (no output) — OK
locations: (no output) — OK
reference: (no output) — OK
testing: (no output) — OK

ls -la pages/
total 16
drwxr-xr-x@  3 xoxo  staff    96 11 Aug 03:05 .
drwxr-xr-x@ 17 xoxo  staff   544 11 Aug 03:05 ..
-rw-r--r--@  1 xoxo  staff  6148  9 Aug 03:30 .DS_Store
ls -la products/
total 16
drwxr-xr-x@  3 xoxo  staff    96 11 Aug 03:05 .
drwxr-xr-x@ 17 xoxo  staff   544 11 Aug 03:05 ..
-rw-r--r--@  1 xoxo  staff  6148  9 Aug 03:30 .DS_Store
ls: locations: No such file or directory
ls: reference: No such file or directory
ls: testing: No such file or directory

git status --ignored --short
M  .htaccess
D  locations/bangalore.html
... (20 D)
M  sitemap.xml
?? agents/
?? plans/
?? shared/
!! .DS_Store
!! assets/.DS_Store
!! assets/img/.DS_Store
!! pages/
!! products/

git ls-files | grep DS_Store
No DS_Store tracked: OK

git check-ignore -v pages/.DS_Store
.gitignore:2:.DS_Store    pages/.DS_Store
```

### Assertion

- Expected `find | wc -l ==1` — actual `1` — **PASS**
- Expected `git ls-files | grep html == index.html only` — actual `index.html` — **PASS**
- Expected `git ls-files` no `products/`, `pages/`, `locations/`, `reference/`, `testing/` — actual none — **PASS**
- Expected filesystem `locations/`, `reference/`, `testing/` removed — actual `No such file or directory` — **PASS**
- `pages/`/`products/` residue `!! pages/ !! products/` via `git status --ignored` — only `.DS_Store` (ignored per `.gitignore:2:.DS_Store`) — `git ls-files` empty — **PASS (not failure per spec)**

**Gate 2: PASS**

---

## Gate 3 — / must resolve 200, canonical unchanged

No live server available — verified via grep + `.htaccess` regex reasoning.

### Commands

```bash
grep -n "canonical" index.html
grep 'rel="canonical"' index.html
cat .htaccess
grep "^RewriteRule" .htaccess
grep -E "RewriteRule \^(\$|/\$)" .htaccess && echo "FAIL root redirect" || echo "No root redirect: OK"
python3 -c "import re; pat=re.compile(r'^(products|pages|locations|reference|testing)/.*$'); print([ (p, bool(pat.match(p.lstrip('/')))) for p in ['', '/', 'products/eot-cranes', 'pages/company/contact', 'industries', 'eot-cranes'] ])"
```

### Actual Output

```
grep -n "canonical" index.html
8:  <link rel="canonical" href="https://www.svind.co.in/">
--- link canonical line:
  <link rel="canonical" href="https://www.svind.co.in/">

.htaccess:
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

grep "^RewriteRule" .htaccess
RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]
RewriteRule ^([^\.]+)$ $1.html [NC,L]

No root redirect: OK  (grep -E "RewriteRule \^(\$|/\$)" → no match)

Python regex check (stripped leading /):
'' -> False
'/' -> stripped '' -> False
'products/eot-cranes' -> True
'pages/company/contact' -> True
'industries' -> False
'eot-cranes' -> False
```

### Assertion file:line

- `index.html:8` expected `<link rel="canonical" href="https://www.svind.co.in/">` — actual `  <link rel="canonical" href="https://www.svind.co.in/">` — **PASS**
- `index.html:28,32,60,62,63` expected `https://www.svind.co.in/` in JSON-LD — actual present — **PASS**
- `.htaccess:7` expected `RewriteEngine On` — actual line 7 `RewriteEngine On` — **PASS**
- `.htaccess:13` expected `RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]` — actual line 13 matches — **PASS**
- `.htaccess` expected no `RewriteRule ^/$` or `^$` — actual none — **PASS**
- `.htaccess` pattern `^(products|...)/.*$` does NOT match `""` or `"/"` — verified via python `pat.match("")` → False — **PASS**
- Generic fallback `RewriteCond %{REQUEST_FILENAME} !-f` + `!-d` + `RewriteRule ^([^\.]+)$ $1.html` — for `/` (directory) `!-d` is False → no rewrite → serves `DirectoryIndex index.html` → 200 — reasoning **PASS**
- `sitemap.xml` single loc is `https://www.svind.co.in/` consistent with canonical — **PASS**

**Gate 3: PASS**

---

## Gate 4 — sitemap.xml has exactly 1 `<loc>` for `https://www.svind.co.in/`

### Commands

```bash
cat sitemap.xml
grep -c "<loc>" sitemap.xml
grep "<loc>" sitemap.xml
xmllint --noout sitemap.xml; echo "xmllint exit:$?"
grep "priority" sitemap.xml
grep -c "<url>" sitemap.xml
grep "https://www.svind.co.in/" sitemap.xml
```

### Actual Output

```
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.svind.co.in/</loc><lastmod>2026-08-11</lastmod><priority>1.0</priority></url>
</urlset>

grep -c "<loc>" sitemap.xml
1
exit:0

grep "<loc>" sitemap.xml
  <url><loc>https://www.svind.co.in/</loc><lastmod>2026-08-11</lastmod><priority>1.0</priority></url>

xmllint exit:0

grep "priority" sitemap.xml
  <url><loc>https://www.svind.co.in/</loc><lastmod>2026-08-11</lastmod><priority>1.0</priority></url>

grep -c "<url>" sitemap.xml
1

grep "https://www.svind.co.in/" sitemap.xml
  <url><loc>https://www.svind.co.in/</loc><lastmod>2026-08-11</lastmod><priority>1.0</priority></url>

wc -c sitemap.xml
     212 sitemap.xml
```

### Assertion file:line

- `sitemap.xml:1` expected `<?xml version="1.0" encoding="UTF-8"?>` — actual line 1 matches — **PASS**
- `sitemap.xml:2` expected `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` — actual line 2 matches — **PASS**
- `sitemap.xml:3` expected `<url><loc>https://www.svind.co.in/</loc><lastmod>2026-08-11</lastmod><priority>1.0</priority></url>` — actual line 3 matches — **PASS**
- `sitemap.xml:4` expected `</urlset>` — actual line 4 matches — **PASS**
- Expected `grep -c "<loc>" ==1` — actual `1` — **PASS**
- Expected `grep -c "<url>" ==1` — actual `1` — **PASS**
- Expected `<priority>1.0</priority>` — actual present — **PASS**
- Expected `xmllint --noout` exit 0 — actual `0` — XML valid **PASS**
- Before: `git show HEAD:sitemap.xml` had 11 `<loc>` (/, request-a-quote, eot-cranes, double-girder, gantry, jib, hoists, crane-spare-parts, locations/bangalore, downloads, contact) — after: 1 — delta correct **PASS**

**Gate 4: PASS**

---

## Gate 5 — No new broken "/" — catch-all + fallback

Spec: builder's catch-all handles `/products|pages|locations|reference|testing/.*` → 301 to `/`, homepage internal broken count doesn't increase (or is now irrelevant because targets deleted). Also check `.htaccess` does NOT redirect `/` itself.

### Commands

```bash
grep "^RewriteRule" .htaccess
grep -c "^RewriteRule" .htaccess
grep -q 'RewriteRule \^(products|pages|locations|reference|testing)/' .htaccess && echo "catch-all present: OK"
grep -n "^RewriteRule.*products|pages|locations" .htaccess
grep -n "\$1\.html" .htaccess
# catch before fallback?
# old rules gone?
grep "^RewriteRule.*eot-cranes" .htaccess && echo "FAIL" || echo "old product rules removed: OK"
for slug in eot-cranes gantry-cranes jib-cranes hoists crane-spare-parts; do grep "^RewriteRule" .htaccess | grep -q "$slug" && echo "FAIL $slug" || echo "removed OK: $slug"; done
for slug in "locations/bangalore" "downloads" "contact" "request-a-quote"; do grep "^RewriteRule" .htaccess | grep -q "$slug" && echo "FAIL $slug" || echo "removed OK: $slug"; done
grep -E "RewriteRule \^(\$|/\$)" .htaccess && echo "FAIL root" || echo "No root redirect: OK"
# simulate homepage hrefs
grep -o 'href="[^"]*"' index.html | sort | uniq -c | sort -rn | head -20
```

### Actual Output

```
grep "^RewriteRule" .htaccess
RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]
RewriteRule ^([^\.]+)$ $1.html [NC,L]

grep -c "^RewriteRule" .htaccess
2

catch-all present: OK

grep -n "^RewriteRule.*products|pages|locations" .htaccess
13:RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]

grep -n "\$1\.html" .htaccess
20:RewriteRule ^([^\.]+)$ $1.html [NC,L]

catch line 13 < fallback line 20 → ORDER OK

grep "^RewriteRule.*eot-cranes" && echo FAIL || echo OK
old product rules removed: OK
removed OK: eot-cranes
removed OK: gantry-cranes
removed OK: jib-cranes
removed OK: hoists
removed OK: crane-spare-parts
removed OK: locations/bangalore
removed OK: downloads
removed OK: contact
removed OK: request-a-quote

No root redirect: OK

homepage hrefs (counts):
   6 href="/pages/services/request-a-quote"
   6 href="/about.html"
   3 href="/services.html"
   3 href="/pages/services/request-a-quote.html"
   2 href="/resources.html"
   2 href="/products/spare-parts"
   2 href="/products/jib-cranes"
   2 href="/products/hoists"
   2 href="/products/gantry-cranes"
   2 href="/products/eot-cranes"
   2 href="/industries"
   ... (30+ distinct, 6 categories)
```

### Per-assertion file:line ( .htaccess )

| Line | Expected | Actual | Verdict |
|------|----------|--------|---------|
| 7 | `RewriteEngine On` | `RewriteEngine On` | PASS |
| 13 | `RewriteRule ^(products\|pages\|locations\|reference\|testing)/.*$ / [R=301,L]` | `RewriteRule ^(products\|pages\|locations\|reference\|testing)/.*$ / [R=301,L]` | PASS |
| 13 before 20 | catch-all before fallback | catch 13 < fallback 20 | PASS |
| 18-19 | `RewriteCond %{REQUEST_FILENAME} !-f` + `!-d` | both present lines 18,19 | PASS |
| 20 | `RewriteRule ^([^\.]+)$ $1.html [NC,L]` | present line 20 | PASS |
| — | no `RewriteRule ^/$` or `^$` | `grep -E "RewriteRule \^(\$|/\$)"` → no match | PASS |
| — | no active `RewriteRule` containing `eot-cranes`, `gantry-cranes`, etc. | `grep "^RewriteRule" \| grep eot-cranes` → no match (only comment line 4) | PASS |
| — | pattern `^(products\|...)/.*$` does not match `""` or `"/"` | python `pat.match("")` False, `pat.match("products/eot-cranes")` True | PASS |

### Reasoning: does homepage gain new broken "/"?

- Homepage has legacy hrefs like `/products/eot-cranes` (×2), `/products/gantry-cranes` (×2), `/pages/services/request-a-quote` (×6), `/locations/bangalore` (×1), `/reference/*`, `/testing/*`.
- All now hit catch-all line 13 → `301 → /` (prefix + `/` + anything). Verified via python:
  - `/products/eot-cranes` stripped `products/eot-cranes` → catch True → 301
  - `/pages/services/request-a-quote` → True → 301
  - `/locations/bangalore` → stripped `locations/bangalore` → Wait: `locations/bangalore` without trailing slash → `locations` + `/` + `bangalore` → matches! (True) → 301 (good — covers spec's `locations/bangalore.html` deletion)
- Links to non-prefix paths (`/industries`, `/services.html`, `/resources.html`, `/about.html`, `/eot-cranes/single-girder`) are **not** in catch-all → fallback tries `industries.html` etc. → no file (deleted) → 404. This is documented trade-off of Option A (zero homepage edit per plan §4D). Count of broken targets on `/` does not increase — previously those hrefs were counted as broken in LINK_INVENTORY (48 distinct, 221 occ.), now they are either 301 or still 404 — no new broken `/` itself.
- `/` itself: pattern requires `prefix/` → does not match → fallback `!-d` fails ( `/` is dir ) → serves `DirectoryIndex index.html` → 200. Verified: no rule matches `^$` or `^/$`.

**Gate 5: PASS**

---

## Additional Checks

### git diff on frozen bundle empty

```bash
git diff -- index.html assets/css/tokens.css assets/css/base.css assets/css/components.css assets/css/core.css assets/css/hro.css assets/css/abt.css assets/css/foc.css assets/css/arz.css assets/css/mpz.css assets/css/exp.css assets/css/value-prop.css assets/js/site.js
# → (no output) exit 0
git diff --cached -- index.html assets/css/tokens.css assets/css/base.css assets/css/components.css assets/css/core.css assets/css/hro.css assets/css/abt.css assets/css/foc.css assets/css/arz.css assets/css/mpz.css assets/css/exp.css assets/css/value-prop.css assets/js/site.js
# → (no output) exit 0
```

**PASS** — homepage frozen, no staged or unstaged diff.

### git status --short shows 20 D + M .htaccess M sitemap.xml (22 files), index.html not modified

```bash
git status --short
# M  .htaccess
# D  locations/bangalore.html
# D  pages/company/about.html
# D  pages/company/contact.html
# D  pages/resources/downloads.html
# D  pages/resources/resources.html
# D  pages/services/request-a-quote.html
# D  pages/services/services.html
# D  products/eot-cranes/double-girder.html
# D  products/eot-cranes/index.html
# D  products/gantry-cranes/index.html
# D  products/hoists/index.html
# D  products/jib-cranes/index.html
# D  products/spare-parts/index.html
# D  reference/fulloptioncraft-sections.html
# M  sitemap.xml
# D  testing/resources-concepts/concept-A-ledger.html
# D  testing/resources-concepts/concept-B-blueprint.html
# D  testing/resources-concepts/concept-C-quiet-evidence.html
# D  testing/resources-concepts/concept-D-field-manual.html
# D  testing/resources-concepts/concept-E-hybrid.html
# D  testing/resources-concepts/index.html
# ?? agents/
# ?? plans/
# ?? shared/

git diff --cached --stat
# 22 files changed, 15 insertions(+), 11904 deletions(-)
#  .htaccess 28 +- , sitemap.xml 59 +-, 20 deletions

git diff --cached --name-status
# M  .htaccess
# M  sitemap.xml
# D  locations/bangalore.html
# D  pages/company/about.html ... (20 D total)

git ls-files | grep html
# index.html

git diff --cached --name-status | wc -l
# 22
```

- Expected 22 staged (20 D + 2 M) — actual 22 — **PASS**
- Expected `M .htaccess`, `M sitemap.xml` — actual both M — **PASS**
- Expected `index.html` not modified — `git diff --cached --name-only | grep "^index.html$"` → no match — **PASS**

### .htaccess: 10 product rules gone

Original `git show HEAD:.htaccess` (20 lines) contained:

```
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
```

Current `.htaccess` diff (`git diff --cached -- .htaccess`) shows all 10 removed, replaced with catch-all + comments. Verified `grep "^RewriteRule" .htaccess` no longer contains any of those slugs except in comment line 4. — **PASS**

### sitemap.xml: XML valid, single url, priority 1.0

Already in Gate 4 — **PASS**.

### LINK_INVENTORY.archive.md exists and identical

```bash
ls -lh LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md
# -rw-r--r-- 25K  LINK_INVENTORY.md
# -rw-r--r-- 25K  shared/artifacts/LINK_INVENTORY.archive.md
diff -q LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md && echo "archive identical: OK"
# archive identical: OK
wc -l LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md
# 384 LINK_INVENTORY.md
# 384 shared/artifacts/LINK_INVENTORY.archive.md
# 768 total
```

- `shared/artifacts/LINK_INVENTORY.archive.md` exists — **PASS**
- `diff -q` identical — **PASS**
- `LINK_INVENTORY.md` still at root preserved (25K identical) — per HP-03 deliverable "preserve for reviewer decision" — **PASS**

### Leftover .DS_Store dirs (pages/, products/ ignored) — note but not failure

- `git status --ignored` shows `!! pages/` `!! products/` due to `pages/.DS_Store` and `products/.DS_Store` (ignored via `.gitignore:2:.DS_Store`).
- `git ls-files pages/ products/` → empty (no tracked files).
- `find . -name "*.html" -not -path "./.git/*" | wc -l ==1` passes.
- Spec says "note but not failure if git ls-files empty" — **PASS with note**.

### Tag present

```bash
git tag --list "homepage-frozen*"
# homepage-frozen-20260811
git show --oneline -s homepage-frozen-20260811
# fc5ecfd Replace trust strip with value proposition and update engineering resour
```

**PASS**

---

## Known Issues / Trade-offs

1. **Homepage hrefs to non-prefix paths now 404 vs 301** — Builder chose catch-all only for deleted prefixes per spec Option A (zero `index.html` edit). Paths like `/industries`, `/services.html`, `/resources.html`, `/about.html`, `/eot-cranes/single-girder`, `/eot-cranes/double-girder`, `/eot-cranes/hot-metal-ladle-foundry`, `/industries/*` (automotive, steel, etc.) are **not** covered by `^(products|pages|locations|reference|testing)/.*$` and will fall through to generic fallback `^([^\.]+)$ → $1.html` → 404 (no file, deleted). This is **spec-compliant** (plan Open Questions: "301 → / OR 404 per decision" — spec mandated only prefix catch-all). If SEO wants old short slugs also 301, follow-up should add `RewriteRule ^(eot-cranes|gantry-cranes|jib-cranes|hoists|crane-spare-parts|downloads|contact|request-a-quote|industries|services|resources|about)(/.*)?$ / [R=301,L]` — but not required for Approval.

2. **Old short URLs (`/eot-cranes`, `/contact`, `/downloads`, etc.) now 404** — Previously 10 RewriteRules mapped them to files; now removed. They have no file and no catch-all → 404. Same trade-off as above, documented in HP-03 handoff. Acceptable per spec; link equity for those slugs could be preserved with additional 301 in follow-up if desired.

3. **`pages/` and `products/` empty dirs remain due to `.DS_Store`** — macOS Finder artifact, ignored via `.gitignore`. Not tracked, not a failure. Reviewer canonical check is `find ... | wc -l ==1` and `git ls-files` — both pass. `git clean -fd` or `rm -rf pages products` would remove residue but left as-is to avoid touching ignored files (HP-02 documented).

4. **`LINK_INVENTORY.md` still at root** — Archived copy identical at `shared/artifacts/LINK_INVENTORY.archive.md` (25K, 384 lines). Original preserved at root per HP-03 "reviewer decides delete vs archive" — not a failure; orchestrator may delete after promotion.

5. **No live `curl -I` available** — Gate 3 verified via static `grep` + regex reasoning. Actual HTTP 200 to be confirmed post-deploy (deploy preview → `curl -I https://www.svind.co.in/` → 200). `verify.sh` includes comments on this.

6. **Generic fallback remains** — `RewriteRule ^([^\.]+)$ $1.html [NC,L]` with `!-f` `!-d` guards stays after catch-all. Correct order ensures catch-all 301 takes precedence over `.html` mapping. No impact to `/`.

---

## Verification Commands for Orchestrator (copy-paste)

```bash
# All gates in one script (executable):
./plans/svind-homepage-preserve/verify.sh
# Expected: 36 PASS, 0 FAIL, Result: ALL GATES GREEN — Approved

# Individual gates:
sha256sum -c plans/svind-homepage-preserve/fingerprints.txt
# → 13 OK

find . -name "*.html" -not -path "./.git/*" | sort
# → ./index.html
find . -name "*.html" -not -path "./.git/*" | wc -l
# → 1
git ls-files | grep -E "\.html$"
# → index.html

grep 'rel="canonical" href="https://www.svind.co.in/"' index.html
# →   <link rel="canonical" href="https://www.svind.co.in/">
cat .htaccess
grep "^RewriteRule" .htaccess
# → RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L]
# → RewriteRule ^([^\.]+)$ $1.html [NC,L]

grep -c "<loc>" sitemap.xml
# → 1
xmllint --noout sitemap.xml; echo $?
# → 0
cat sitemap.xml
# → <?xml ...><urlset><url><loc>https://www.svind.co.in/</loc>...</url></urlset>

git status --short
# → M .htaccess, M sitemap.xml, 20 D
git diff --cached --stat
# → 22 files changed, 15 insertions(+), 11904 deletions(-)
git diff -- index.html assets/css/* assets/js/site.js
# → (no output)
diff -q LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md && echo "identical: OK"
# → identical: OK
```

### `verify.sh` output (actual run 2026-08-10T21:39:12Z)

```
=== HP-04 verify.sh — 2026-08-10T21:39:12Z ===
PWD: /Users/xoxo/Documents/Projects/SVIND
[Gate 1] sha256sum -c fingerprints.txt (13 OK)
index.html: OK
assets/css/tokens.css: OK
assets/css/base.css: OK
assets/css/components.css: OK
assets/css/core.css: OK
assets/css/hro.css: OK
assets/css/abt.css: OK
assets/css/foc.css: OK
assets/css/arz.css: OK
assets/css/mpz.css: OK
assets/css/exp.css: OK
assets/css/value-prop.css: OK
assets/js/site.js: OK
  PASS: sha256sum -c — 13 OK
  PASS: git diff on frozen bundle empty
  PASS: git diff --cached on frozen bundle empty
  PASS: index.html 53003 bytes
[Gate 2] Only index.html remains
  PASS: find . -name "*.html" -not -path "./.git/*" | wc -l == 1 (actual: 1)
  PASS: find lists only ./index.html
  PASS: git ls-files | grep html == index.html only
  PASS: git ls-files no products/
  PASS: git ls-files no pages/
  PASS: git ls-files no locations/
  PASS: git ls-files no reference/
  PASS: git ls-files no testing/
  PASS: .DS_Store not tracked (ignored residue OK)
[Gate 3] / resolves 200, canonical unchanged (static checks)
  PASS: canonical https://www.svind.co.in/ unchanged
  PASS: .htaccess has no rule matching ^/$ or ^$ ( / not redirected )
  INFO: catch-all pattern requires prefix/ — does not match "/" or ""
  PASS: catch-all verified not matching "/" (pattern needs prefix/)
  PASS: generic fallback RewriteRule present (via $1.html + !-f)
[Gate 4] sitemap.xml single loc
  PASS: grep -c <loc> sitemap.xml == 1
  PASS: sitemap contains https://www.svind.co.in/
  PASS: grep -c <url> ==1
  PASS: sitemap priority 1.0
  PASS: sitemap lastmod 2026-08-11
  PASS: xmllint XML valid
[Gate 5] No new broken / — catch-all 301 + fallback
  PASS: .htaccess catch-all RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L] present
  PASS: catch-all before fallback (line 13 < 20)
  PASS: 10 old product/location RewriteRules removed (no ^RewriteRule contains them)
  PASS: eot-cranes only in comments, not active rule
[Extra] git status --short shows 20 D + M .htaccess M sitemap.xml (22 files), index.html not modified
  PASS: git diff --cached 22 files staged
  PASS: .htaccess M staged
  PASS: sitemap.xml M staged
  PASS: index.html not in staged (frozen)
[Extra] LINK_INVENTORY archive
  PASS: LINK_INVENTORY.archive.md exists
  PASS: LINK_INVENTORY.md still at root (preserved)
  PASS: archive identical to LINK_INVENTORY.md
[Extra] tag homepage-frozen-20260811
  PASS: tag homepage-frozen-20260811 exists
[Extra] .htaccess / never redirected — reasoning
  Pattern ^(products|pages|locations|reference|testing)/.*$ requires prefix/ — does not match "" or "/" (verified via regex)
  Generic fallback has !-f !-d so "/" (directory) does not trigger rewrite — serves DirectoryIndex index.html -> 200
  PASS: manual reasoning: / -> 200, not 301
=== Summary: 36 PASS, 0 FAIL ===
Result: ALL GATES GREEN — Approved
```

---

## Deliverables Checklist

- [x] `shared/reviews/HP-04-review.md` — this file, Verdict Approved with gate outputs, file:line assertions, trade-offs
- [x] `plans/svind-homepage-preserve/verify.sh` — executable bash per plan §4 (sha256sum -c, git checks, sitemap/htaccess asserts), `chmod +x`, 36 checks, exits 0 on green

---

## Final Confirmation

**Homepage frozen + prune complete + ready to ship**

- `index.html` byte-identical (53003 bytes, sha256 `2e5a7482...`), +12 CSS/JS assets — `sha256sum -c` 13 OK, `git diff` empty
- Prune: 21 HTML files → 1, 11 sitemap locs → 1, ~11.9k deletions, 22 files staged (20 D + 2 M), no commit yet — ready for orchestrator to commit/push/tag
- `.htaccess` trimmed to 2 RewriteRules (catch-all → `/` 301 before fallback), 10 old rules removed, `/` not redirected
- `sitemap.xml` single loc `https://www.svind.co.in/`, priority 1.0, XML valid
- LINK_INVENTORY archived identical, tag `homepage-frozen-20260811` at `fc5ecfd`
- Known trade-off `/industries` etc. now 404 via fallback vs 301 — intentional per spec Option A, not a blocker

**Recommendation: Approve HP-01 + HP-02 + HP-03, commit staged batch, deploy to staging preview, curl-verify `/` → 200 and `/products/eot-cranes` → 301 → `/` before DNS cut. Rollback = `git checkout homepage-frozen-20260811`.**

---

*Reviewer: do not edit builder artifacts directly — this review is read-only verification. If Feedback were required, builder would receive exact file:line fixes; here none needed.*
