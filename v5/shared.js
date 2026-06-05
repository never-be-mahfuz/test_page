/* ═══════════════════════════════════════════════════
   S & S LOGISTICS — SHARED JS v4.0
   shared.js

   CHANGELOG v4.0:
   - THEME ENGINE: Light mode default. data-theme="dark"
     activates dark mode. localStorage key: "sns-theme".
   - Toggle wired to .theme-switch input in footer.
   - Dynamic product count injection from fish.json
     and fruits.json (Phase 5).
   - All v3.0 logic preserved: mobile menu, smooth scroll,
     scroll reveal, active nav, form submission.
   - Worker URL, email fallback, honeypot — UNCHANGED.
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     CONFIG — DO NOT CHANGE (worker + email)
  ───────────────────────────────────────────── */
  const WORKER_URL = 'https://sns-inquiry.development-ssms.workers.dev/api/inquiry';

  /* ─────────────────────────────────────────────
     UTILITY
  ───────────────────────────────────────────── */
  function $(id)        { return document.getElementById(id); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  /* ════════════════════════════════════════════
     PHASE 1: THEME ENGINE
     • Default = light (no attribute on <html>).
     • Dark    = data-theme="dark" on <html>.
     • Toggle  = .theme-switch input[type=checkbox]
                 in footer Navigate column.
     • Persists via localStorage key "sns-theme".

     ANTI-FLASH: apply theme synchronously before
     DOMContentLoaded so there is no white→dark flash.
  ════════════════════════════════════════════ */
  const THEME_KEY  = 'sns-theme';
  const html       = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
    /* Sync any toggle inputs already in DOM */
    $$('.theme-switch input[type="checkbox"]').forEach(function (cb) {
      cb.checked = (theme === 'dark');
    });
  }

  function getSavedTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'light'; }
    catch (e) { return 'light'; }
  }

  function saveTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  /* Apply immediately — before any paint */
  applyTheme(getSavedTheme());

  /* Wire up toggle inputs after DOM ready */
  function initThemeToggles() {
    $$('.theme-switch input[type="checkbox"]').forEach(function (cb) {
      /* Set initial checked state */
      cb.checked = (getSavedTheme() === 'dark');

      cb.addEventListener('change', function () {
        var next = cb.checked ? 'dark' : 'light';
        saveTheme(next);
        applyTheme(next);
      });
    });
  }

  /* ════════════════════════════════════════════
     PHASE 5: DYNAMIC PRODUCT COUNT INJECTION
     Reads fish.json and fruits.json, counts total
     products across all categories, then injects
     the number into every element with:
       data-count="fish"   → fish total
       data-count="fruits" → fruit total
     Also updates data-target on stat counters so
     the animated counter in acquabounty.html uses
     the real live number.
  ════════════════════════════════════════════ */
  function injectProductCounts() {
    var fishEls   = $$('[data-count="fish"]');
    var fruitEls  = $$('[data-count="fruits"]');

    /* Only fetch if there are elements to update */
    if (fishEls.length) {
      fetch('fish.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var total = 0;
          if (data.categories) {
            data.categories.forEach(function (cat) {
              if (cat.products) total += cat.products.length;
            });
          }
          fishEls.forEach(function (el) {
            el.textContent = total;
            /* Also sync animated counter target */
            if (el.hasAttribute('data-target')) el.setAttribute('data-target', total);
          });
        })
        .catch(function () {});
    }

    if (fruitEls.length) {
      fetch('fruits.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var total = 0;
          if (data.categories) {
            data.categories.forEach(function (cat) {
              if (cat.products) total += cat.products.length;
            });
          }
          fruitEls.forEach(function (el) {
            el.textContent = total;
            if (el.hasAttribute('data-target')) el.setAttribute('data-target', total);
          });
        })
        .catch(function () {});
    }
  }

  /* ─────────────────────────────────────────────
     NAVBAR — scroll class
  ───────────────────────────────────────────── */
  var nav = $('global-nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ════════════════════════════════════════════
     MOBILE MENU — SLIDE-DOWN DROPDOWN (v3.0, unchanged)
  ════════════════════════════════════════════ */
  var hamburger  = $('nav-hamburger');
  var mobileMenu = $('mobile-menu');
  var menuOpen   = false;

  function openMobileMenu() {
    if (!mobileMenu || menuOpen) return;
    menuOpen = true;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger && hamburger.classList.add('is-open');
    hamburger && hamburger.setAttribute('aria-expanded', 'true');
    hamburger && hamburger.setAttribute('aria-label', 'Close navigation menu');
    setTimeout(function () {
      var first = getMenuFocusable()[0];
      if (first) first.focus();
    }, 80);
  }

  function closeMobileMenu() {
    if (!mobileMenu || !menuOpen) return;
    menuOpen = false;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger && hamburger.classList.remove('is-open');
    hamburger && hamburger.setAttribute('aria-expanded', 'false');
    hamburger && hamburger.setAttribute('aria-label', 'Open navigation menu');
    if (hamburger) hamburger.focus();
  }

  function toggleMobileMenu() { menuOpen ? closeMobileMenu() : openMobileMenu(); }

  function getMenuFocusable() {
    if (!mobileMenu) return [];
    return Array.from(
      mobileMenu.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (el) { return !el.closest('.hp-field'); });
  }

  if (hamburger) {
    hamburger.addEventListener('click', function (e) { e.stopPropagation(); toggleMobileMenu(); });
  }
  var mobileClose = $('mobile-menu-close');
  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) closeMobileMenu(); });
  document.addEventListener('click', function (e) {
    if (!menuOpen) return;
    if (mobileMenu && mobileMenu.contains(e.target)) return;
    if (hamburger  && hamburger.contains(e.target))  return;
    closeMobileMenu();
  });

  if (mobileMenu) {
    $$('a, button', mobileMenu).forEach(function (el) {
      el.addEventListener('click', function () { setTimeout(closeMobileMenu, 80); });
    });
    mobileMenu.addEventListener('keydown', function (e) {
      if (!menuOpen || e.key !== 'Tab') return;
      var focusable = getMenuFocusable();
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  window.closeMobileMenu = closeMobileMenu;
  window.openMobileMenu  = openMobileMenu;

  /* ─────────────────────────────────────────────
     SMOOTH SCROLL
  ───────────────────────────────────────────── */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeMobileMenu();
      setTimeout(function () {
        var navHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
        ) || 80;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }, menuOpen ? 360 : 0);
    });
  });

  /* ─────────────────────────────────────────────
     SCROLL REVEAL
  ───────────────────────────────────────────── */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  $$('.reveal').forEach(function (el) { revealObserver.observe(el); });

  /* ─────────────────────────────────────────────
     ACTIVE NAV LINK
  ───────────────────────────────────────────── */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  $$('#global-nav .nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href && (href === currentPage || (currentPage === '' && href === 'index.html'))) {
      a.classList.add('nav-active');
    }
  });

  /* ─────────────────────────────────────────────
     FORM HELPERS (unchanged from v3.0)
  ───────────────────────────────────────────── */
  async function submitInquiry(data, btnEl, successCb, errorCb) {
    if (data._hp && data._hp.trim() !== '') { successCb && successCb(); return; }
    delete data._hp;
    var origText = btnEl ? btnEl.textContent : '';
    var origBg   = btnEl ? btnEl.style.background : '';
    if (btnEl) { btnEl.textContent = 'Sending…'; btnEl.disabled = true; }
    try {
      var res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { successCb && successCb(); }
      else {
        var err = await res.json().catch(function () { return {}; });
        throw new Error(err.message || ('Server ' + res.status));
      }
    } catch (err) {
      console.error('[S&S Form]', err);
      errorCb && errorCb(err);
      if (btnEl) {
        btnEl.textContent = 'Error — try emailing us';
        btnEl.disabled    = false;
        btnEl.onclick     = function () {
          window.location.href = 'mailto:development.snsl@gmail.com?subject=Trade Inquiry from Website';
        };
      }
    } finally {
      setTimeout(function () {
        if (btnEl && btnEl.textContent !== origText) {
          btnEl.textContent      = origText;
          btnEl.style.background = origBg;
          btnEl.disabled         = false;
          btnEl.onclick          = null;
        }
      }, 5000);
    }
  }

  function validateForm(form) {
    form.querySelectorAll('[data-error]').forEach(function (f) {
      f.removeAttribute('data-error'); f.style.borderColor = '';
    });
    var valid = true;
    form.querySelectorAll('[required]').forEach(function (field) {
      var empty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
      if (empty) { field.style.borderColor = '#c0392b'; field.setAttribute('data-error', '1'); valid = false; }
    });
    if (!valid) {
      var first = form.querySelector('[data-error]');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
  }

  /* about.html */
  var contactForm = $('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm(contactForm)) return;
      var data = Object.fromEntries(new FormData(contactForm).entries());
      data.source = 'S&S Logistics — Contact Form (about.html)';
      var btn = contactForm.querySelector('.form-submit');
      await submitInquiry(data, btn, function () {
        var emailEl     = $('successEmail');
        var formContent = $('formContent');
        var formSuccess = $('formSuccess');
        if (emailEl)     emailEl.textContent       = data.email || '';
        if (formContent) formContent.style.display  = 'none';
        if (formSuccess) formSuccess.classList.add('show');
        var cs = $('contact');
        if (cs) cs.scrollIntoView({ behavior: 'smooth' });
      }, null);
    });
  }

  /* acquabounty.html */
  var aquaForm = $('aquaInquiryForm');
  if (aquaForm) {
    aquaForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm(aquaForm)) return;
      var data = Object.fromEntries(new FormData(aquaForm).entries());
      data.source = 'AquaBounty — Fish Inquiry Form (acquabounty.html)';
      var btn = aquaForm.querySelector('.ab-submit, .form-submit');
      await submitInquiry(data, btn, function () {
        if (btn) { btn.textContent = '✓ Inquiry Sent!'; btn.style.background = '#2d7a3a'; }
        aquaForm.reset();
        setTimeout(function () {
          if (btn) { btn.textContent = 'Send Inquiry →'; btn.style.background = ''; btn.disabled = false; }
        }, 4000);
      }, null);
    });
  }

  /* tropiqharvest.html */
  var tropiqForm = $('tropiqInquiryForm');
  if (tropiqForm) {
    tropiqForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm(tropiqForm)) return;
      var data = Object.fromEntries(new FormData(tropiqForm).entries());
      data.source = 'TropiqHarvest — Fruit Inquiry Form (tropiqharvest.html)';
      var btn = tropiqForm.querySelector('.th-submit, .form-submit');
      await submitInquiry(data, btn, function () {
        if (btn) { btn.textContent = '✓ Request Sent!'; btn.style.background = '#2d7a3a'; }
        tropiqForm.reset();
        setTimeout(function () {
          if (btn) { btn.textContent = 'Request Export Quote →'; btn.style.background = ''; btn.disabled = false; }
        }, 4000);
      }, null);
    });
  }

  /* services.html */
  $$('.svc-inquiry-form').forEach(function (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      var data = Object.fromEntries(new FormData(form).entries());
      data.source = 'S&S Logistics — Services Page Inquiry';
      var btn = form.querySelector('.form-submit');
      await submitInquiry(data, btn, function () {
        if (btn) { btn.textContent = '✓ Sent!'; btn.style.background = '#2d7a3a'; }
        form.reset();
        setTimeout(function () {
          if (btn) { btn.textContent = 'Send →'; btn.style.background = ''; btn.disabled = false; }
        }, 4000);
      }, null);
    });
  });

  /* ─────────────────────────────────────────────
     DOM READY — init theme toggles + product counts
  ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initThemeToggles();
      injectProductCounts();
    });
  } else {
    initThemeToggles();
    injectProductCounts();
  }

})();
