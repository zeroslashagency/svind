# JS Contract — `assets/js/site.js`

One file, vanilla ES2020, no dependencies, no build step. Loaded once per page:

```html
<script src="assets/js/site.js" defer></script>
```

Everything runs inside one IIFE. The only global is `window.SVIND` (`{ version, reducedMotion(), closeMenu() }`). Every module null-checks its targets, so a page may omit any component. The script never generates markup and never assigns `innerHTML`; all text goes through `textContent`.

Implements exactly `../css/COMPONENT_CONTRACT.md` §5. It touches no class or attribute not listed below.

---

## 1. Scroll progress

| | |
|---|---|
| Binds | `.progress-bar__fill` (first match) |
| Sets | inline `style.transform = scaleX(0…1)` |
| Events | `scroll` + `resize`, `{ passive: true }`, `requestAnimationFrame`-throttled (resize also debounced 120 ms) |
| Builder supplies | nothing |
| No-JS | Bar stays at its CSS start state (`--progress-scale` default `0`). Decorative, `aria-hidden="true"`, so nothing is lost. |

## 2. Nav shrink

| | |
|---|---|
| Binds | `.nav` |
| Toggles | `.is-scrolled` when `pageYOffset > 40` |
| Events | shares the throttled scroll handler above |
| Builder supplies | nothing |
| No-JS | Nav keeps its full `--nav-h` height. Fully usable. |

## 3. Mobile menu

| | |
|---|---|
| Binds | `.nav__toggle` → the element named by its `aria-controls` (falls back to `.nav__overlay`) |
| Toggles | `aria-expanded` on the toggle, `hidden` + `.is-open` on the overlay, `.is-locked` on `<body>`, `aria-label` swap |
| Keyboard | Real focus trap — `Tab` / `Shift+Tab` cycle inside the overlay only; `Escape` closes and returns focus to the toggle |
| Also | Clicking any `a[href]` inside the overlay closes it; a resize to ≥1024px closes it |
| Builder supplies | `aria-expanded="false"`, `aria-controls="nav-overlay"`, `aria-label` on the toggle; matching `id` on `.nav__overlay`. Optional `data-label-open` / `data-label-close` override the default `Open menu` / `Close menu` labels. |
| No-JS | Ship the overlay with `hidden` in the markup as the contract shows. It stays closed and inert; `.nav__menu` and `.mobile-bar` carry navigation. The script re-asserts the closed state on init so a cached page never loads half-open. |

## 4. Accordion

| | |
|---|---|
| Binds | every `.index-row__trigger` → the panel named by its `aria-controls` |
| Toggles | `aria-expanded` on the trigger, `hidden` on `.index-row__panel`, `.is-open` on the closest `.index-row` |
| Behaviour | Rows are independent; any number may be open at once |
| Keyboard | None added. The trigger is a real `<button type="button">`, so Enter/Space arrive as `click`. Do not swap it for a `div`. |
| Builder supplies | `<button class="index-row__trigger" type="button" aria-expanded="false" aria-controls="p-01">` + `<div class="index-row__panel" id="p-01">` |
| No-JS | **Ship panels visible — no `hidden` attribute.** The script collapses them on init, so without JS every panel reads as plain prose. If a page wants a row open on load, set `aria-expanded="true"` on its trigger and the script leaves it open. |

## 5. Reveal

| | |
|---|---|
| Binds | `.reveal` |
| Adds | `.is-visible`, then unobserves |
| Observer | `threshold: 0.12`, `rootMargin: '0px 0px -8% 0px'` |
| Stagger | On `.reveal--stagger`, direct children get inline `transition-delay` of `index × 80 ms`, capped at `400 ms`, applied at reveal time |
| Builder supplies | `class="reveal"`, optionally `reveal--stagger` on the parent of the items |
| No-JS | `.is-visible` never lands. CSS must keep the final state legible under `prefers-reduced-motion` and for no-JS readers — this is a CSS responsibility, already handled in `base.css` §13. |

## 6. Stat count-up

| | |
|---|---|
| Binds | `.stat__value[data-count-to]` |
| Writes | the numeral text node only (via `textContent` / node value) — sibling markup such as `.stat__unit` is untouched |
| Animation | `requestAnimationFrame`, 1100 ms, ease-out cubic, fires once at ≥35% visibility, then unobserves |
| Formatting | `Intl.NumberFormat('en-IN')`. Grouping is applied only when the authored text or `data-count-to` already contains a comma — so `1994` stays `1994` and `12,500` counts to `12,500` |
| Prefix/suffix | Preserved from the original text. `100 T` → counts the `100`, keeps ` T`. `₹4.2 Cr` → counts `4.2`, keeps `₹` and ` Cr`. Decimal places are taken from `data-count-to` |
| Builder supplies | `data-count-to="100"` (plain number, optional `.` decimals, optional `,` to request grouping) and a text value that already reads correctly |
| No-JS | The authored text is the final value, so the stat reads correctly untouched. Never author a placeholder like `0`. |

## 7. Table filter

| | |
|---|---|
| Binds | `[data-filter]` buttons; rows matched by `[data-region]`, `[data-tier]`, `[data-threat]` |
| Toggles | `aria-pressed` on all triggers in the group, `.filter-hide` on non-matching rows |
| Matching | Case-insensitive; a row attribute may hold several space/comma separated tokens. `data-filter="all"` (or empty) clears every filter |
| Announce | Writes `Showing N of M rows.` / `Showing all M rows.` into the first `[role="status"]` inside the scope, else the first on the page. `textContent` only |
| Scope | Per trigger, in order: `data-filter-target="<id>"` → `[data-filter-group="<id>"]` ancestor → nearest `section` / `.band` / `form` / `main` → document. Triggers resolving to the same scope form one `aria-pressed` group |
| Builder supplies | `<button type="button" data-filter="south">` triggers, `data-region` / `data-tier` / `data-threat` on each `<tr>`, and a `<p role="status" aria-live="polite">` in the same section. Add `data-filter-target` only when triggers and table are not in one section |
| No-JS | No rows carry `.filter-hide` in markup, so the full table is visible and readable. Triggers do nothing — acceptable, they are progressive filters, not navigation. CSS must define `.filter-hide { display: none }` |

## 8. Form steps

| | |
|---|---|
| Binds | every `.form` holding **2 or more** `.form__group` fieldsets |
| Toggles | `hidden` on each `.form__group` (one visible at a time), `textContent` of `.form__step-current` (`01` … `04`, zero-padded from the group count), inline `--step-progress` percentage on `.form__step`, `disabled` on `[data-form-prev]` at step 1 |
| Advance | `[data-form-next]` validates the visible group first. On failure: `aria-invalid="true"` on the field, `.form__field--error` on its `.form__field`, message into that field's `.form__error` via `textContent`, `aria-describedby` wired to the error `id` when present, focus moved to the first invalid field, step does not change |
| Rewind | `[data-form-prev]`, no validation |
| Validation | Constraint Validation API `checkValidity()` + `validity` flags for the message. The one exception is phone: `input[type="tel"]` or a field whose name/id contains `phone`/`mobile` is tested against `/^(?:\+91|0)?[6-9]\d{9}$/` after stripping spaces, dashes, dots and brackets. Fields inside `.form__trap` (honeypot) are never validated |
| Live clear | An `input` event on a field already marked `aria-invalid="true"` re-validates and clears the error state |
| Submit | On `submit`, every group is validated including hidden ones. The first failing group is revealed, the field focused, and the submit is prevented |
| Builder supplies | `.form__group` fieldsets in order, `.form__step-current`, `[data-form-next]` / `[data-form-prev]` buttons (`type="button"`), a `.form__error` element inside each `.form__field` (give it an `id` to get `aria-describedby` wiring), and `required` + `aria-required="true"` on required fields |
| No-JS | **Ship all groups visible — no `hidden` attribute.** Without JS the form is one long page that submits in a single POST, and native browser constraint validation still blocks bad input. The script collapses to step 1 on init. |

---

## Cross-cutting guarantees

**`prefers-reduced-motion: reduce`** — checked with `matchMedia`, and a `change` listener re-applies live. Under reduce: reveals get `.is-visible` immediately with no stagger delays, counters paint their final value with no animation, no IntersectionObserver is created, the overlay hides without waiting for a transition. Scroll progress and nav shrink still update — they are state, not motion.

**Progressive enhancement** — the script only ever *adds* `hidden` on init (accordion panels, form steps beyond the first, the nav overlay it re-asserts). Nothing depends on `hidden` being authored, except the nav overlay, which the contract requires. Ship accordion panels and form groups open.

**Security** — no `innerHTML`, no `outerHTML`, no `insertAdjacentHTML`, no `eval`, no template-string HTML anywhere. Every dynamic string (validation messages, filter counts, counter output) is written with `textContent` or a text node value. Nothing is read from the URL.

**Performance** — one shared scroll listener for progress + nav, `requestAnimationFrame`-coalesced, `{ passive: true }`. Resize work is debounced (120 ms scroll metrics, 150 ms menu breakpoint). Reveal and counter observers unobserve after firing.

**Globals** — `window.SVIND` only: `version`, `reducedMotion()`, `closeMenu()`.
