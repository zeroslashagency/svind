# Component Contract — SVIND v2

Authoritative HTML contract for `tokens.css`, `base.css`, `components.css`. Page builders write markup against **this document** and must not need to read the CSS.

Aesthetic law: `../../../01_DESIGN/06_DESIGN_RECALIBRATION.md`. Read §6 of this file before writing a line.

---

## 1. Page boilerplate

Cascade order is not optional.

```html
<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unique per page — SVIND</title>
  <meta name="description" content="Unique per page. Never omitted.">
  <link rel="stylesheet" href="assets/css/tokens.css">
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/components.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="progress-bar" aria-hidden="true"><div class="progress-bar__fill"></div></div>
  <header class="nav">…</header>
  <main id="main">…</main>
  <footer class="footer">…</footer>
  <nav class="mobile-bar" aria-label="Quick contact">…</nav>
  <script src="assets/js/site.js" defer></script>
</body>
</html>
```

Relative asset depth: root pages use `assets/…`, pages one directory deep use `../assets/…`.

## 2. Tokens

All 118 are defined on `:root`. Use `var(--token)`; never hard-code a value.

### Colour
| Token | Value | Use |
|---|---|---|
| `--color-concrete` | `#EFECE6` | Default page field |
| `--color-concrete-2` | `#E4E0D8` | Alternating band |
| `--color-concrete-3` | `#D6D1C7` | Table stripe |
| `--color-white` | `#FCFBF8` | Card surface. **Never `#FFFFFF`** |
| `--color-ink` | `#0E1418` | Dark band, footer, display text |
| `--color-ink-2` | `#1C262C` | Card inside a dark band |
| `--color-ink-3` | `#2E3A42` | Hairline on dark |
| `--color-steel` | `#1B3A4B` | Technical/spec panel |
| `--color-copper` | `#C4531F` | **THE accent.** ≤3 uses per viewport |
| `--color-copper-hover` | `#A9451A` | Accent hover |
| `--color-copper-soft` | `rgba(196,83,31,.10)` | Wash behind featured/SVIND column |
| `--color-copper-wire` | `rgba(196,83,31,.34)` | Ghost-button border |
| `--color-safe` `--color-warn` `--color-alert` | green / amber / red | In-stock · lead-time · safety-critical only |
| `--color-text` `--color-text-secondary` `--color-text-muted` | | Body / secondary / metadata |
| `--color-text-on-dark` `--color-text-on-dark-muted` `--color-text-on-accent` | | Text over ink / over copper |
| `--color-hairline` `--color-hairline-2` `--color-hairline-dark` | | 1px rules. The only structural device |
| `--color-watermark-light` `--color-watermark-dark` `--color-outline-stroke` | | Defined but **revoked** — do not use |

### Type
Families: `--font-sans` (Inter Tight — display *and* body), `--font-mono` (IBM Plex Mono), `--font-display` (aliases sans).

Each step ships four coordinated tokens — `--text-*`, `--weight-*`, `--lh-*`, `--tracking-*` — plus `--case-*` on display steps: `display-xxl` (`clamp(2.5rem,5.5vw,4.5rem)`/600) · `display-xl` · `display-l` · `display-m` · `stat` (weight **300**) · `lead` · `body` · `body-s` · `micro-caps` · `spec-mono` · `index-numeral`.

Utility classes: `.t-display-xxl` `.t-display-xl` `.t-display-l` `.t-display-m` `.t-lead` `.t-body` `.t-body-s` `.mono` `.text-secondary` `.text-muted`.

### Space, layout, radius, motion, z-index
`--space-0`…`--space-11` (4→160px) · `--gutter` · `--band-y` `clamp(96px,11vw,180px)` · `--band-y-tight` · `--max-content` 1240px · `--max-text` 68ch · `--max-wide` 1600px · `--grid-cols` `--grid-gap` · `--nav-h` `--nav-h-scrolled` `--mobile-bar-h` · `--bp-sm|md|lg|xl|xxl` (480/768/1024/1280/1600) · `--radius-none|sm|md` (**≤4px**) · `--elevation-flat|card|float` (flat is default) · `--dur-fast` 160ms `--dur-base` 280ms `--dur-slow` 560ms `--dur-reveal` 640ms · `--ease-out` `--ease-in-out` · `--focus-ring-*` · `--z-base|raised|nav|overlay|mobile-bar|progress|skip`.

## 3. Layout primitives

| Class | Purpose |
|---|---|
| `.container` | Centred, `--max-content`, gutter. `--narrow` (text), `--wide` (1600px full-bleed stage) |
| `.band` | Section wrapper, `--band-y` vertical padding. **The section separator** |
| `.band--white` `.band--ink` `.band--concrete-2` | Surface variants. ≤2 non-default bands per page |
| `.band--tight` `.band--seam` `.band--flush-top` `.band--flush-bottom` | Reduced padding / hairline seam / collapse edge |
| `.band__head` | Eyebrow + heading + lead cluster at the top of a band |
| `.grid` | 12-col, `--grid-gap` |
| `.grid--7-5` `.grid--5-7` `.grid--8-4` `.grid--4-8` `.grid--6-6` | Column splits. **≥1 asymmetric split per page** |
| `.grid--cards` | Auto-fit responsive card grid |
| `.measure` `.measure--tight` | 68ch reading width |
| `.stack` `.stack--sm` `.stack--lg` | Vertical rhythm |
| `.row` | Horizontal flex cluster |
| `.hairline-top` `.hairline-bottom` | 1px rule |
| `.sr-only` `.skip-link` | Accessibility |

```html
<section class="band band--white" id="products" aria-labelledby="products-h">
  <div class="container">
    <div class="band__head">
      <p class="eyebrow">Product range</p>
      <h2 class="t-display-l" id="products-h">Cranes we manufacture</h2>
    </div>
    <div class="grid grid--7-5">…</div>
  </div>
</section>
```

Every `.band` carries `id` + `aria-labelledby` pointing at its heading.

## 4. Components

### `.nav` — sticky header
Children: `.nav__inner` › `.nav__brand` (`.nav__wordmark`, `.nav__descriptor`) · `.nav__menu` (`.nav__link`) · `.nav__cta` (copper, ≥1024px only) · `.nav__toggle` (3× `.nav__toggle-bar`, <1024px).
Overlay: `.nav__overlay` › `.nav__overlay-list` › `.nav__overlay-link`, plus `.nav__overlay-foot`.

```html
<header class="nav">
  <div class="container nav__inner">
    <a class="nav__brand" href="/">
      <span class="nav__wordmark">SVIND</span>
      <span class="nav__descriptor">EOT &amp; Gantry Cranes · Bengaluru</span>
    </a>
    <nav class="nav__menu" aria-label="Main">
      <a class="nav__link" href="/eot-cranes">Cranes</a>
    </nav>
    <a class="btn btn--primary nav__cta" href="/request-a-quote">Get a quote<span class="btn__glyph" aria-hidden="true">↗</span></a>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-overlay" aria-label="Open menu">
      <span class="nav__toggle-bar"></span><span class="nav__toggle-bar"></span><span class="nav__toggle-bar"></span>
    </button>
  </div>
  <div class="nav__overlay" id="nav-overlay" hidden>
    <ul class="nav__overlay-list"><li><a class="nav__overlay-link" href="/eot-cranes">Cranes</a></li></ul>
  </div>
</header>
```
Required: `aria-expanded` + `aria-controls` on the toggle; `hidden` on the overlay; `aria-current="page"` on the active link. JS toggles `.is-scrolled` on `.nav` and `.is-open` on `.nav__overlay`.

### `.mobile-bar` — fixed bottom bar (<768px)
`.mobile-bar__item` ×3; the WhatsApp/quote item takes `--accent`. Wrap in `<nav aria-label="Quick contact">`. Real `tel:` and `https://wa.me/` hrefs.

### `.hero` — page opener, **no ghost watermark**
`.hero__grid` › `.hero__body` (`.hero__eyebrow`, `.hero__title`, `.hero__lead`, `.hero__specs`, `.hero__actions`) + `.hero__media` (`--overlay`, `.hero__media-caption`). `.hero--ink` for the dark variant.
`.hero__specs` › `.hero__spec` × n › `.hero__spec-label` + `.hero__spec-value` (mono).

```html
<section class="hero">
  <div class="container hero__grid">
    <div class="hero__body">
      <p class="hero__eyebrow">Manufacturer · Since 2006</p>
      <h1 class="hero__title">EOT and gantry cranes built to IS 807</h1>
      <p class="hero__lead">Harohalli KIADB, Bengaluru. Design, fabrication, FAT and AMC under one roof.</p>
      <dl class="hero__specs">
        <div class="hero__spec"><dt class="hero__spec-label">Capacity</dt><dd class="hero__spec-value">1 – 100 T</dd></div>
      </dl>
      <div class="hero__actions">
        <a class="btn btn--primary" href="/request-a-quote">Request a quote<span class="btn__glyph" aria-hidden="true">↗</span></a>
        <a class="btn btn--ghost" href="/downloads">Download catalogue</a>
      </div>
    </div>
    <figure class="hero__media">
      <img src="…" alt="80 T double-girder EOT crane, 22 m span, lifting a steel coil in an automotive press shop">
      <figcaption class="hero__media-caption">Double-girder EOT · 80 T · M7 duty</figcaption>
    </figure>
  </div>
</section>
```
Exactly one `<h1>` and one `.btn--primary` per page. Alt text carries capacity, span, industry.

### `.trust-strip`
`.trust-strip__list` › `.trust-strip__item` › `.trust-strip__label` + `.trust-strip__value` (`--verified` adds the certified mark). Sits above the first fold break. ISO cell links the real PDF. Unverified counts are withheld or marked `[CLIENT TO CONFIRM]` — never invented.

### `.btn`
`--primary` (copper) · `--ghost` (copper-wire border) · `--dark` (ink pill) · `--link` · `--block`. Optional `.btn__glyph` must be `aria-hidden="true"`. Use `<a>` for navigation, `<button type>` for actions. One `--primary` per viewport.

### `.card` / `.card--product`
`.card__index` (micro-caps `01`) · `.card__media` › `img` · `.card__text` (`.card__title`, description) · `.card__foot` (`.card__spec` mono, or a `.btn--link`) · `.card__link` stretched overlay for whole-card clickability.
Hover: border darkens, title turns copper, 1px lift, 160ms. **No colour flood.** Heading level inside a card is `<h3>`.

### `.index-row` — numbered accordion
`.index-list` › `.index-row` › `<button class="index-row__trigger">` (grid: `.index-row__num` mono · `.index-row__label` · `.index-row__icon`) + `.index-row__panel`.

```html
<div class="index-row">
  <h3><button class="index-row__trigger" type="button" aria-expanded="false" aria-controls="p-01">
    <span class="index-row__num">01</span>
    <span class="index-row__label">Enquiry and load study</span>
    <span class="index-row__icon" aria-hidden="true"></span>
  </button></h3>
  <div class="index-row__panel" id="p-01" hidden><p class="t-body">…</p></div>
</div>
```
Required: `aria-expanded`, `aria-controls`, `hidden`. JS toggles both plus `.is-open`. Replaces icon bullets entirely.

### `.stat`
`.stat-grid` › `.stat` › `.stat__value` (thin mono numeral, optional `.stat__unit`) + `.stat__caption` (micro-caps). `.stat--accent` for **one** stat maximum. Every figure must be evidenced.

### `.spec-table`
Wrap in `.spec-table-wrap` (mobile scroll + shadow affordance). `--leader` gives dotted label→value alignment. Mandatory: `<caption>`, `scope="col"` / `scope="row"`, mono values via `.spec` or `.mono`. `.spec-table__note` for footnotes.

```html
<div class="spec-table-wrap">
  <table class="spec-table spec-table--leader">
    <caption>Double-girder EOT crane — standard range</caption>
    <tbody>
      <tr><th scope="row">Capacity</th><td class="spec">5 – 100 T</td></tr>
    </tbody>
  </table>
  <p class="spec-table__note">Custom capacities on request.</p>
</div>
```

### `.compare-table` — pain × common × SVIND
Wrap in `.compare-table-wrap`. The third column carries `.compare-table__SVIND` on **both** its `<th scope="col">` and every `<td>`. `.compare-table__spec` for mono cells. `<caption>` required.

### `.chips` — process flow
`.chips` › `.chips__item` (`--active`) › `.chips__num` + `.chips__label`. Use `<ol>`; separators are CSS-generated and decorative.

### `.form` — RFQ
`.form__group` › `.form__legend` · `.form__row` (`--2`) · `.form__field` (`--error`) › `.form__label` + `.form__input`|`__select`|`__textarea` + `.form__hint` / `.form__error`. Also `.form__check`, `.form__required`, `.form__actions`, `.form__note`, `.form__status` (`--ok`/`--error`), `.form__trap` (honeypot, `.sr-only` + `tabindex="-1"` + `autocomplete="off"`), `.form__step` (`.form__step-track`, `.form__step-current`).

Inputs are visually label-less but every field keeps a real `<label for>`. Required fields: `required` + `aria-required="true"`. Errors: `aria-describedby` → `.form__error`, `aria-invalid="true"`. Group in `<fieldset>` + `.form__legend`. Status region `role="status" aria-live="polite"`.

> **Security:** a static host cannot process submissions. The endpoint is unresolved — see `../../00_PLAN/04_CONVERSION_SPEC.md`. Ship with server-side validation, rate limiting and HTTPS-only POST. The honeypot is not sufficient on its own.

### Utilities
`.eyebrow` (`--rule` adds a leading hairline) — micro-caps, wraps **all** metadata. `.spec` / `.spec--boxed` / `.mono` — all engineering data. `.reveal` / `.reveal--stagger` — JS adds `.is-visible`; final state must be legible without JS. `.progress-bar` › `.progress-bar__fill` — `aria-hidden`.

### `.footer`
`.footer__grid` › `.footer__col` × 4 (`.footer__brand`, `.footer__blurb`, `.footer__address`, `.footer__heading`, `.footer__list`, `.footer__link`) + `.footer__legal` (`.footer__legal-links`). Carries the NAP block, GST `29AAKCS6443A1ZB`, ISO 9001 PDF link, response-time commitment. The NAP string is byte-identical everywhere on the site.

## 5. JavaScript contract

One file, `assets/js/site.js`, `defer`. It only toggles the names below — no markup generation, and every component must be usable without it.

| Behaviour | Target | Toggles |
|---|---|---|
| Scroll progress | `.progress-bar__fill` | inline `transform: scaleX()` |
| Nav shrink | `.nav` | `.is-scrolled` past 40px |
| Mobile menu | `.nav__toggle`, `.nav__overlay` | `aria-expanded`, `hidden`, `.is-open`, focus trap, Esc to close |
| Accordion | `.index-row__trigger`, `.index-row__panel` | `aria-expanded`, `hidden`, `.is-open` on `.index-row` |
| Reveal | `.reveal` | `.is-visible` via IntersectionObserver, threshold 0.12 |
| Stat count-up | `.stat__value` | text content, once, from `data-count-to` |
| Table filter | `[data-filter]` triggers, `[data-region]`/`[data-tier]` rows | `aria-pressed`, `.filter-hide` |
| Form steps | `.form__step-current`, `.form__group` | step text, group visibility |

All of it sits behind `prefers-reduced-motion`: reveals and counters resolve instantly to final state.

## 6. Rules builders must not break

1. Copper appears **≤3 times per viewport**. One primary CTA.
2. Hairlines only. **Zero shadows** between sections.
3. Radii ≤4px. No gradients on UI surfaces.
4. Never `#FFFFFF` — `--color-white` is `#FCFBF8`.
5. **≤3 type sizes visible per viewport.**
6. Whitespace separates sections. **≤2 colour bands per page.**
7. **≥1 asymmetric column split per page.** Centred everything is the cheapest tell.
8. All metadata in `.eyebrow` micro-caps. All engineering data in `.spec` mono.
9. Hover ≤160ms and barely there.
10. **No ghost watermarks, no decorative type.** Revoked.
11. One `<h1>`; heading levels never skip.
12. Unique `<title>` and `<meta name="description">` on every page.
13. 360px → 1920px, no horizontal scroll.
14. Alt text carries capacity, span, industry.
15. Every claim traceable to `../../research/`. Unverifiable figures get `[CLIENT TO CONFIRM]`, never a guess.
