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
     BOOT
     ------------------------------------------------------------------------ */

  function boot() {
    initScrollEffects();
    initMobileMenu();
    initAccordion();
    /* Before initReveal: the reserve has to exist before the entrance measures
       anything against it, and initReveal's trigger needs to know whether the
       footer ended up pinned. */
    initReveal(initFooterPin());
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
