/* ═══════════════════════════════════════════════════
   S & S LOGISTICS — SHARED JS v3.0
   shared.js

   CHANGELOG v3.0:
   - Phase 3: Fullscreen overlay mobile menu replaced
     with sleek slide-down dropdown (matches shared.css v3.0)
   - Phase 3: Body scroll lock removed (panel scrolls independently)
   - Phase 3: Dropdown closes on outside click via overlay-free
     document listener (lighter than a backdrop element)
   - Smooth anchor scroll, active nav link, scroll reveal,
     contact/inquiry form handlers — all preserved & hardened
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     CONFIG
     Replace WORKER_URL with your deployed
     Cloudflare Worker URL after deployment.
     Format: https://sns-inquiry.YOUR_SUBDOMAIN.workers.dev/api/inquiry
     OR:     https://snslogisticsbd.com/api/inquiry
             (if you set up a Cloudflare Worker Route)
  ───────────────────────────────────────────── */
  const WORKER_URL = 'https://sns-inquiry.development-ssms.workers.dev/api/inquiry';

  /* ─────────────────────────────────────────────
     UTILITY
  ───────────────────────────────────────────── */
  function $(id)        { return document.getElementById(id); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  /* ─────────────────────────────────────────────
     NAVBAR — scroll class
  ───────────────────────────────────────────── */
  const nav = $('global-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); /* run once on load */
  }

  /* ═══════════════════════════════════════════════
     PHASE 3: MOBILE MENU — SLIDE-DOWN DROPDOWN
     Replaces the old fullscreen overlay.

     The menu panel (#mobile-menu) is positioned
     fixed below the navbar via CSS (top: var(--nav-h)).
     JS only toggles the .open class + aria attributes.
     No body scroll lock — the panel scrolls itself.
  ═══════════════════════════════════════════════ */
  const hamburger  = $('nav-hamburger');
  const mobileMenu = $('mobile-menu');

  let menuOpen = false;

  function openMobileMenu() {
    if (!mobileMenu || menuOpen) return;
    menuOpen = true;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger && hamburger.classList.add('is-open');
    hamburger && hamburger.setAttribute('aria-expanded', 'true');
    hamburger && hamburger.setAttribute('aria-label', 'Close navigation menu');

    /* Focus first focusable link after transition (34ms + buffer) */
    setTimeout(() => {
      const first = getMenuFocusable()[0];
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

    /* Return focus to hamburger */
    if (hamburger) hamburger.focus();
  }

  function toggleMobileMenu() {
    menuOpen ? closeMobileMenu() : openMobileMenu();
  }

  /* Focusable elements inside the menu (exclude honeypot fields) */
  function getMenuFocusable() {
    if (!mobileMenu) return [];
    return Array.from(
      mobileMenu.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.closest('.hp-field'));
  }

  /* Hamburger click */
  if (hamburger) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });
  }

  /* Legacy close button (kept for HTML backwards compat) */
  const mobileClose = $('mobile-menu-close');
  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);

  /* Close on Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) closeMobileMenu();
  });

  /* Close on outside click — any click not inside the menu or hamburger */
  document.addEventListener('click', (e) => {
    if (!menuOpen) return;
    if (mobileMenu && mobileMenu.contains(e.target)) return;
    if (hamburger  && hamburger.contains(e.target))  return;
    closeMobileMenu();
  });

  /* Close when a menu link is tapped (navigate away) */
  if (mobileMenu) {
    $$('a, button', mobileMenu).forEach((el) => {
      el.addEventListener('click', () => {
        /* Small delay so the click registers before menu collapses */
        setTimeout(closeMobileMenu, 80);
      });
    });
  }

  /* Focus trap inside mobile menu (Tab / Shift+Tab cycles within) */
  if (mobileMenu) {
    mobileMenu.addEventListener('keydown', (e) => {
      if (!menuOpen || e.key !== 'Tab') return;
      const focusable = getMenuFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* Expose globally as safe fallback for inline onclick attrs */
  window.closeMobileMenu = closeMobileMenu;
  window.openMobileMenu  = openMobileMenu;

  /* ─────────────────────────────────────────────
     SMOOTH SCROLL — anchor links
  ───────────────────────────────────────────── */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeMobileMenu();
      setTimeout(() => {
        const navHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
        ) || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }, menuOpen ? 360 : 0); /* wait for menu close animation if open */
    });
  });

  /* ─────────────────────────────────────────────
     SCROLL REVEAL
  ───────────────────────────────────────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  $$('.reveal').forEach((el) => revealObserver.observe(el));

  /* ─────────────────────────────────────────────
     ACTIVE NAV LINK
  ───────────────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  $$('#global-nav .nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (
      href &&
      (href === currentPage ||
        (currentPage === '' && href === 'index.html'))
    ) {
      a.classList.add('nav-active');
    }
  });

  /* ─────────────────────────────────────────────
     FORM SUBMISSION HELPER
     Sends JSON to Cloudflare Worker.
     Includes honeypot check on the client side.
  ───────────────────────────────────────────── */
  async function submitInquiry(data, btnEl, successCb, errorCb) {
    /* honeypot check — if filled, silently reject */
    if (data._hp && data._hp.trim() !== '') {
      successCb && successCb(); /* fake success to fool bots */
      return;
    }
    delete data._hp;

    const origText  = btnEl ? btnEl.textContent : '';
    const origBg    = btnEl ? btnEl.style.background : '';
    if (btnEl) { btnEl.textContent = 'Sending…'; btnEl.disabled = true; }

    try {
      const res = await fetch(WORKER_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });

      if (res.ok) {
        successCb && successCb();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server ${res.status}`);
      }
    } catch (err) {
      console.error('[S&S Form]', err);
      errorCb && errorCb(err);
      if (btnEl) {
        btnEl.textContent = 'Error — try emailing us';
        btnEl.disabled    = false;
        btnEl.onclick     = () => {
          window.location.href =
            'mailto:development.snsl@gmail.com?subject=Trade Inquiry from Website';
        };
      }
    } finally {
      /* Restore button after 5s if no navigation occurred */
      setTimeout(() => {
        if (btnEl && btnEl.textContent !== origText) {
          btnEl.textContent    = origText;
          btnEl.style.background = origBg;
          btnEl.disabled       = false;
          btnEl.onclick        = null;
        }
      }, 5000);
    }
  }

  /* ─────────────────────────────────────────────
     VALIDATE required fields
     Returns true if valid, false + highlights if not.
  ───────────────────────────────────────────── */
  function validateForm(form) {
    /* Clear previous error highlights */
    form.querySelectorAll('[data-error]').forEach((f) => {
      f.removeAttribute('data-error');
      f.style.borderColor = '';
    });

    let valid = true;
    form.querySelectorAll('[required]').forEach((field) => {
      const empty =
        field.type === 'checkbox' ? !field.checked : !field.value.trim();
      if (empty) {
        field.style.borderColor = '#c0392b';
        field.setAttribute('data-error', '1');
        valid = false;
      }
    });

    if (!valid) {
      const first = form.querySelector('[data-error]');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
  }

  /* ─────────────────────────────────────────────
     ABOUT.HTML — Main contact form
  ───────────────────────────────────────────── */
  const contactForm = $('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(contactForm)) return;

      const data = Object.fromEntries(new FormData(contactForm).entries());
      data.source = 'S&S Logistics — Contact Form (about.html)';

      const btn = contactForm.querySelector('.form-submit');
      await submitInquiry(
        data, btn,
        () => {
          const emailEl      = $('successEmail');
          const formContent  = $('formContent');
          const formSuccess  = $('formSuccess');
          if (emailEl)     emailEl.textContent    = data.email || '';
          if (formContent) formContent.style.display = 'none';
          if (formSuccess) formSuccess.classList.add('show');
          const contactSection = $('contact');
          if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
        },
        null
      );
    });
  }

  /* ─────────────────────────────────────────────
     ACQUABOUNTY.HTML — Fish inquiry form
  ───────────────────────────────────────────── */
  const aquaForm = $('aquaInquiryForm');
  if (aquaForm) {
    aquaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(aquaForm)) return;

      const data = Object.fromEntries(new FormData(aquaForm).entries());
      data.source = 'AquaBounty — Fish Inquiry Form (acquabounty.html)';

      const btn = aquaForm.querySelector('.ab-submit, .form-submit');
      await submitInquiry(
        data, btn,
        () => {
          if (btn) { btn.textContent = '✓ Inquiry Sent!'; btn.style.background = '#2d7a3a'; }
          aquaForm.reset();
          setTimeout(() => {
            if (btn) {
              btn.textContent    = 'Send Inquiry →';
              btn.style.background = '';
              btn.disabled       = false;
            }
          }, 4000);
        },
        null
      );
    });
  }

  /* ─────────────────────────────────────────────
     TROPIQHARVEST.HTML — Fruit inquiry form
  ───────────────────────────────────────────── */
  const tropiqForm = $('tropiqInquiryForm');
  if (tropiqForm) {
    tropiqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(tropiqForm)) return;

      const data = Object.fromEntries(new FormData(tropiqForm).entries());
      data.source = 'TropiqHarvest — Fruit Inquiry Form (tropiqharvest.html)';

      const btn = tropiqForm.querySelector('.th-submit, .form-submit');
      await submitInquiry(
        data, btn,
        () => {
          if (btn) { btn.textContent = '✓ Request Sent!'; btn.style.background = '#2d7a3a'; }
          tropiqForm.reset();
          setTimeout(() => {
            if (btn) {
              btn.textContent    = 'Request Export Quote →';
              btn.style.background = '';
              btn.disabled       = false;
            }
          }, 4000);
        },
        null
      );
    });
  }

  /* ─────────────────────────────────────────────
     SERVICES.HTML — CTA contact forms
     (any form with class .svc-inquiry-form)
  ───────────────────────────────────────────── */
  $$('.svc-inquiry-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;
      const data  = Object.fromEntries(new FormData(form).entries());
      data.source = 'S&S Logistics — Services Page Inquiry';
      const btn   = form.querySelector('.form-submit');
      await submitInquiry(data, btn,
        () => {
          if (btn) { btn.textContent = '✓ Sent!'; btn.style.background = '#2d7a3a'; }
          form.reset();
          setTimeout(() => {
            if (btn) { btn.textContent = 'Send →'; btn.style.background = ''; btn.disabled = false; }
          }, 4000);
        },
        null
      );
    });
  });

})();
