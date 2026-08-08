/* ==========================================================================
   SVIND v2 — site.js
   One file, vanilla ES2020, no dependencies, loaded with `defer`.
   Implements exactly the behaviours in COMPONENT_CONTRACT.md §5.
   Every module null-checks its targets: any component may be absent from a
   page, and every component must remain usable with JavaScript disabled.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     SHARED HELPERS
     Reduced-motion state, rAF throttling, debounce, focus queries.
     ------------------------------------------------------------------------ */

  var MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  var motionMedia = window.matchMedia ? window.matchMedia(MOTION_QUERY) : null;
  var motionListeners = [];

  function reduceMotion() {
    return !!(motionMedia && motionMedia.matches);
  }

  function onMotionChange(fn) {
    motionListeners.push(fn);
  }

  if (motionMedia) {
    var motionHandler = function () {
      for (var i = 0; i < motionListeners.length; i += 1) {
        try {
          motionListeners[i](reduceMotion());
        } catch (err) {
          /* one broken subscriber must not stop the others */
        }
      }
    };
    if (typeof motionMedia.addEventListener === 'function') {
      motionMedia.addEventListener('change', motionHandler);
    } else if (typeof motionMedia.addListener === 'function') {
      motionMedia.addListener(motionHandler);
    }
  }

  // rAF-coalesced callback: many events collapse into one frame of work.
  function rafThrottle(fn) {
    var scheduled = false;
    return function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        fn();
      });
    };
  }

  // Trailing-edge debounce for resize work that is expensive to repeat.
  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var self = this;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        timer = null;
        fn.apply(self, args);
      }, wait);
    };
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  var FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function focusable(scope) {
    return qsa(FOCUSABLE, scope).filter(function (el) {
      if (el.hasAttribute('hidden')) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    });
  }

  function panelFor(trigger) {
    var id = trigger.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }

  /* ------------------------------------------------------------------------
     1. SCROLL PROGRESS + 2. NAV SHRINK
     Single passive scroll listener, rAF throttled, shared by both readouts.
     ------------------------------------------------------------------------ */

  function initScrollEffects() {
    var fill = document.querySelector('.progress-bar__fill');
    var nav = document.querySelector('.nav');
    if (!fill && !nav) return;

    var NAV_SHRINK_AT = 40;
    var wasScrolled = null;

    function measure() {
      var doc = document.documentElement;
      var top = window.pageYOffset || doc.scrollTop || 0;

      if (fill) {
        var travel = (doc.scrollHeight || 0) - window.innerHeight;
        var ratio = travel > 0 ? top / travel : 0;
        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;
        fill.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      }

      if (nav) {
        var scrolled = top > NAV_SHRINK_AT;
        if (scrolled !== wasScrolled) {
          nav.classList.toggle('is-scrolled', scrolled);
          wasScrolled = scrolled;
        }
      }
    }

    var onScroll = rafThrottle(measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', debounce(measure, 120), { passive: true });
    measure();
  }

  /* ------------------------------------------------------------------------
     3. MOBILE MENU
     .nav__toggle drives .nav__overlay: aria-expanded, hidden, .is-open,
     real focus trap, Escape to close, body scroll lock.
     ------------------------------------------------------------------------ */

  var menu = null;

  function initMobileMenu() {
    var toggle = document.querySelector('.nav__toggle');
    if (!toggle) return;
    var overlay = panelFor(toggle) || document.querySelector('.nav__overlay');
    if (!overlay) return;

    var openLabel = toggle.getAttribute('data-label-open') || 'Open menu';
    var closeLabel = toggle.getAttribute('data-label-close') || 'Close menu';
    var hideTimer = null;
    var isOpen = false;

    function open() {
      if (isOpen) return;
      isOpen = true;
      if (hideTimer) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
      overlay.hidden = false;
      // force a reflow so the opening transition runs from its start state
      void overlay.offsetHeight;
      overlay.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', closeLabel);
      document.body.classList.add('is-locked');
      var first = focusable(overlay)[0];
      if (first) first.focus();
      document.addEventListener('keydown', onKeydown, true);
    }

    function close(returnFocus) {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', openLabel);
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKeydown, true);
      var delay = reduceMotion() ? 0 : 300;
      hideTimer = window.setTimeout(function () {
        hideTimer = null;
        if (!isOpen) overlay.hidden = true;
      }, delay);
      if (returnFocus !== false) toggle.focus();
    }

    function onKeydown(event) {
      if (!isOpen) return;
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== 'Tab') return;

      var items = focusable(overlay);
      if (!items.length) {
        event.preventDefault();
        toggle.focus();
        return;
      }
      var first = items[0];
      var last = items[items.length - 1];
      var active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === toggle || !overlay.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !overlay.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    toggle.addEventListener('click', function () {
      if (isOpen) close(true);
      else open();
    });

    // In-overlay navigation closes the menu; focus follows the destination.
    overlay.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a[href]') : null;
      if (link && overlay.contains(link)) close(false);
    });

    // Crossing into the desktop layout drops the overlay entirely.
    window.addEventListener('resize', debounce(function () {
      if (isOpen && window.innerWidth >= 1024) close(false);
    }, 150), { passive: true });

    // Initial state: collapsed, and never left half-open by a cached page.
    overlay.hidden = true;
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');

    menu = { open: open, close: close, isOpen: function () { return isOpen; } };
  }

  /* ------------------------------------------------------------------------
     4. ACCORDION
     .index-row__trigger toggles its aria-controls panel. Rows are
     independent. Panels ship readable without JS and are collapsed here.
     ------------------------------------------------------------------------ */

  function initAccordion() {
    var triggers = qsa('.index-row__trigger');
    if (!triggers.length) return;

    triggers.forEach(function (trigger) {
      var panel = panelFor(trigger);
      if (!panel) return;
      var row = trigger.closest('.index-row');
      var startOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Collapse on init (no-JS readers get the panels open in markup).
      setState(startOpen);

      function setState(expand) {
        trigger.setAttribute('aria-expanded', expand ? 'true' : 'false');
        panel.hidden = !expand;
        if (row) row.classList.toggle('is-open', expand);
      }

      // Real <button> elements: Enter/Space arrive as click, so no keydown
      // handler is added and native keyboard support stays intact.
      trigger.addEventListener('click', function () {
        setState(trigger.getAttribute('aria-expanded') !== 'true');
      });
    });
  }

  /* ------------------------------------------------------------------------
     4b. HERO LOCKUP
     The hero lockup's title and <h1> rise on load. Everything else about the
     section -- the letter run, the circular CTA and its hover/focus open -- is
     CSS only, so this module owns nothing but the entrance.

     ARMED, NOT PARKED BY DEFAULT, for the same reason as the footer wordmark:
     the finished state is the CSS default, and .is-armed is added here only on
     the path that also adds .is-in a frame later. If this file 404s, throws
     earlier in boot() or is blocked, the hero reads as finished copy rather
     than an empty band. Verified by loading index.html with the <script> tag
     stripped.

     Under reduced motion nothing is armed at all -- .dna-lockup--static is
     added instead, which is the same finished state with the transitions
     removed, so a mid-visit switch to reduce cannot leave a half-played rise.
     ------------------------------------------------------------------------ */

  /* ------------------------------------------------------------------------
     4c. SITE LOADER — ARRODZ-style opening plate (SVIND)
     Full-bleed navy curtain with SVIND knockout that rises on first load,
     then slides up. Mirrors arrodz.com home-loader: localStorage 1h skip,
     reduced-motion respects + curtain uses the same ease as hero.
     Also owns the D pill auto-open (your 1 → 3 sec note: D closed circle
     expands to pill with label+arrow after loader + hero have settled).
     ------------------------------------------------------------------------ */

  function initSiteLoader() {
    var loader = document.getElementById('site-loader');
    if (!loader) return null;

    var STORAGE_KEY = 'hasSeenSVINDLoader';
    var SKIP_MS = 3600000; // 1h, same as arrodz hasSeenHeroLoader
    var now = Date.now();

    function shouldSkip() {
      if (reduceMotion()) return true;
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw && (now - parseInt(raw, 10) < SKIP_MS)) return true;
      } catch (e) {}
      return false;
    }

    if (shouldSkip()) {
      try { document.documentElement.classList.add('user-has-visited'); } catch (e) {}
      loader.classList.add('site-loader--hidden');
      loader.setAttribute('aria-hidden', 'true');
      // D now shows GIF by default, expands only on hover — no auto
      return loader;
    }

    // Prevent background scroll while curtain is up (matches arrodz behaviour)
    var prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    // Two frames so translateY(110%) has a start value to transition from
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        loader.classList.add('is-in');
      });
    });

    // After letters have risen (~700ms + stagger) + tag (~480ms), hold briefly then exit
    var EXIT_DELAY = 2200;
    window.setTimeout(function () {
      loader.classList.add('is-exit');
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (e) {}
      var onEnd = function (ev) {
        if (ev && ev.target !== loader) return;
        loader.removeEventListener('transitionend', onEnd);
        loader.classList.add('site-loader--hidden');
        document.documentElement.style.overflow = prevOverflow || '';
      };
      loader.addEventListener('transitionend', onEnd);
      // fallback if transitionend never fires (e.g. tab hidden)
      window.setTimeout(function () {
        loader.classList.add('site-loader--hidden');
        document.documentElement.style.overflow = prevOverflow || '';
      }, 900);
    }, EXIT_DELAY);

    onMotionChange(function (reduced) {
      if (reduced) {
        loader.classList.add('site-loader--hidden');
        document.documentElement.style.overflow = prevOverflow || '';
      }
    });

    return loader;
  }

  function scheduleDOpen(delayMs) {
    var lockup = document.querySelector('.dna-lockup');
    if (!lockup) return;
    var cta = lockup.querySelector('.dna-lockup__cta');
    if (!cta) return;
    if (reduceMotion()) return;

    // Don't re-arm if already open via hover
    window.setTimeout(function () {
      // only auto-open if user hasn't already hovered/focused it
      if (cta.matches(':hover') || cta.matches(':focus-visible') || lockup.classList.contains('is-cta-open')) return;
      lockup.classList.add('is-cta-open');
      // keep accessible: aria-expanded not needed as CTA is link, but announce via live label is already in name
    }, delayMs);

    // Close on first user interaction if they want it shut (optional: keep open — comment next 3 lines to keep sticky)
    // cta.addEventListener('mouseleave', function handler() {
    //   cta.removeEventListener('mouseleave', handler);
    // });
  }

  function initHeroLockup() {
    var lockup = document.querySelector('.dna-lockup');
    if (!lockup) return;

    function settle() {
      lockup.classList.remove('is-armed', 'is-in');
      lockup.classList.add('dna-lockup--static');
    }

    if (reduceMotion()) {
      settle();
      return;
    }

    /* Two frames, not one: the class that parks the elements and the class
       that releases them have to land in separate frames or the browser
       collapses them into a single style resolution and there is no start
       value to transition from. */
    lockup.classList.add('is-armed');
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        lockup.classList.add('is-in');
      });
    });

    // If loader is hidden/skipped, D should still auto-open after hero rise — 5s as requested
    // D GIF plays by default, expands only on cursor — no auto schedule
    var loaderEl = document.getElementById('site-loader');
    void loaderEl;

    onMotionChange(function (reduced) {
      if (reduced) settle();
    });
  }

  /* ------------------------------------------------------------------------
     5. REVEAL
     IntersectionObserver adds .is-visible once; stagger children get a
     capped incremental transition-delay.
     ------------------------------------------------------------------------ */

  var STAGGER_STEP = 80;
  var STAGGER_CAP = 400;

  function stagger(el) {
    if (!el.classList.contains('reveal--stagger')) return;
    var kids = Array.prototype.slice.call(el.children);
    kids.forEach(function (kid, i) {
      var delay = Math.min(i * STAGGER_STEP, STAGGER_CAP);
      kid.style.transitionDelay = delay + 'ms';
    });
  }

  function clearStagger(el) {
    Array.prototype.slice.call(el.children).forEach(function (kid) {
      kid.style.transitionDelay = '';
    });
  }

  /* Both footer entrances are parked by .is-armed and released by .is-visible:
     the wordmark's letters sit below their crop, the closing band sits at
     opacity 0 and 30px down.

     Arming has to happen here rather than in the stylesheet. If this file
     never runs, both must already be in their finished state -- otherwise the
     page ends on an empty band and about 450px of blank ink where the heading,
     CTA and partners should be. So the CSS default is the finished state and
     the motion is switched on only once we know we are the ones who will
     finish it. Nothing else in the reveal set needs this, because plain
     .reveal is only ever a fade the observer is certain to clear. */
  function armFooterEntrance() {
    qsa('.footer__mark, .footer__close').forEach(function (el) {
      el.classList.add('is-armed');
    });
  }

  /* ------------------------------------------------------------------------
     5b. FOOTER PIN
     .footer--pinned leaves the flow, so the page has to reserve its height as
     trailing space or the document shortens by exactly one footer and the last
     section can never travel far enough to uncover it. The height is a
     measurement, not a constant -- it moves with viewport width (896px at
     1280, 840px at 390) and with the wordmark's clamped type -- so it is
     measured here and published as --footer-h for the CSS to consume.

     Nothing here animates. The pin is a layout, and the reveal is the page's
     own scroll travelling over it, which is why none of this is behind a
     reduced-motion check.
     ------------------------------------------------------------------------ */

  // Matches the .mobile-bar breakpoint in components.css: below this the bar
  // owns the bottom edge of the viewport and the footer cannot pin to it.
  var PIN_MAX_WIDTH = 767.98;

  function footerIsPinned(footer) {
    return getComputedStyle(footer).position === 'fixed';
  }

  function initFooterPin() {
    var footer = document.querySelector('.footer--pinned');
    if (!footer) return null;

    var root = document.documentElement;
    var lastH = null;
    var lastFits = null;

    function measure() {
      /* Measure UNPINNED. While the footer is fixed its own height is
         independent of the reserve, so reading it in place is safe -- but on
         the first pass the class is not applied yet and this is the flow
         height either way. offsetHeight rounds to an integer, which is what
         the margin wants: a fractional reserve leaves a sub-pixel seam of page
         showing under the footer. */
      var h = footer.offsetHeight;
      if (h !== lastH) {
        lastH = h;
        root.style.setProperty('--footer-h', h + 'px');
      }

      /* Two conditions, both measured, both explained in the FOOTER REVEAL
         comment in components.css:

         1. The whole footer must fit the viewport. A fixed element taller than
            the viewport keeps its overflow permanently off-screen, so
            .footer__baseline would be unreachable at every scroll position.
         2. Not under 768px, where .mobile-bar is fixed to the same bottom edge
            at z-index 300 and would cover the footer's last 56px. Clearing it
            with padding costs 56px the phone does not have -- 840px of footer
            becomes 896 and stops fitting 844. */
      var ok = h <= window.innerHeight && window.innerWidth > PIN_MAX_WIDTH;
      if (ok === lastFits) return;
      lastFits = ok;
      footer.classList.toggle('footer--pinned-active', ok);
      root.classList.toggle('has-pinned-footer', ok);
    }

    measure();

    /* Width changes reflow the footer and height changes move the fits
       threshold, so both need the resize. ResizeObserver catches what resize
       does not: fonts landing late, the wordmark's clamp restepping, an image
       settling. Both funnel through the same idempotent measure(). */
    window.addEventListener('resize', debounce(measure, 120), { passive: true });

    if ('ResizeObserver' in window) {
      new ResizeObserver(rafThrottle(measure)).observe(footer);
    }

    return footer;
  }

  /* ------------------------------------------------------------------------
     5b. ABOUT PIN — pinned photograph + headline travelling on the x axis

     The arrodz .about-home-section. The source pins with position: sticky and
     drives the headline with GSAP ScrollTrigger (scrub: 1, x resolved to
     -(scrollWidth - innerWidth) at refresh). Neither is available here:

       - position: sticky IS DEAD ON THIS PAGE. base.css sets overflow-x:
         hidden on both html and body, which makes body a scroll container, so
         a sticky element resolves against a scrollport that never scrolls.
         Measured: a probe with top:0, scrolled 800px past its host's top edge,
         reports getBoundingClientRect().top === -800 where a working sticky
         reports 0. (Same root cause as .nav not sticking. Unrelated and left
         alone. If that is ever fixed with overflow-x: clip, this still works —
         the stage's `position` is owned here outright and sticky is never
         consulted.)
       - No GSAP, so the travel distance is measured and written as a custom
         property, and the transform itself stays in CSS on the compositor.

     WHY THE PIN IS NOT position: sticky EVEN IF IT WORKED: the pin has to be
     conditional on viewport height and on reduced motion, and the second of
     those cannot be expressed in CSS alone without duplicating the decision.

     Not applied at all when reduced motion is set. This is scroll-coupled
     motion of a full-viewport image, which is the kind that makes people ill —
     so it is skipped rather than shortened, and abt.css carries the same
     decision in a media query so neither half can apply alone.
     ------------------------------------------------------------------------ */

  // Below this the pin is skipped: a fixed 100vh stage on a phone eats the
  // whole screen, and the travel would be longer than the copy that follows.
  var ABT_MIN_WIDTH = 768;
  // A pinned 100vh stage needs somewhere to put the headline. Under this the
  // frame is too short to hold the display line and the photo at once.
  var ABT_MIN_HEIGHT = 520;

  function initAboutPin() {
    var section = document.querySelector('.abt');
    if (!section) return;

    var stage = section.querySelector('.abt__stage');
    var runway = section.querySelector('.abt__runway');
    var line = section.querySelector('.abt__line');
    if (!stage || !runway || !line) return;

    var pinned = false;
    var travel = 0;

    /* Undo everything measure() applies. Called when the section stops
       qualifying (viewport too small, reduced motion switched on mid-visit) so
       it can never be left half-pinned: a stage still fixed with no reserved
       height under it, or a runway reserving scroll for motion that no longer
       happens. Every property written below is removed here. */
    function unpin() {
      pinned = false;
      /* Drops white-space: nowrap along with the pin, so the fallback is a
         wrapped, fully legible heading rather than a single row truncated at
         the viewport edge -- see the .abt__line comment in abt.css. */
      section.classList.remove('abt--live');
      stage.classList.remove('abt__stage--fixed', 'abt__stage--parked');
      runway.style.minHeight = '';
      section.style.removeProperty('--abt-travel');
      section.style.removeProperty('--abt-progress');
    }

    function qualifies() {
      return !reduceMotion() &&
        window.innerWidth >= ABT_MIN_WIDTH &&
        window.innerHeight >= ABT_MIN_HEIGHT;
    }

    /* Per-frame state. Three cases, and the two boundaries are the whole
       reason this is not a single lerp: the stage is fixed only WHILE the
       section is crossing the viewport. Before that it is in flow at the top of
       the section; after, it is parked at the runway's bottom edge. Skipping
       either boundary leaves the photo floating over the sections next to it.

       Declared ABOVE measure() on purpose: measure() calls it on its last line
       to paint the first frame, and `var update` would still be undefined at
       that point if this sat below. */
    var update = rafThrottle(function () {
      if (!pinned) return;

      var runwayBox = runway.getBoundingClientRect();

      /* Progress is measured off the RUNWAY, not the section: the section also
         contains the copy block, and including it would keep the line moving
         for a screenful after the photo has gone. 0 when the runway's top
         edge reaches the viewport top, 1 when its bottom edge does. */
      var span = runwayBox.height - window.innerHeight;
      var travelled = span > 0 ? (-runwayBox.top) / span : 0;
      var progress = Math.min(1, Math.max(0, travelled));
      section.style.setProperty('--abt-progress', String(progress));

      /* Both boundaries come off the RUNWAY, which is the element that holds the
         pin's flow height -- not off the section, whose top edge is the same
         thing only until the copy block below changes height.

         Fixed from the moment the runway's top edge reaches the viewport top
         until its bottom edge does. Before: in flow. After: parked at the
         runway's end, so the photo stops there instead of following the copy
         down the page. */
      var before = runwayBox.top > 0;
      var after = runwayBox.bottom <= window.innerHeight;

      stage.classList.toggle('abt__stage--fixed', !before && !after);
      stage.classList.toggle('abt__stage--parked', after);
    });

    /* Measures the two numbers the effect needs and reserves the scroll for it.

       TRAVEL is the source's -(scrollWidth - innerWidth): how far the line must
       move for its last glyph to reach the right edge. scrollWidth is the
       full unclipped width of the nowrap line; the padding on .abt__line-wrap
       is what the line starts inset by, so it is added back or the line stops
       a padding short of the edge. Clamped at 0 — a line shorter than the
       viewport has nowhere to travel and must not move backwards.

       RUNWAY HEIGHT is one viewport plus the travel: the viewport is the frame
       the pin occupies, the travel is how much scrolling the line needs to
       cross it. So progress reaches exactly 1 on the same frame the pin hands
       off, at any width. The source hardcodes 300vh for this; a constant either
       strands the line mid-travel on a narrow viewport or leaves dead scroll
       after it has finished on a wide one.

       The height goes on the runway rather than the stage because the stage
       leaves flow when it pins -- see the wrapper comment in abt.css. */
    function measure() {
      if (!qualifies()) {
        if (pinned) unpin();
        return;
      }

      /* BEFORE measuring, not after: .abt--live is what applies
         white-space: nowrap, and scrollWidth on a wrapped line is just the
         container width -- it would report a travel of 0 and the line would
         never move. Setting the class first forces the single-row layout that
         the next read measures. */
      section.classList.add('abt--live');

      var pad = parseFloat(getComputedStyle(line.parentElement).paddingInlineStart) || 0;
      travel = Math.max(0, line.scrollWidth + pad * 2 - window.innerWidth);

      section.style.setProperty('--abt-travel', travel + 'px');
      runway.style.minHeight = (window.innerHeight + travel) + 'px';

      pinned = true;
      update();
    }

    measure();

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', debounce(measure, 120), { passive: true });

    /* Catches what resize does not: the display face landing late and
       restepping the clamp, which changes scrollWidth and therefore the travel
       and the runway together. */
    if ('ResizeObserver' in window) {
      new ResizeObserver(debounce(measure, 120)).observe(line);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }

    /* Mid-visit reduced-motion switch. qualifies() already gates on it, so
       measure() does the right thing in both directions: unpins when it goes
       on, re-measures and re-pins when it goes off. */
    onMotionChange(measure);
  }

  /* The closing band and the wordmark are ONE entrance, not two.

     The source runs both from a single GSAP timeline pinned to
     `body bottom-=200`, so its links and its letters start together. Left to
     the generic observer below they would not: .footer__close sits about
     900px above .footer__mark, clears the 0.12 threshold long before the
     letters are anywhere near the viewport, and the band would have finished
     moving before the wordmark began. So both are pulled out of the per-item
     set and released together, off whichever of the two is seen first.

     Returns the elements it owns so initReveal can exclude them. */
  function initFooterEntrance(observerOptions, pinnedFooter) {
    var group = qsa('.footer__close.reveal').concat(qsa('.footer__mark.reveal'));
    if (!group.length) return group;

    function release() {
      group.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* Only reachable on the pinned path. The unpinned observer below never
       calls it -- a footer that scrolls in normally is gone from the viewport
       once it leaves, so re-parking it would be motion nobody can see, and the
       one-shot IO is still the right shape there. */
    function repark() {
      group.forEach(function (el) { el.classList.remove('is-visible'); });
    }

    /* A pinned footer is INSIDE the viewport from the first paint, so an
       IntersectionObserver on it reports isIntersecting immediately and the
       entrance would play at scroll 0, behind the page, and be over before
       anyone reached it. Measured at scroll 0 with the pin applied:
       .footer__close ratio 0.553, .footer__mark ratio 1.0 -- IO ignores
       occlusion, so both read as fully visible under an opaque page.

       So when pinned, the trigger is OCCLUSION rather than intersection. The
       page's own bottom edge is the thing doing the covering, so the test is
       how close that edge has come to the element being revealed.

       Measured against .footer__mark, not the footer's top edge. The footer is
       896px tall and the wordmark sits 509px down it, so a trigger on the
       footer's edge fires 591px of scrolling before the letters are uncovered
       -- they finish rising behind the page and arrive already static.
       Screenshotted at 1280x900 to confirm: 228px of footer showing, the
       entrance long since complete, nothing moving.

       TRIGGER_LEAD keeps the source's early start (`body bottom-=200`), now
       relative to the wordmark: the rise begins 200px before its top edge
       clears, so the letters are already in motion as they appear. */
    var main = document.querySelector('.page--footer-reserve');
    var revealTarget = document.querySelector('.footer__mark') || pinnedFooter;

    if (pinnedFooter && main && footerIsPinned(pinnedFooter)) {
      var TRIGGER_LEAD = 200;
      var shown = false;
      var handedBack = false;

      /* REPLAYS, unlike every other reveal on the page.
         A pinned footer is not consumed by being passed: it stays at the bottom
         edge for the whole visit, and scrolling back up covers it again rather
         than leaving it behind. So the letters go home when it is uncovered and
         return under the crop when it is covered, and the entrance plays again
         on the next approach -- which is what the reference does. One-shot
         reveals stay one-shot; see repark() above for why this is the only
         group that gets it.

         THE RE-PARK POINT IS NOT THE RELEASE POINT. Reset while any part of the
         wordmark is on screen and the letters visibly snap down, so the trigger
         is asymmetric: release when the page's edge comes within TRIGGER_LEAD
         of the wordmark's TOP, re-park only once it has passed the wordmark's
         BOTTOM and the whole band is hidden again. Both edges are measured, so
         the gap scales with the type instead of being a guessed constant -- at
         1280 the band is 340px, so the two thresholds sit ~540px of scroll
         apart and nothing near the boundary can oscillate. */
      var check = rafThrottle(function () {
        if (handedBack) return;
        /* If the viewport shrinks below the pin threshold mid-visit the footer
           goes static and this trigger no longer describes anything; hand back
           to the ordinary case by releasing for good, so the band cannot be
           stranded parked with nothing left to un-park it. */
        if (!footerIsPinned(pinnedFooter)) {
          handedBack = true;
          shown = true;
          release();
          window.removeEventListener('scroll', check);
          return;
        }
        /* All three rects are viewport-relative. The footer is fixed, so the
           wordmark does not move; main's bottom rises through it as the page
           scrolls. */
        var covering = main.getBoundingClientRect().bottom;
        var box = revealTarget.getBoundingClientRect();

        if (!shown) {
          if (covering - box.top > TRIGGER_LEAD) return;
          shown = true;
          release();
          return;
        }

        if (covering < box.bottom) return;
        shown = false;
        repark();
      });

      window.addEventListener('scroll', check, { passive: true });
      window.addEventListener('resize', check, { passive: true });
      check(); // a reload lands mid-page restored to its old scroll position
      return group;
    }

    var trigger = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i += 1) {
        if (!entries[i].isIntersecting) continue;
        release();
        obs.disconnect();
        return;
      }
    }, observerOptions);

    group.forEach(function (el) { trigger.observe(el); });
    return group;
  }

  /* pinnedFooter is initFooterPin's return value, passed in rather than
     re-queried: the entrance trigger depends on whether the footer is pinned,
     and the pin must be measured before anything reads a rect off it. */
  function initReveal(pinnedFooter) {
    var items = qsa('.reveal');
    if (!items.length) return;

    /* Closes over every .reveal on the page, including the footer group that
       comes out of `observed` below -- the mid-visit reduced-motion switch has
       to finish all of them, not just the ones the per-item observer owns. */
    function showAll() {
      items.forEach(function (el) {
        clearStagger(el);
        el.classList.add('is-visible');
      });
    }

    if (reduceMotion() || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    armFooterEntrance();

    var observerOptions = { threshold: 0.12, rootMargin: '0px 0px -8% 0px' };

    /* Whatever the footer entrance drives is removed from the per-item set, or
       the observer below would race it and reveal the band on its own. */
    var footerGroup = initFooterEntrance(observerOptions, pinnedFooter);
    var observed = items.filter(function (el) { return footerGroup.indexOf(el) === -1; });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        stagger(el);
        el.classList.add('is-visible');
        obs.unobserve(el);
      });
    }, observerOptions);

    observed.forEach(function (el) { observer.observe(el); });

    onMotionChange(function (reduced) {
      if (!reduced) return;
      observer.disconnect();
      showAll();
    });
  }

  /* ------------------------------------------------------------------------
     6. STAT COUNT-UP
     .stat__value[data-count-to] animates once on entry; the original
     prefix/suffix in the text is preserved. Grouping via en-IN.
     ------------------------------------------------------------------------ */

  var COUNT_DURATION = 1100;

  function digitNode(el) {
    // Animate the text node holding the numeral so sibling markup such as
    // .stat__unit is never overwritten.
    for (var i = 0; i < el.childNodes.length; i += 1) {
      var node = el.childNodes[i];
      if (node.nodeType === 3 && /\d/.test(node.nodeValue)) return node;
    }
    return null;
  }

  function makeCounter(el) {
    var raw = (el.getAttribute('data-count-to') || '').trim();
    var target = parseFloat(raw.replace(/,/g, ''));
    if (!isFinite(target)) return null;

    var node = digitNode(el);
    var source = node ? node.nodeValue : el.textContent;
    var parts = /^([^\d\-+]*)([+\-]?[\d.,]*\d)(.*)$/.exec(source || '');
    var prefix = parts ? parts[1] : '';
    var suffix = parts ? parts[3] : '';
    var original = parts ? parts[2] : '';

    var dot = raw.indexOf('.');
    var decimals = dot === -1 ? 0 : raw.length - dot - 1;
    // Only group thousands when the authored text already did — keeps years
    // such as 1994 unformatted.
    var grouping = raw.indexOf(',') !== -1 || original.indexOf(',') !== -1;

    var format;
    if (window.Intl && typeof Intl.NumberFormat === 'function') {
      var nf = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouping
      });
      format = function (value) { return nf.format(value); };
    } else {
      format = function (value) { return value.toFixed(decimals); };
    }

    function paint(value) {
      var text = prefix + format(value) + suffix;
      if (node) node.nodeValue = text;
      else el.textContent = text;
    }

    var done = false;

    return {
      el: el,
      finish: function () {
        done = true;
        paint(target);
      },
      run: function () {
        if (done) return;
        done = true;
        if (reduceMotion()) {
          paint(target);
          return;
        }
        var start = 0;
        function frame(now) {
          if (!start) start = now;
          var t = Math.min((now - start) / COUNT_DURATION, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          paint(target * eased);
          if (t < 1) window.requestAnimationFrame(frame);
          else paint(target);
        }
        window.requestAnimationFrame(frame);
      }
    };
  }

  function initCounters() {
    var counters = qsa('.stat__value[data-count-to]')
      .map(makeCounter)
      .filter(Boolean);
    if (!counters.length) return;

    if (reduceMotion() || !('IntersectionObserver' in window)) {
      counters.forEach(function (c) { c.finish(); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        for (var i = 0; i < counters.length; i += 1) {
          if (counters[i].el === entry.target) counters[i].run();
        }
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });

    counters.forEach(function (c) { observer.observe(c.el); });

    onMotionChange(function (reduced) {
      if (!reduced) return;
      observer.disconnect();
      counters.forEach(function (c) { c.finish(); });
    });
  }

  /* ------------------------------------------------------------------------
     7. TABLE FILTER
     [data-filter] buttons show rows whose data-region / data-tier /
     data-threat matches; toggles aria-pressed and .filter-hide.
     ------------------------------------------------------------------------ */

  var ROW_KEYS = ['region', 'tier', 'threat'];
  var ROW_SELECTOR = '[data-region],[data-tier],[data-threat]';

  function normalise(value) {
    return (value || '').toLowerCase().trim();
  }

  function rowValues(row) {
    var out = [];
    ROW_KEYS.forEach(function (key) {
      var raw = row.getAttribute('data-' + key);
      if (!raw) return;
      raw.split(/[,\s]+/).forEach(function (token) {
        var v = normalise(token);
        if (v) out.push(v);
      });
    });
    return out;
  }

  function filterScope(trigger) {
    var targetId = trigger.getAttribute('data-filter-target');
    if (targetId) {
      var target = document.getElementById(targetId);
      if (target) return target;
    }
    var group = trigger.closest('[data-filter-group]');
    if (group) {
      var scoped = group.getAttribute('data-filter-group');
      if (scoped) {
        var byId = document.getElementById(scoped);
        if (byId) return byId;
      }
    }
    var band = trigger.closest('section, .band, form, main');
    return band || document;
  }

  function initFilters() {
    var triggers = qsa('[data-filter]');
    if (!triggers.length) return;

    // Group triggers by the region of the page they control.
    var groups = [];
    triggers.forEach(function (trigger) {
      var scope = filterScope(trigger);
      var entry = null;
      for (var i = 0; i < groups.length; i += 1) {
        if (groups[i].scope === scope) entry = groups[i];
      }
      if (!entry) {
        entry = { scope: scope, triggers: [] };
        groups.push(entry);
      }
      entry.triggers.push(trigger);
    });

    groups.forEach(function (group) {
      var scopeEl = group.scope === document ? document : group.scope;
      var rows = qsa(ROW_SELECTOR, scopeEl);
      if (!rows.length) return;
      var status = scopeEl.querySelector
        ? scopeEl.querySelector('[role="status"]')
        : null;
      if (!status) status = document.querySelector('[role="status"]');

      function apply(value) {
        var wanted = normalise(value);
        var all = wanted === 'all' || wanted === '';
        var shown = 0;

        rows.forEach(function (row) {
          var match = all || rowValues(row).indexOf(wanted) !== -1;
          row.classList.toggle('filter-hide', !match);
          if (match) shown += 1;
        });

        group.triggers.forEach(function (t) {
          var pressed = normalise(t.getAttribute('data-filter')) === wanted;
          t.setAttribute('aria-pressed', pressed ? 'true' : 'false');
        });

        if (status) {
          // textContent only: never innerHTML with page-derived values.
          status.textContent = shown === rows.length
            ? 'Showing all ' + rows.length + ' rows.'
            : 'Showing ' + shown + ' of ' + rows.length + ' rows.';
        }
      }

      group.triggers.forEach(function (trigger) {
        if (!trigger.hasAttribute('aria-pressed')) {
          trigger.setAttribute('aria-pressed', 'false');
        }
        trigger.addEventListener('click', function () {
          apply(trigger.getAttribute('data-filter'));
        });
      });

      // Honour a pre-pressed trigger; otherwise leave every row visible.
      var preset = null;
      group.triggers.forEach(function (t) {
        if (t.getAttribute('aria-pressed') === 'true') preset = t;
      });
      if (preset) apply(preset.getAttribute('data-filter'));
    });
  }

  /* ------------------------------------------------------------------------
     8. FORM STEPS
     Advances .form__group visibility, updates .form__step-current, and
     blocks progress on invalid required fields via checkValidity().
     ------------------------------------------------------------------------ */

  var PHONE_RE = /^(?:\+91|0)?[6-9]\d{9}$/;
  var FIELD_SELECTOR = 'input, select, textarea';

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function isPhoneField(field) {
    if (field.type === 'tel') return true;
    var name = (field.name || field.id || '').toLowerCase();
    return name.indexOf('phone') !== -1 || name.indexOf('mobile') !== -1;
  }

  function phoneOk(value) {
    return PHONE_RE.test(value.replace(/[\s\-().]/g, ''));
  }

  function fieldWrap(field) {
    return field.closest('.form__field') || field.parentElement;
  }

  function errorNode(field) {
    var wrap = fieldWrap(field);
    return wrap ? wrap.querySelector('.form__error') : null;
  }

  function clearError(field) {
    field.removeAttribute('aria-invalid');
    var wrap = fieldWrap(field);
    if (wrap) wrap.classList.remove('form__field--error');
    var node = errorNode(field);
    if (node) node.textContent = '';
  }

  function messageFor(field) {
    var v = field.validity;
    if (v.valueMissing) {
      return field.type === 'checkbox'
        ? 'Please confirm to continue.'
        : 'This field is required.';
    }
    if (v.typeMismatch && field.type === 'email') return 'Enter a valid email address.';
    if (v.typeMismatch && field.type === 'url') return 'Enter a valid URL.';
    if (v.tooShort) return 'Enter at least ' + field.minLength + ' characters.';
    if (v.tooLong) return 'Use at most ' + field.maxLength + ' characters.';
    if (v.rangeUnderflow) return 'Enter ' + field.min + ' or more.';
    if (v.rangeOverflow) return 'Enter ' + field.max + ' or less.';
    if (v.stepMismatch) return 'Enter a valid value.';
    if (v.patternMismatch) return field.title || 'Enter the value in the requested format.';
    return field.validationMessage || 'Check this field.';
  }

  function setError(field, message) {
    field.setAttribute('aria-invalid', 'true');
    var wrap = fieldWrap(field);
    if (wrap) wrap.classList.add('form__field--error');
    var node = errorNode(field);
    if (node) {
      node.textContent = message; // textContent only — no markup injection
      if (node.id) {
        var described = field.getAttribute('aria-describedby') || '';
        if (described.split(/\s+/).indexOf(node.id) === -1) {
          field.setAttribute('aria-describedby', (described + ' ' + node.id).trim());
        }
      }
    }
  }

  function validateField(field) {
    if (field.disabled || field.type === 'hidden') return true;
    if (field.closest('.form__trap')) return true; // honeypot is never validated

    var value = (field.value || '').trim();

    if (isPhoneField(field) && value) {
      if (!phoneOk(value)) {
        setError(field, 'Enter a 10-digit Indian mobile number, +91 optional.');
        return false;
      }
      clearError(field);
      return true;
    }

    if (typeof field.checkValidity === 'function' && !field.checkValidity()) {
      setError(field, messageFor(field));
      return false;
    }

    clearError(field);
    return true;
  }

  function validateGroup(group) {
    var fields = qsa(FIELD_SELECTOR, group);
    var firstBad = null;
    fields.forEach(function (field) {
      if (!validateField(field) && !firstBad) firstBad = field;
    });
    return firstBad;
  }

  function initFormSteps() {
    qsa('.form').forEach(function (form) {
      var groups = qsa('.form__group', form);
      if (groups.length < 2) return;

      var stepBox = form.querySelector('.form__step');
      var current = form.querySelector('.form__step-current');
      var index = 0;

      function render() {
        groups.forEach(function (group, i) {
          group.hidden = i !== index;
        });
        if (current) current.textContent = pad(index + 1);
        if (stepBox) {
          var pct = ((index + 1) / groups.length) * 100;
          stepBox.style.setProperty('--step-progress', pct.toFixed(2) + '%');
        }
        qsa('[data-form-prev]', form).forEach(function (btn) {
          btn.disabled = index === 0;
        });
      }

      function goto(next, announce) {
        if (next < 0 || next >= groups.length) return;
        index = next;
        render();
        var target = groups[index].querySelector(FIELD_SELECTOR)
          || groups[index].querySelector('.form__legend')
          || groups[index];
        if (target.tabIndex < 0 && !/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(target.tagName)) {
          target.setAttribute('tabindex', '-1');
        }
        if (announce !== false && typeof target.focus === 'function') {
          target.focus({ preventScroll: false });
        }
      }

      qsa('[data-form-next]', form).forEach(function (btn) {
        btn.addEventListener('click', function (event) {
          event.preventDefault();
          var bad = validateGroup(groups[index]);
          if (bad) {
            if (typeof bad.focus === 'function') bad.focus();
            return;
          }
          goto(index + 1, true);
        });
      });

      qsa('[data-form-prev]', form).forEach(function (btn) {
        btn.addEventListener('click', function (event) {
          event.preventDefault();
          goto(index - 1, true);
        });
      });

      // Live error clearing: an error state never outlives the fix.
      form.addEventListener('input', function (event) {
        var field = event.target;
        if (!field.matches || !field.matches(FIELD_SELECTOR)) return;
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
      });

      // Final gate: a hidden invalid group must surface, not silently pass.
      form.addEventListener('submit', function (event) {
        for (var i = 0; i < groups.length; i += 1) {
          var wasHidden = groups[i].hidden;
          groups[i].hidden = false;
          var bad = validateGroup(groups[i]);
          groups[i].hidden = wasHidden;
          if (bad) {
            event.preventDefault();
            goto(i, false);
            if (typeof bad.focus === 'function') bad.focus();
            return;
          }
        }
      });

      render();
    });
  }

  /* ------------------------------------------------------------------------
     PARTNER TESTIMONIALS · .mpz
     Arrows and pagination for the native scroll-snap rail. The SCROLLING
     itself is the browser's -- drag, flick, trackpad, shift-wheel and arrow
     keys all come from `overflow-x: auto` and need no JS. This only adds the
     two affordances a scroll container has no native equivalent for: paged
     arrows and a dot rail that reports position.

     Nothing here is required for the section to be usable. With JS off the
     rail still scrolls and snaps; the arrows stay hidden (mpz.css gates them
     behind .mpz--live) and the dots stay empty, because a control with no
     controller is a lie about what is clickable.
     ------------------------------------------------------------------------ */

  function initTestimonials() {
    var section = document.querySelector('.mpz');
    if (!section) return;

    var track = section.querySelector('.mpz__track');
    var dots = section.querySelector('.mpz__dots');
    var prev = section.querySelector('.mpz__arrow--prev');
    var next = section.querySelector('.mpz__arrow--next');
    var slides = qsa('.mpz__slide', section);
    if (!track || !slides.length) return;

    var pages = [];

    /* Reads the LIVE slide geometry rather than re-deriving the CSS
       breakpoints in JS. Two sources of truth for slides-per-view would
       drift the moment either side changes; measuring cannot. */
    function perView() {
      var slideWidth = slides[0].getBoundingClientRect().width;
      if (slideWidth <= 0) return 1;
      var cs = getComputedStyle(track);
      var gap = parseFloat(cs.columnGap) || 0;
      /* CONTENT width, not clientWidth: clientWidth includes the track's
         inline padding (the bleed offset), which at a 50px shoulder inflates
         the ratio by a quarter of a slide and can round the count up a whole
         slide. The slides are laid out in the content box, so that is what
         they have to be counted against. */
      var inner = track.clientWidth
        - (parseFloat(cs.paddingInlineStart) || 0)
        - (parseFloat(cs.paddingInlineEnd) || 0);
      /* +1 gap on both sides of the division: n slides carry (n - 1) gaps,
         so adding one gap to each term makes the ratio come out whole
         instead of landing just under and flooring down a slide. */
      var n = Math.round((inner + gap) / (slideWidth + gap));
      return Math.min(slides.length, Math.max(1, n));
    }

    /* Pages are keyed by scrollLeft, not by index: scroll-snap works in
       pixels, and the last page is CLAMPED to maxScroll. Without the clamp a
       6-slide / 3-up rail reports two pages but the second can never be
       reached exactly -- scrollLeft stops at maxScroll while the target sits
       past it, so the dot never lights and the next arrow looks broken. */
    function buildPages() {
      var n = perView();
      var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      var count = Math.max(1, Math.ceil(slides.length / n));
      var offsets = [];
      var trackRect = track.getBoundingClientRect();
      var here = track.scrollLeft;
      /* Subtracted, not ignored: the track sets scroll-padding-inline-start so
         a snapped slide sits on the text column rather than the viewport edge.
         Omitting it puts every target one shoulder (50px at full width) past
         where snap will actually settle -- close enough that snap corrects it
         and the rail still looks right, but currentPage() then compares live
         scrollLeft against targets it can never equal. */
      var snapPad = parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0;

      for (var i = 0; i < count; i += 1) {
        var slide = slides[Math.min(slides.length - 1, i * n)];
        /* Delta from the CURRENT scroll position, so this is correct whatever
           the rail happens to be scrolled to when a resize re-measures it. */
        var target = here + (slide.getBoundingClientRect().left - trackRect.left) - snapPad;
        offsets.push(Math.min(Math.max(0, Math.round(target)), Math.round(maxScroll)));
      }

      /* Two pages whose clamped offsets collapse onto the same pixel are one
         page. Dedupe, or the rail shows a dot that can never become current. */
      pages = offsets.filter(function (value, i) {
        return i === 0 || value !== offsets[i - 1];
      });
    }

    function currentPage() {
      var here = track.scrollLeft;
      var best = 0;
      var bestGap = Infinity;
      for (var i = 0; i < pages.length; i += 1) {
        var gap = Math.abs(pages[i] - here);
        if (gap < bestGap) { bestGap = gap; best = i; }
      }
      return best;
    }

    function goTo(index) {
      if (!pages.length) return;
      /* Wraps both ways. The source runs Splide with `rewind: true`, whose
         arrows wrap rather than travel onward, so this matches the reference
         at the only point a visitor can tell the difference. */
      var wrapped = (index + pages.length) % pages.length;
      track.scrollTo({
        left: pages[wrapped],
        /* CSS scroll-behavior does NOT govern a scripted scroll that names
           its own behavior, so reduced motion has to be honoured here too --
           the media query in mpz.css alone would not cover this path. */
        behavior: reduceMotion() ? 'auto' : 'smooth'
      });
    }

    function renderDots() {
      if (!dots) return;
      dots.textContent = '';
      if (pages.length < 2) return;   // one page needs no pagination

      pages.forEach(function (offset, i) {
        var li = document.createElement('li');
        li.setAttribute('role', 'presentation');
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'mpz__dot';
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-label', 'Go to testimonial page ' + (i + 1));
        button.addEventListener('click', function () { goTo(i); });
        li.appendChild(button);
        dots.appendChild(li);
      });
      syncDots();
    }

    function syncDots() {
      if (!dots) return;
      var buttons = qsa('.mpz__dot', dots);
      var active = currentPage();
      buttons.forEach(function (button, i) {
        var isActive = i === active;
        button.setAttribute('aria-current', isActive ? 'true' : 'false');
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        /* Roving tabindex: the dot rail is one tab stop, not N. Arrow keys
           inside a tablist are the expected way to move between tabs. */
        button.tabIndex = isActive ? 0 : -1;
      });
    }

    function measure() {
      buildPages();
      renderDots();
    }

    measure();
    section.classList.add('mpz--live');   // reveals the arrows

    if (prev) prev.addEventListener('click', function () { goTo(currentPage() - 1); });
    if (next) next.addEventListener('click', function () { goTo(currentPage() + 1); });

    track.addEventListener('scroll', rafThrottle(syncDots), { passive: true });
    window.addEventListener('resize', debounce(measure, 120), { passive: true });

    /* Slide heights and widths settle after webfont swap; a rail measured
       against fallback metrics can be a slide out by the time Inter lands. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }

  /* ------------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------------ */

  function boot() {
    initScrollEffects();
    initMobileMenu();
    initAccordion();
    /* Loader first: needs to arm before hero so the curtain owns the first
       ~2.2s and the hero rise is not competing for the first frame. */
    initSiteLoader();
    /* Before initReveal: the hero entrance runs on load rather than on scroll,
       so it must be armed before the observer starts revealing anything below
       it -- otherwise a restored mid-page scroll position can fire the reveals
       while the hero is still unarmed. */
    initHeroLockup();
    /* Before initReveal: the reserve has to exist before the entrance measures
       anything against it, and initReveal's trigger needs to know whether the
       footer ended up pinned. */
    initReveal(initFooterPin());
    initAboutPin();
    initTestimonials();
    initCounters();
    initFilters();
    initFormSteps();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // Single global. Nothing else is exported.
  window.SVIND = {
    version: '2.0.0',
    reducedMotion: reduceMotion,
    closeMenu: function () { if (menu) menu.close(false); }
  };
})();
