/* ═══════════════════════════════════════════════════
   S & S LOGISTICS — DYNAMIC CATALOG RENDERER v3.0
   catalog.js
   Loads /data/fish.json  → renders AquaBounty product cards
   Loads /data/fruits.json → renders TropiqHarvest cards
   No dependencies. Vanilla JS only.

   IMAGE ARCHITECTURE (Phase 1):
   All images are served from relative paths:
     /images/fish/[name].webp
     /images/fruits/mango/[name].webp
     /images/fruits/tropical/[name].webp
     /images/team/[name].webp
   Fallback chain: product.fallback_image_url → PLACEHOLDER_* constant
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     FALLBACK IMAGE CONSTANTS
     These are served from your own /images/ dir.
     Replace with your actual placeholder WebPs.
  ───────────────────────────────────────────── */
  const PLACEHOLDER_FISH  = '/images/fish/placeholder.webp';
  const PLACEHOLDER_FRUIT = '/images/fruits/mango/placeholder.webp';
  const PLACEHOLDER_TROPICAL = '/images/fruits/tropical/placeholder.webp';

  /* ─────────────────────────────────────────────
     JSON PATH RESOLVER
     Always fetches from the site root regardless
     of which sub-page is currently loaded.
     e.g. /acquabounty.html still finds /data/fish.json
  ───────────────────────────────────────────── */
  function resolveJsonPath(filename) {
    const origin = window.location.origin;
    return `${origin}/${filename}`;
  }

  /* ─────────────────────────────────────────────
     IMAGE SRC RESOLVER
     Resolves a relative image path to an absolute
     URL rooted at the site origin, so it always
     works regardless of the current page depth.
  ───────────────────────────────────────────── */
  function resolveImg(relativePath) {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath; /* already absolute */
    return window.location.origin + relativePath;
  }

  /* ─────────────────────────────────────────────
     SAFE IMAGE SRC
     Returns the best available source string for
     an img tag, with fallback resolution built in.
  ───────────────────────────────────────────── */
  function imgSrc(primary, fallback, placeholder) {
    return resolveImg(primary) || resolveImg(fallback) || placeholder;
  }

  /* ─────────────────────────────────────────────
     INLINE onerror HANDLER STRING
     Injected into <img> tags for graceful fallback.
     Three-tier: primary → fallback → placeholder
  ───────────────────────────────────────────── */
  function onerrorAttr(fallback, placeholder) {
    const fb  = resolveImg(fallback)  || placeholder;
    const ph  = placeholder;
    /* If primary fails, try fallback; if that also fails, use placeholder */
    return `this.onerror=function(){this.onerror=null;this.src='${ph}';};this.src='${fb}';`;
  }

  /* ─────────────────────────────────────────────
     UTILITY
  ───────────────────────────────────────────── */
  async function fetchJSON(filename) {
    const url = resolveJsonPath(filename);
    try {
      const res = await fetch(url, { cache: 'default' });
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      return await res.json();
    } catch (err) {
      console.error('[S&S Catalog] Failed to load JSON:', err);
      return null;
    }
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function observeNewRevealElements(container) {
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    container.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  /* ─────────────────────────────────────────────
     AVAILABILITY BADGE
  ───────────────────────────────────────────── */
  function availabilityBadge(status) {
    const map = {
      available: { label: 'Available',    cls: 'avail-yes' },
      seasonal:  { label: 'Seasonal',     cls: 'avail-seasonal' },
      soon:      { label: 'Coming Soon',  cls: 'avail-soon' },
    };
    const entry = map[status] || map['available'];
    return `<span class="avail-badge ${esc(entry.cls)}">${esc(entry.label)}</span>`;
  }

  /* ═══════════════════════════════════════════════
     ① AQUABOUNTY — FISH CATALOG
  ═══════════════════════════════════════════════ */

  function buildFishCard(product, category) {
    const src      = imgSrc(product.image_url, product.fallback_image_url, PLACEHOLDER_FISH);
    const onErr    = onerrorAttr(product.fallback_image_url, PLACEHOLDER_FISH);
    const forms    = Array.isArray(product.export_specifications?.forms)
      ? product.export_specifications.forms.join(' · ')
      : '—';
    const nameEsc  = esc(product.fish_name);

    return `
      <div class="prod-card reveal"
           role="button"
           tabindex="0"
           aria-label="View details for ${nameEsc}"
           data-id="${esc(product.id)}"
           data-name="${nameEsc}"
           data-img="${esc(src)}"
           data-fallback="${esc(resolveImg(product.fallback_image_url) || PLACEHOLDER_FISH)}"
           data-cat="${esc(category.id)}"
           data-cat-label="${esc(category.label)}"
           data-form="${esc(forms)}"
           data-local="${esc(product.local_name || '')}"
           data-desc="${esc(product.description || '')}"
           data-storage="${esc(product.export_specifications?.storage_temp_c ?? -18)}"
           data-shelf="${esc(product.export_specifications?.shelf_life_months ?? 18)}"
           data-status="${esc(product.availability_status || 'available')}">
        <div class="prod-img-wrap">
          <div class="prod-stripe ${esc(category.stripe_class)}"></div>
          <img
            class="prod-img"
            src="${esc(src)}"
            alt="${nameEsc} — ${esc(category.label)} export by AquaBounty, S&amp;S Logistics"
            loading="lazy"
            decoding="async"
            width="300" height="200"
            onerror="${onErr}"
          />
        </div>
        <div class="prod-body">
          <span class="prod-badge ${esc(category.badge_class)}">${esc(category.label)}</span>
          <div class="prod-name">${nameEsc}</div>
          <div class="prod-form">${esc(forms)}</div>
          ${availabilityBadge(product.availability_status)}
        </div>
        <div class="prod-hover-action">
          <span class="phca-btn">View &amp; Inquire</span>
        </div>
      </div>`;
  }

  function buildFishCategorySection(category) {
    if (!category.products || category.products.length === 0) return '';
    const cards = category.products.map((p) => buildFishCard(p, category)).join('');
    return `
      <div class="cat-section" data-cat-id="${esc(category.id)}">
        <div class="cat-head">
          <div class="cat-head-left">
            <span class="cat-dot ${esc(category.dot_class)}"></span>
            <span class="cat-name">${esc(category.label)}</span>
          </div>
          <span class="cat-cnt">${category.products.length} item${category.products.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="prod-grid">${cards}</div>
      </div>`;
  }

  function buildFishTabs(data) {
    const tabsEl = document.getElementById('ab-tabs');
    if (!tabsEl) return;
    const total = data.categories.reduce((sum, c) => sum + c.products.length, 0);
    let html = `
      <button class="ab-tab active" data-cat="all">
        <span class="tdot" style="background:var(--ab-coral)"></span>
        All Products
        <span class="ab-tab-count">${total}</span>
      </button>`;
    data.categories.forEach((cat) => {
      html += `
        <button class="ab-tab" data-cat="${esc(cat.id)}">
          <span class="tdot" style="background:${esc(cat.color_hex)}"></span>
          ${esc(cat.label)}
          <span class="ab-tab-count">${cat.products.length}</span>
        </button>`;
    });
    tabsEl.innerHTML = html;
  }

  function renderFishCatalog(data, searchTerm = '', activeCat = 'all') {
    const outputEl = document.getElementById('productOutput');
    const countEl  = document.getElementById('countNum');
    if (!outputEl) return;

    const term  = searchTerm.toLowerCase().trim();
    let total   = 0;
    let html    = '';

    const catsToRender = activeCat === 'all'
      ? data.categories
      : data.categories.filter((c) => c.id === activeCat);

    catsToRender.forEach((cat) => {
      const filtered = term
        ? cat.products.filter(
            (p) =>
              p.fish_name.toLowerCase().includes(term) ||
              (p.local_name || '').toLowerCase().includes(term) ||
              (p.export_specifications?.forms || []).join(' ').toLowerCase().includes(term) ||
              (p.description || '').toLowerCase().includes(term)
          )
        : cat.products;
      if (!filtered.length) return;
      total += filtered.length;
      html += buildFishCategorySection({ ...cat, products: filtered });
    });

    if (!total) {
      html = `
        <div class="no-results">
          <strong>No products found</strong>
          Try a different term — e.g. "hilsa", "shrimp", "block", "dry"
        </div>`;
    }

    outputEl.innerHTML = html;
    if (countEl) countEl.textContent = total;
    observeNewRevealElements(outputEl);
    attachFishCardListeners(data, outputEl);
  }

  function attachFishCardListeners(data, container) {
    container.querySelectorAll('.prod-card').forEach((card) => {
      const open = () => openFishModal(card, data);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  function openFishModal(card, data) {
    const modal = document.getElementById('modal');
    if (!modal) return;

    const { name, img, fallback, cat: catId, catLabel, form, local, desc,
            storage, shelf, status } = card.dataset;

    const catObj   = data.categories.find((c) => c.id === catId);
    const badgeCls = catObj ? catObj.badge_class : '';

    const mImg     = document.getElementById('mImg');
    const mName    = document.getElementById('mName');
    const mBadge   = document.getElementById('mBadge');
    const mCat     = document.getElementById('mCat');
    const mForm    = document.getElementById('mForm');
    const mLocal   = document.getElementById('mLocal');
    const mDesc    = document.getElementById('mDesc');
    const mStorage = document.getElementById('mStorage');
    const mShelf   = document.getElementById('mShelf');
    const mStatus  = document.getElementById('mStatus');

    if (mImg) {
      mImg.src = img;
      mImg.alt = name;
      /* Three-tier fallback inside modal too */
      mImg.onerror = function () {
        this.onerror = () => { this.onerror = null; this.src = PLACEHOLDER_FISH; };
        this.src = fallback || PLACEHOLDER_FISH;
      };
    }
    if (mName)    mName.textContent    = name;
    if (mBadge)   mBadge.innerHTML     = `<span class="prod-badge ${badgeCls}">${catLabel}</span>`;
    if (mCat)     mCat.textContent     = catLabel;
    if (mForm)    mForm.textContent    = form;
    if (mLocal)   mLocal.textContent   = local   || '—';
    if (mDesc)    mDesc.textContent    = desc     || '—';
    if (mStorage) mStorage.textContent = storage  ? `${storage}°C` : '-18°C';
    if (mShelf)   mShelf.textContent   = shelf    ? `${shelf} months` : '18 months';
    if (mStatus) {
      const statusMap = { available: '✅ In Stock', seasonal: '🌿 Seasonal', soon: '🔜 Coming Soon' };
      mStatus.textContent = statusMap[status] || '✅ In Stock';
    }

    modal.dataset.currentProduct = name;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modal.focus();
  }

  function initFishTabs(data) {
    const tabsEl = document.getElementById('ab-tabs');
    if (!tabsEl) return;
    let activeCat  = 'all';
    let searchTerm = '';

    tabsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.ab-tab');
      if (!btn) return;
      activeCat = btn.dataset.cat;
      tabsEl.querySelectorAll('.ab-tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      searchTerm = '';
      const si = document.getElementById('searchInput');
      if (si) si.value = '';
      renderFishCatalog(data, '', activeCat);
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          searchTerm = searchInput.value;
          activeCat  = 'all';
          tabsEl.querySelectorAll('.ab-tab').forEach((t) =>
            t.classList.toggle('active', t.dataset.cat === 'all')
          );
          renderFishCatalog(data, searchTerm, 'all');
        }, 180); /* debounce 180ms */
      });
    }
  }

  function initFishModal() {
    const modal      = document.getElementById('modal');
    const closeBtn   = document.getElementById('modalCloseBtn');
    const inquireBtn = document.getElementById('modalInquireBtn');
    if (!modal) return;

    const close = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    if (closeBtn)  closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    if (inquireBtn) {
      inquireBtn.addEventListener('click', () => {
        const name = modal.dataset.currentProduct || '';
        close();

        /* Legacy: plain text input field (id="inquiryProduct") */
        const inp = document.getElementById('inquiryProduct');
        if (inp) inp.value = name;

        /* Phase 3: dynamic <select data-product-select> fields —
           Find matching option by value and select it. Works after
           shared.js has populated the select from the JSON catalog. */
        document.querySelectorAll('[data-product-select]').forEach((sel) => {
          const opts = Array.from(sel.options);
          const match = opts.find(
            (o) => !o.disabled && o.value.toLowerCase() === name.toLowerCase()
          );
          if (match) sel.value = match.value;
        });

        const contactSection = document.getElementById('ab-contact');
        if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  function initFishStatCounters() {
    const statsWrap = document.querySelector('.ab-stats');
    if (!statsWrap) return;

    function countUp(el, target) {
      let n = 0;
      const step = target / 55;
      const t = setInterval(() => {
        n = Math.min(n + step, target);
        el.textContent = Math.floor(n);
        if (n >= target) { el.textContent = target; clearInterval(t); }
      }, 20);
    }

    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-target]').forEach((el) => {
              countUp(el, +el.dataset.target);
            });
          }
        });
      },
      { threshold: 0.3 }
    ).observe(statsWrap);
  }

  async function initAquaBounty() {
    if (!document.getElementById('productOutput')) return;

    /* Show skeleton loader while fetching */
    const out = document.getElementById('productOutput');
    if (out) {
      out.innerHTML = `<div class="catalog-loading" aria-live="polite" aria-label="Loading catalog">
        ${Array(8).fill('<div class="skeleton-card"></div>').join('')}
      </div>`;
    }

    const data = await fetchJSON('data/fish.json');
    if (!data) {
      if (out) {
        out.innerHTML = `
          <div class="no-results">
            <strong>Catalog unavailable</strong>
            Please contact us directly at <a href="mailto:trade@snslogisticsbd.com">trade@snslogisticsbd.com</a>
          </div>`;
      }
      return;
    }

    buildFishTabs(data);
    renderFishCatalog(data);
    initFishTabs(data);
    initFishModal();
    initFishStatCounters();
    window._fishData = data; /* expose for debugging */
  }

  /* ═══════════════════════════════════════════════
     ② TROPIQHARVEST — FRUIT CATALOG
  ═══════════════════════════════════════════════ */

  function buildMangoCard(product, category, index) {
    const isMango    = category.id === 'mango';
    const ph         = isMango ? PLACEHOLDER_FRUIT : PLACEHOLDER_TROPICAL;
    const src        = imgSrc(product.image_url, product.fallback_image_url, ph);
    const onErr      = onerrorAttr(product.fallback_image_url, ph);
    const name       = product.mango_variety || product.fruit_name || '—';
    const origin     = product.origin_region || '';
    const desc       = product.description   || '';
    const season     = product.seasonality?.season_label || product.export_grade?.season_label || '—';
    const grade      = product.export_grade?.grade       || '—';
    const brix       = product.export_grade?.brix_level  || '—';
    const shelf      = product.export_grade?.shelf_life_days || '—';
    const moq        = product.minimum_order_qty_kg ? `${product.minimum_order_qty_kg} kg` : '—';
    const status     = product.availability_status || 'available';
    const delayClass = index > 0 ? `reveal-d${Math.min(index, 5)}` : '';

    if (isMango) {
      return `
        <div class="th-mango-card reveal ${delayClass}">
          <div class="th-mango-img-wrap">
            <img
              src="${esc(src)}"
              alt="${esc(name)} mango export — TropiqHarvest by S&amp;S Logistics Bangladesh"
              loading="lazy"
              decoding="async"
              width="600" height="400"
              onerror="${onErr}"
            />
            ${availabilityBadge(status)}
          </div>
          <div class="th-mango-body">
            <div class="th-mango-origin">Origin: ${esc(origin)}</div>
            <div class="th-mango-name">${esc(name)}</div>
            <p class="th-mango-desc">${esc(desc)}</p>
            <div class="th-mango-specs">
              <div class="th-mango-spec">Season: ${esc(season)}</div>
              <div class="th-mango-spec">Brix level: ${esc(brix)}</div>
              <div class="th-mango-spec">Shelf life: ${esc(shelf)}</div>
              <div class="th-mango-spec">Min. order: ${esc(moq)}</div>
              <div class="th-mango-spec">Export grade: ${esc(grade)}</div>
            </div>
            <a href="#th-contact"
               class="th-mango-link"
               aria-label="Inquire about bulk pricing for ${esc(name)}">
              Inquire Bulk Pricing →
            </a>
          </div>
        </div>`;
    }

    /* Tropical grid tile */
    return `
      <div class="th-fruit-card reveal ${delayClass}">
        <img
          src="${esc(src)}"
          alt="${esc(name)} — TropiqHarvest export by S&amp;S Logistics Bangladesh"
          loading="lazy"
          decoding="async"
          width="400" height="300"
          onerror="${onErr}"
        />
        <div class="th-fruit-overlay">
          <div class="th-fruit-name">${esc(name)}</div>
          <div class="th-fruit-avail">${esc(season)}</div>
        </div>
      </div>`;
  }

  function renderFruitCatalog(data) {
    data.categories.forEach((category) => {
      const containerId = category.id === 'mango' ? 'th-mango-grid' :
                          category.id === 'tropical' ? 'th-fruits-grid' : null;
      if (!containerId) return;
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = category.products
        .map((p, i) => buildMangoCard(p, category, i))
        .join('');
      observeNewRevealElements(container);
    });
  }

  function updateFruitTicker(data) {
    const track = document.querySelector('.ticker-track');
    if (!track) return;
    let items = '';
    data.categories.forEach((cat) => {
      cat.products.forEach((p) => {
        const name   = p.mango_variety || p.fruit_name || '';
        const season = p.seasonality?.season_label || '';
        items += `<span class="ticker-item">${esc(name)}${season ? ' · ' + esc(season) : ''} <span class="ticker-dot"></span></span>`;
      });
    });
    track.innerHTML = items + items; /* duplicate for seamless loop */
  }

  async function initTropiqHarvest() {
    if (
      !document.getElementById('th-mango-grid') &&
      !document.getElementById('th-fruits-grid')
    ) return;

    const data = await fetchJSON('data/fruits.json');
    if (!data) {
      const grid = document.getElementById('th-mango-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="no-results" style="grid-column:1/-1">
            <strong>Catalog unavailable</strong>
            Please contact us at <a href="mailto:trade@snslogisticsbd.com">trade@snslogisticsbd.com</a>
          </div>`;
      }
      return;
    }

    renderFruitCatalog(data);
    updateFruitTicker(data);
  }

  /* ═══════════════════════════════════════════════
     ③ HOMEPAGE PREVIEW CHIPS
  ═══════════════════════════════════════════════ */

  async function initHomepagePreview() {
    const fishPreview  = document.getElementById('home-fish-preview');
    const fruitPreview = document.getElementById('home-fruit-preview');
    if (!fishPreview && !fruitPreview) return;

    if (fishPreview) {
      const fishData = await fetchJSON('data/fish.json');
      if (fishData) {
        const preview = [];
        fishData.categories.forEach((cat) => {
          cat.products.slice(0, 1).forEach((p) => preview.push({ p, cat }));
        });
        fishPreview.innerHTML = preview.slice(0, 4).map(({ p }) => {
          const src   = imgSrc(p.image_url, p.fallback_image_url, PLACEHOLDER_FISH);
          const onErr = onerrorAttr(p.fallback_image_url, PLACEHOLDER_FISH);
          return `
            <div class="home-preview-chip">
              <img src="${esc(src)}" alt="${esc(p.fish_name)}"
                   loading="lazy" width="32" height="32" onerror="${onErr}" />
              <span>${esc(p.fish_name)}</span>
            </div>`;
        }).join('');
      }
    }

    if (fruitPreview) {
      const fruitData = await fetchJSON('data/fruits.json');
      if (fruitData) {
        const mangoCat = fruitData.categories.find((c) => c.id === 'mango');
        if (mangoCat) {
          fruitPreview.innerHTML = mangoCat.products.slice(0, 4).map((p) => {
            const src   = imgSrc(p.image_url, p.fallback_image_url, PLACEHOLDER_FRUIT);
            const onErr = onerrorAttr(p.fallback_image_url, PLACEHOLDER_FRUIT);
            return `
              <div class="home-preview-chip">
                <img src="${esc(src)}" alt="${esc(p.mango_variety)}"
                     loading="lazy" width="32" height="32" onerror="${onErr}" />
                <span>${esc(p.mango_variety)}</span>
              </div>`;
          }).join('');
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    initAquaBounty();
    initTropiqHarvest();
    initHomepagePreview();
  });

})();
