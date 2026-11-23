/* ==========================================================================
   SVIND — Shared Dropdown, Products Catalogue Filter, Clients Sector Pager,
   & Technical Enquiry Builder
   Plain ES2020, loaded with defer across all 5 SVIND pages.
   ========================================================================== */

(function () {
  'use strict';

  var SALES_EMAIL = 'sales@svind.co.in';
  var WHATSAPP_BASE = 'https://wa.me/918027577100';

  /* ------------------------------------------------------------------------
     1. DESKTOP PRODUCTS DROPDOWN + MOBILE SUBMENU
     ------------------------------------------------------------------------ */
  function initProductsDropdown() {
    var dropdowns = document.querySelectorAll('[data-nav-dropdown]');
    dropdowns.forEach(function (wrap) {
      var btn = wrap.querySelector('.nav__dropdown-btn');
      var menu = wrap.querySelector('.nav__dropdown-menu');
      if (!btn || !menu) return;

      var closeTimer = null;
      var openedByHoverAt = 0;
      var pinned = false;

      function setOpen(open, isPinned) {
        if (closeTimer) {
          window.clearTimeout(closeTimer);
          closeTimer = null;
        }
        pinned = open ? Boolean(isPinned) : false;
        wrap.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }

      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var isOpen = wrap.classList.contains('is-open');
        if (isOpen && !pinned && Date.now() - openedByHoverAt < 450) {
          setOpen(true, true);
          return;
        }
        setOpen(!isOpen, !isOpen);
      });

      wrap.addEventListener('mouseenter', function () {
        if (window.innerWidth >= 1024 && !wrap.classList.contains('is-open')) {
          openedByHoverAt = Date.now();
          setOpen(true, false);
        }
      });

      wrap.addEventListener('mouseleave', function () {
        if (window.innerWidth >= 1024 && !pinned) {
          closeTimer = window.setTimeout(function () { setOpen(false, false); }, 160);
        }
      });

      wrap.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') {
          setOpen(false, false);
          btn.focus();
        }
      });

      document.addEventListener('click', function (ev) {
        if (!wrap.contains(ev.target)) setOpen(false, false);
      });
    });

    var subToggles = document.querySelectorAll('[data-overlay-subtoggle]');
    subToggles.forEach(function (toggle) {
      var listId = toggle.getAttribute('aria-controls');
      var list = listId ? document.getElementById(listId) : null;
      if (!list) return;

      toggle.addEventListener('click', function () {
        var next = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', next ? 'true' : 'false');
        list.hidden = !next;
      });
    });
  }

  /* ------------------------------------------------------------------------
     2. PRODUCTS & CATALOGUE PORTFOLIO FILTER (/products & /products/:slug)
     ------------------------------------------------------------------------ */
  var VALID_PORTFOLIOS = [
    'all',
    'industrial-cranes',
    'spare-parts',
    'maintenance-services',
    'scaffolding-rental'
  ];

  var PORTFOLIO_INDEX_MAP = {
    'all': '01–04',
    'industrial-cranes': '01/04',
    'spare-parts': '02/04',
    'maintenance-services': '03/04',
    'scaffolding-rental': '04/04'
  };

  function resolvePortfolioFromUrl() {
    var path = (window.location.pathname || '').replace(/\/+$/, '');
    var parts = path.split('/').filter(Boolean);
    if (parts[0] === 'products' && parts[1] && VALID_PORTFOLIOS.indexOf(parts[1]) !== -1) {
      return parts[1];
    }
    var params = new URLSearchParams(window.location.search || '');
    var q = params.get('category');
    if (q && VALID_PORTFOLIOS.indexOf(q) !== -1) return q;
    return 'all';
  }

  function initCatalogueFilter() {
    var tabList = document.querySelector('[data-cat-tabs]');
    if (!tabList) return;

    var tabs = Array.prototype.slice.call(tabList.querySelectorAll('[data-cat-filter]'));
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-cat-section]'));
    var statusEl = document.getElementById('cat-filter-status');
    var heroIndexEl = document.getElementById('ed-cat-index');

    function applyFilter(slug, pushUrl) {
      var activeSlug = VALID_PORTFOLIOS.indexOf(slug) !== -1 ? slug : 'all';
      var visibleCards = 0;
      var visiblePortfolios = 0;

      sections.forEach(function (sec) {
        var secSlug = sec.getAttribute('data-cat-section');
        var show = activeSlug === 'all' || secSlug === activeSlug;
        sec.hidden = !show;
        if (show) {
          visiblePortfolios += 1;
          visibleCards += sec.querySelectorAll('.ed-card, .cat-card').length;
        }
      });

      tabs.forEach(function (tab) {
        var match = tab.getAttribute('data-cat-filter') === activeSlug;
        tab.classList.toggle('is-active', match);
        tab.setAttribute('aria-selected', match ? 'true' : 'false');
      });

      if (heroIndexEl && PORTFOLIO_INDEX_MAP[activeSlug]) {
        heroIndexEl.textContent = PORTFOLIO_INDEX_MAP[activeSlug];
      }

      if (statusEl) {
        statusEl.textContent =
          'Showing ' +
          visibleCards +
          (visibleCards === 1 ? ' system' : ' systems') +
          ' across ' +
          visiblePortfolios +
          (visiblePortfolios === 1 ? ' portfolio' : ' portfolios');
      }

      if (pushUrl && window.history && typeof window.history.replaceState === 'function') {
        var nextPath = activeSlug === 'all' ? '/products' : '/products/' + activeSlug;
        if (window.location.pathname !== nextPath) {
          window.history.replaceState({ category: activeSlug }, '', nextPath);
        }
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var slug = tab.getAttribute('data-cat-filter') || 'all';
        applyFilter(slug, true);
      });
    });

    window.addEventListener('popstate', function () {
      applyFilter(resolvePortfolioFromUrl(), false);
    });

    applyFilter(resolvePortfolioFromUrl(), false);
  }

  /* ------------------------------------------------------------------------
     3. OUR CLIENTS — INTERACTIVE SECTOR PROOF PAGER (/clients)
     ------------------------------------------------------------------------ */
  function initSectorPager() {
    var track = document.querySelector('[data-sector-track]');
    if (!track) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll('.ed-sector-card'));
    var prevBtn = document.querySelector('[data-sector-prev]');
    var nextBtn = document.querySelector('[data-sector-next]');
    var countEl = document.querySelector('[data-sector-counter]');
    var fillEl = document.querySelector('[data-sector-progress]');
    var total = cards.length;
    if (!total) return;

    var activeIndex = 0;

    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }

    function renderPager(idx) {
      activeIndex = Math.max(0, Math.min(total - 1, idx));
      if (countEl) {
        countEl.textContent = pad(activeIndex + 1) + ' / ' + pad(total);
      }
      if (fillEl) {
        fillEl.style.width = (((activeIndex + 1) / total) * 100).toFixed(2) + '%';
      }
    }

    function stepTo(idx) {
      var clamped = (idx + total) % total;
      var target = cards[clamped];
      renderPager(clamped);
      if (target) {
        track.scrollTo({
          left: Math.max(0, target.offsetLeft - track.offsetLeft),
          behavior: 'smooth'
        });
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        stepTo(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stepTo(activeIndex + 1);
      });
    }

    var scrollTimer = null;
    track.addEventListener('scroll', function () {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(function () {
        var first = cards[0];
        if (!first) return;
        var cardSpan = first.getBoundingClientRect().width + 18;
        if (cardSpan > 0) {
          var est = Math.round(track.scrollLeft / cardSpan);
          renderPager(est);
        }
      }, 80);
    }, { passive: true });

    renderPager(0);
  }

  /* ------------------------------------------------------------------------
     4. CONTACT US — TECHNICAL ENQUIRY BUILDER & DIRECT HANDOFF (/contact)
     ------------------------------------------------------------------------ */
  var CATEGORY_LABELS = {
    'industrial-cranes': 'Industrial Cranes & Hoists',
    'spare-parts': 'Genuine Crane Spare Parts',
    'maintenance-services': 'Maintenance, AMC & Load Testing',
    'scaffolding-rental': 'Scaffolding Rentals & Formwork',
    'general': 'General Bay Survey / Technical Consultation'
  };

  function initEnquiryBuilder() {
    var form = document.getElementById('sv-enquiry-form');
    if (!form) return;

    var nameInput = document.getElementById('enq-name');
    var companyInput = document.getElementById('enq-company');
    var emailInput = document.getElementById('enq-email');
    var phoneInput = document.getElementById('enq-phone');
    var catSelect = document.getElementById('enq-category');
    var itemInput = document.getElementById('enq-item');
    var specsInput = document.getElementById('enq-specs');
    var msgInput = document.getElementById('enq-message');

    var prefillBar = document.getElementById('enq-prefill-bar');
    var prefillText = document.getElementById('enq-prefill-text');
    var prefillClear = document.getElementById('enq-prefill-clear');

    var briefPanel = document.getElementById('enq-brief-panel');
    var briefPre = document.getElementById('enq-brief-pre');
    var mailtoBtn = document.getElementById('enq-mailto-btn');
    var whatsappBtn = document.getElementById('enq-whatsapp-btn');
    var copyBtn = document.getElementById('enq-copy-btn');
    var editBtn = document.getElementById('enq-edit-btn');
    var copyStatus = document.getElementById('enq-copy-status');

    // Deep-link prefill (?category=...&item=...)
    var params = new URLSearchParams(window.location.search || '');
    var qCat = params.get('category') || '';
    var qItem = params.get('item') || '';

    if (qCat && CATEGORY_LABELS[qCat] && catSelect) {
      catSelect.value = qCat;
    }
    if (qItem && itemInput) {
      itemInput.value = qItem;
    }
    if ((qCat || qItem) && prefillBar && prefillText) {
      var label = CATEGORY_LABELS[qCat] || 'Technical Enquiry';
      prefillText.textContent = qItem
        ? 'Pre-filled from Catalogue: ' + qItem + ' (' + label + ')'
        : 'Pre-filled category: ' + label;
      prefillBar.hidden = false;
    }

    if (prefillClear) {
      prefillClear.addEventListener('click', function () {
        if (catSelect) catSelect.value = 'industrial-cranes';
        if (itemInput) itemInput.value = '';
        if (prefillBar) prefillBar.hidden = true;
      });
    }

    function setFieldError(input, errId, message) {
      var errEl = document.getElementById(errId);
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        if (errEl) {
          errEl.textContent = message;
          errEl.hidden = false;
        }
        return false;
      }
      input.removeAttribute('aria-invalid');
      if (errEl) {
        errEl.textContent = '';
        errEl.hidden = true;
      }
      return true;
    }

    function validateAll() {
      var firstBad = null;
      var ok = true;

      if (!setFieldError(nameInput, 'err-name', nameInput.value.trim().length < 2 ? 'Enter your full name.' : '')) {
        ok = false;
        if (!firstBad) firstBad = nameInput;
      }

      var emailVal = emailInput.value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
      if (!setFieldError(emailInput, 'err-email', emailOk ? '' : 'Enter a valid work email address.')) {
        ok = false;
        if (!firstBad) firstBad = emailInput;
      }

      var phoneDigits = phoneInput.value.replace(/[^0-9]/g, '');
      if (!setFieldError(phoneInput, 'err-phone', phoneDigits.length < 7 ? 'Enter a valid phone or WhatsApp number.' : '')) {
        ok = false;
        if (!firstBad) firstBad = phoneInput;
      }

      if (!setFieldError(msgInput, 'err-message', msgInput.value.trim().length < 8 ? 'Describe your crane capacity, span, bay height, or service requirement.' : '')) {
        ok = false;
        if (!firstBad) firstBad = msgInput;
      }

      if (firstBad) firstBad.focus();
      return ok;
    }

    function buildBriefText() {
      var catName = CATEGORY_LABELS[catSelect.value] || catSelect.value;
      var lines = [
        'SVIND TECHNICAL ENQUIRY BRIEF',
        '----------------------------------------',
        'Category      : ' + catName,
        'Equipment/Ref : ' + (itemInput.value.trim() || 'Not specified'),
        'Capacity/Span : ' + (specsInput.value.trim() || 'To be surveyed on site'),
        '----------------------------------------',
        'Contact Name  : ' + nameInput.value.trim(),
        'Company       : ' + (companyInput.value.trim() || 'Not specified'),
        'Work Email    : ' + emailInput.value.trim(),
        'Phone         : ' + phoneInput.value.trim(),
        '----------------------------------------',
        'Requirement Details:',
        msgInput.value.trim(),
        '----------------------------------------',
        'Dispatched via svind.co.in (Harohalli KIADB Works, Bengaluru)'
      ];
      return lines.join('\n');
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!validateAll()) return;

      var brief = buildBriefText();
      var subjectBase = itemInput.value.trim() || CATEGORY_LABELS[catSelect.value] || 'Technical Enquiry';
      var subject = 'SVIND RFQ: ' + subjectBase + ' — ' + (companyInput.value.trim() || nameInput.value.trim());

      if (briefPre) briefPre.textContent = brief;
      if (mailtoBtn) {
        mailtoBtn.setAttribute(
          'href',
          'mailto:' + SALES_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(brief)
        );
      }
      if (whatsappBtn) {
        whatsappBtn.setAttribute('href', WHATSAPP_BASE + '?text=' + encodeURIComponent(brief));
      }
      if (copyStatus) copyStatus.hidden = true;
      if (briefPanel) {
        briefPanel.hidden = false;
        briefPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = briefPre ? briefPre.textContent : '';
        if (!text) return;

        function announceCopied() {
          if (copyStatus) {
            copyStatus.textContent = 'Technical RFQ brief copied to clipboard.';
            copyStatus.hidden = false;
          }
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(announceCopied).catch(function () {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
            announceCopied();
          });
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
          announceCopied();
        }
      });
    }

    if (editBtn && briefPanel) {
      editBtn.addEventListener('click', function () {
        briefPanel.hidden = true;
        nameInput.focus();
      });
    }
  }

  function boot() {
    initProductsDropdown();
    initCatalogueFilter();
    initSectorPager();
    initEnquiryBuilder();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
