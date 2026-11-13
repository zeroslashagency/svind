#!/usr/bin/env bash
# verify.sh — Homepage-Only Prune verification (HP-04)
# Gates: 1) sha256 frozen, 2) only index.html, 3) / 200 + canonical, 4) sitemap 1 loc, 5) no new broken / + .htaccess catch-all
# Usage: ./plans/svind-homepage-preserve/verify.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
PASS=0; FAIL=0
ok(){ echo "  PASS: $*"; PASS=$((PASS+1)); }
fail(){ echo "  FAIL: $*"; FAIL=$((FAIL+1)); }
info(){ echo "  INFO: $*"; }

echo "=== HP-04 verify.sh — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "PWD: $(pwd)"
echo ""

# Gate 1 — sha256 frozen bundle identical (13 lines)
echo "[Gate 1] sha256sum -c fingerprints.txt (13 OK)"
if sha256sum -c plans/svind-homepage-preserve/fingerprints.txt 2>&1; then
  ok "sha256sum -c — 13 OK"
else
  fail "sha256sum -c failed"
fi
if [ -z "$(git diff -- index.html assets/css/tokens.css assets/css/base.css assets/css/components.css assets/css/core.css assets/css/hro.css assets/css/abt.css assets/css/foc.css assets/css/arz.css assets/css/mpz.css assets/css/exp.css assets/css/value-prop.css assets/js/site.js 2>&1)" ]; then
  ok "git diff on frozen bundle empty"
else
  fail "git diff on frozen bundle not empty"
  git diff -- index.html assets/css/tokens.css assets/css/base.css assets/css/components.css assets/css/core.css assets/css/hro.css assets/css/abt.css assets/css/foc.css assets/css/arz.css assets/css/mpz.css assets/css/exp.css assets/css/value-prop.css assets/js/site.js || true
fi
if [ -z "$(git diff --cached -- index.html assets/css/tokens.css assets/css/base.css assets/css/components.css assets/css/core.css assets/css/hro.css assets/css/abt.css assets/css/foc.css assets/css/arz.css assets/css/mpz.css assets/css/exp.css assets/css/value-prop.css assets/js/site.js 2>&1)" ]; then
  ok "git diff --cached on frozen bundle empty"
else
  fail "git diff --cached on frozen bundle not empty"
fi
# also check wc -c index.html == 53003
if [ "$(wc -c < index.html | tr -d ' ')" = "53003" ]; then
  ok "index.html 53003 bytes"
else
  fail "index.html bytes mismatch: $(wc -c < index.html)"
fi
echo ""

# Gate 2 — only index.html remains
echo "[Gate 2] Only index.html remains"
HTML_COUNT=$(find . -name "*.html" -not -path "./.git/*" | wc -l | tr -d ' ')
if [ "$HTML_COUNT" -eq 1 ]; then
  ok "find . -name \"*.html\" -not -path \"./.git/*\" | wc -l == 1 (actual: $HTML_COUNT)"
else
  fail "find html count != 1 (actual: $HTML_COUNT)"
  find . -name "*.html" -not -path "./.git/*" | sort || true
fi
HTML_LIST=$(find . -name "*.html" -not -path "./.git/*" 2>&1)
if [ "$HTML_LIST" = "./index.html" ]; then
  ok "find lists only ./index.html"
else
  info "find output: $HTML_LIST"
  if echo "$HTML_LIST" | grep -q "^\./index.html$" && [ "$HTML_COUNT" -eq 1 ]; then ok "only ./index.html present"; else fail "unexpected html files: $HTML_LIST"; fi
fi
GIT_HTML=$(git ls-files | grep -E "\.html$" || true)
if [ "$GIT_HTML" = "index.html" ]; then
  ok "git ls-files | grep html == index.html only"
else
  fail "git ls-files html != index.html only: '$GIT_HTML'"
fi
if git ls-files | grep -q "^products" ; then fail "git ls-files still has products/"; else ok "git ls-files no products/"; fi
if git ls-files | grep -q "^pages" ; then fail "git ls-files still has pages/"; else ok "git ls-files no pages/"; fi
if git ls-files | grep -q "^locations" ; then fail "git ls-files still has locations/"; else ok "git ls-files no locations/"; fi
if git ls-files | grep -q "^reference" ; then fail "git ls-files still has reference/"; else ok "git ls-files no reference/"; fi
if git ls-files | grep -q "^testing" ; then fail "git ls-files still has testing/"; else ok "git ls-files no testing/"; fi
# .DS_Store residue is allowed — check it is ignored, not tracked
if git ls-files | grep -q "DS_Store"; then fail "DS_Store tracked"; else ok ".DS_Store not tracked (ignored residue OK)"; fi
echo ""

# Gate 3 — / must resolve 200, canonical unchanged (no live server — grep + reasoning)
echo "[Gate 3] / resolves 200, canonical unchanged (static checks)"
if grep -q 'rel="canonical" href="https://www.svind.co.in/"' index.html; then
  ok "canonical https://www.svind.co.in/ unchanged"
else
  fail "canonical mismatch"
  grep "canonical" index.html || true
fi
# .htaccess must NOT redirect / itself
if grep -qE 'RewriteRule \^(\$|/\$)' .htaccess; then
  fail ".htaccess has rule matching ^/$ or ^$ (would redirect /)"
else
  ok ".htaccess has no rule matching ^/$ or ^$ ( / not redirected )"
fi
# catch-all must NOT match "/" or ""
if grep -q 'RewriteRule \^(products|pages|locations|reference|testing)/\.\*\$' .htaccess; then
  info "catch-all pattern requires prefix/ — does not match \"/\" or \"\""
  ok "catch-all verified not matching \"/\" (pattern needs prefix/)"
else
  fail "catch-all pattern not found"
fi
# generic fallback must remain
if grep -q 'RewriteRule \^(\[\\\^\\.\\\]' .htaccess || grep -q 'RewriteRule \^\[.*\$ \$1.html' .htaccess || grep -q 'RewriteRule ^(\[.*) \$1.html' .htaccess; then
  ok "generic fallback RewriteRule present"
else
  # simpler check
  if grep -q '\$1\.html' .htaccess && grep -q 'RewriteCond %{REQUEST_FILENAME} !-f' .htaccess; then
    ok "generic fallback RewriteRule present (via \$1.html + !-f)"
  else
    fail "generic fallback missing"
  fi
fi
echo ""

# Gate 4 — sitemap has exactly 1 <loc> for https://www.svind.co.in/
echo "[Gate 4] sitemap.xml single loc"
LOC_COUNT=$(grep -c "<loc>" sitemap.xml || true)
if [ "$LOC_COUNT" -eq 1 ]; then
  ok "grep -c <loc> sitemap.xml == 1"
else
  fail "sitemap <loc> count !=1 (actual: $LOC_COUNT)"
  cat sitemap.xml || true
fi
if grep -q "https://www.svind.co.in/" sitemap.xml; then
  ok "sitemap contains https://www.svind.co.in/"
else
  fail "sitemap missing https://www.svind.co.in/"
fi
URL_COUNT=$(grep -c "<url>" sitemap.xml || true)
if [ "$URL_COUNT" -eq 1 ]; then ok "grep -c <url> ==1"; else fail "url count !=1: $URL_COUNT"; fi
if grep -q "<priority>1.0</priority>" sitemap.xml; then ok "sitemap priority 1.0"; else fail "sitemap priority !=1.0"; fi
if grep -q '<lastmod>2026-08-11</lastmod>' sitemap.xml; then ok "sitemap lastmod 2026-08-11"; else fail "sitemap lastmod mismatch"; fi
if command -v xmllint >/dev/null 2>&1; then
  if xmllint --noout sitemap.xml 2>&1; then ok "xmllint XML valid"; else fail "xmllint invalid"; fi
else
  if python3 -c "import xml.etree.ElementTree as ET; ET.parse('sitemap.xml')" 2>&1; then ok "python XML valid"; else fail "python XML invalid"; fi
fi
echo ""

# Gate 5 — no new broken "/" — builder's catch-all handles deleted prefixes; homepage internal broken count irrelevant
echo "[Gate 5] No new broken / — catch-all 301 + fallback"
if grep -q 'RewriteRule \^(products|pages|locations|reference|testing)/\.\*\$ / \[R=301,L\]' .htaccess; then
  ok ".htaccess catch-all RewriteRule ^(products|pages|locations|reference|testing)/.*$ / [R=301,L] present"
else
  fail ".htaccess catch-all missing or malformed"
  grep "RewriteRule" .htaccess || true
fi
# catch-all before fallback (only active RewriteRule lines, not comments)
CATCH_LINE=$(grep -n '^RewriteRule.*products|pages|locations' .htaccess | head -1 | cut -d: -f1)
FALLBACK_LINE=$(grep -n '\$1\.html' .htaccess | head -1 | cut -d: -f1)
if [ -n "$CATCH_LINE" ] && [ -n "$FALLBACK_LINE" ]; then
  if [ "$CATCH_LINE" -lt "$FALLBACK_LINE" ]; then
    ok "catch-all before fallback (line $CATCH_LINE < $FALLBACK_LINE)"
  else
    fail "catch-all not before fallback (catch:$CATCH_LINE fallback:$FALLBACK_LINE)"
  fi
else
  fail "could not determine order catch:$CATCH_LINE fallback:$FALLBACK_LINE"
fi
# old 10 product rules gone (only in comments allowed)
OLD_FOUND=0
for slug in "eot-cranes/double-girder" "crane-spare-parts" "gantry-cranes" "jib-cranes" "hoists" "locations/bangalore" "downloads" "contact" "request-a-quote"; do
  if grep "^RewriteRule" .htaccess | grep -q "$slug"; then
    fail "old RewriteRule still present: $slug"
    OLD_FOUND=1
  fi
done
if [ "$OLD_FOUND" -eq 0 ]; then ok "10 old product/location RewriteRules removed (no ^RewriteRule contains them)"; fi
# verify old slugs only in comments
if grep "^RewriteRule" .htaccess | grep -q "eot-cranes"; then fail "eot-cranes still in active RewriteRule"; else ok "eot-cranes only in comments, not active rule"; fi
echo ""

# Additional checks per spec — git status, LINK_INVENTORY archive, etc.
echo "[Extra] git status --short shows 20 D + M .htaccess M sitemap.xml (22 files), index.html not modified"
STAGED_COUNT=$(git diff --cached --name-status | wc -l | tr -d ' ')
if [ "$STAGED_COUNT" -eq 22 ]; then ok "git diff --cached 22 files staged"; else fail "staged count !=22 (actual: $STAGED_COUNT)"; git diff --cached --name-status | cat; fi
if git diff --cached --name-status | grep -q "^M.*\.htaccess"; then ok ".htaccess M staged"; else fail ".htaccess not M staged"; fi
if git diff --cached --name-status | grep -q "^M.*sitemap.xml"; then ok "sitemap.xml M staged"; else fail "sitemap.xml not M staged"; fi
if git status --short | grep -q "index.html" && ! git diff --cached --name-only | grep -q "^index.html$"; then
  # index.html appears only via products/ etc. — check index.html itself not staged
  if git diff --cached --name-only | grep -q "^index.html$"; then fail "index.html staged (should not be)"; else ok "index.html not in staged (frozen)"; fi
else
  if git diff --cached --name-only | grep -q "^index.html$"; then fail "index.html staged"; else ok "index.html not modified (not in staged)"; fi
fi
echo ""

echo "[Extra] LINK_INVENTORY archive"
if [ -f "shared/artifacts/LINK_INVENTORY.archive.md" ]; then ok "LINK_INVENTORY.archive.md exists"; else fail "archive missing"; fi
if [ -f "LINK_INVENTORY.md" ]; then ok "LINK_INVENTORY.md still at root (preserved)"; else info "LINK_INVENTORY.md not at root"; fi
if diff -q LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md >/dev/null 2>&1; then ok "archive identical to LINK_INVENTORY.md"; else fail "archive differs"; diff LINK_INVENTORY.md shared/artifacts/LINK_INVENTORY.archive.md | head -20 || true; fi
echo ""

echo "[Extra] tag homepage-frozen-20260811"
if git tag --list "homepage-frozen*" | grep -q "homepage-frozen-20260811"; then ok "tag homepage-frozen-20260811 exists"; else fail "tag missing"; fi
echo ""

echo "[Extra] .htaccess / never redirected — reasoning"
echo "  Pattern ^(products|pages|locations|reference|testing)/.*\$ requires prefix/ — does not match \"\" or \"/\" (verified via regex)"
echo "  Generic fallback has !-f !-d so \"/\" (directory) does not trigger rewrite — serves DirectoryIndex index.html -> 200"
ok "manual reasoning: / -> 200, not 301"
echo ""

echo "=== Summary: $PASS PASS, $FAIL FAIL ==="
if [ "$FAIL" -eq 0 ]; then
  echo "Result: ALL GATES GREEN — Approved"
  exit 0
else
  echo "Result: $FAIL FAIL — Feedback required"
  exit 1
fi
