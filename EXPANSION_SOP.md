# S&S Logistics — Site Expansion SOP
## How to Add New Pages & Product Lines Without Breaking the Architecture

---

## 1. Understanding the Architecture in 60 Seconds

```
snslogisticsbd.com/
├── shared.css          ← ALL colours, ALL spacing, ALL theme tokens
├── shared.js           ← ALL global behaviour (nav, menu, theme toggle, forms)
├── catalog.js          ← Reads JSON files, renders product grids
├── fish.json           ← AquaBounty product data
├── fruits.json         ← TropiqHarvest product data
├── index.html          ← Homepage
├── acquabounty.html    ← AquaBounty brand page
├── tropiqharvest.html  ← TropiqHarvest brand page
├── services.html       ← Services page
└── about.html          ← About & Contact page
```

**Rule 1:** Never hardcode hex colour values (e.g. `#0d1520`) in any page's `<style>` block.
Always use the CSS variables defined in `shared.css` (e.g. `var(--card)`, `var(--ink2)`).

**Rule 2:** Never duplicate nav, mobile menu, footer, or form logic in page-specific JS.
All of that lives in `shared.js` which is loaded on every page.

**Rule 3:** The theme engine is automatic — if you use CSS variables, your page gets
Light/Dark for free. If you hardcode a hex value, that element will be stuck in one theme.

---

## 2. Adding a New Product Line (e.g. Vegetables)

### Step A — Create the JSON file

Copy the structure of `fruits.json`. Save it as `vegetables.json` in the root:

```json
{
  "catalog_meta": {
    "brand": "GreenRoot",
    "tagline": "Farm-Fresh Bangladeshi Vegetables",
    "last_updated": "2026-06-01"
  },
  "categories": [
    {
      "id": "leafy",
      "label": "Leafy Vegetables",
      "products": [
        {
          "id": "lv-001",
          "vegetable_name": "Spinach",
          "local_name": "Palang Shak",
          "image_url": "/images/vegetables/spinach.webp",
          "fallback_image_url": "/images/vegetables/placeholder.webp",
          "availability_status": "available",
          "description": "Fresh Bangladeshi spinach, export grade."
        }
      ]
    }
  ]
}
```

### Step B — Add images

Upload images to `/images/vegetables/` following the same naming convention:
- Filename must match `image_url` in the JSON exactly
- Format: `.webp` (convert from PNG using Squoosh.app — saves ~70% size)
- Keep under 150KB per image

### Step C — Create the HTML page

1. Duplicate `tropiqharvest.html` → save as `greenroot.html` (or your brand name)
2. Find and replace all instances of:
   - `TropiqHarvest` → `GreenRoot`
   - `tropiqharvest` → `greenroot`
   - `th-` CSS prefixes → `gr-` (in the inline `<style>` block)
   - `fruits.json` → `vegetables.json`
   - `th-contact` → `gr-contact`
3. Update the `<title>`, all `<meta>` tags, and JSON-LD structured data at the top
4. Update the hero image URL
5. Update the contact email addresses

### Step D — Update `catalog.js`

At the bottom of `catalog.js`, add a new init function:

```javascript
function initGreenRoot() {
  // Same pattern as initTropiqHarvest() — fetch vegetables.json,
  // render into #gr-veggie-grid
  fetch('vegetables.json')
    .then(r => r.json())
    .then(data => {
      // render cards...
    });
}

// Add to the bottom dispatcher:
if (document.getElementById('gr-veggie-grid')) initGreenRoot();
```

### Step E — Update the nav dropdown on ALL 5 pages

In every HTML file, find the "Coming Soon" block in the nav dropdown:

```html
<div class="dd-soon-item">🥦 <span>Vegetables</span><span class="dd-soon-badge">Soon</span></div>
```

Change it to a real link:

```html
<a href="greenroot.html" role="menuitem">
  <span class="dd-icon">🥦</span>
  <span class="dd-text">
    <span class="dd-name">GreenRoot</span>
    <span class="dd-tag">Fresh Vegetables Export</span>
  </span>
</a>
```

Do this in: `index.html`, `acquabounty.html`, `tropiqharvest.html`, `services.html`, `about.html`.

Also add to the mobile menu sub-links section in each file:
```html
<a href="greenroot.html">GreenRoot — Vegetables</a>
```

### Step F — Update robots.txt

Add to the `Allow` section:
```
Allow: /greenroot.html
Allow: /images/vegetables/
```

### Step G — Update sitemap.xml

Add a new `<url>` entry:
```xml
<url>
  <loc>https://snslogisticsbd.com/greenroot.html</loc>
  <lastmod>2026-06-03</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.90</priority>
</url>
```

---

## 3. Adding a New Standalone Page (e.g. Pricing, FAQ, Blog Post)

If the page does NOT need a product catalog (no JSON, no `catalog.js`):

1. **Duplicate `services.html`** — it's the cleanest template (no catalog dependency)
2. Remove the page-specific `<style>` rules you don't need
3. Replace all content
4. Update `<title>`, meta tags, and JSON-LD
5. Add `<script src="shared.js"></script>` before `</body>` (no `catalog.js` needed)
6. Add the theme toggle to the Navigate footer column (copy from any existing page)
7. Update nav on all 5 existing pages to include the new link
8. Add to `robots.txt` and `sitemap.xml`

---

## 4. The CSS Variable Checklist (Preventing Theme Bugs)

Every time you write a background, colour, or border in a `<style>` block, ask:

| If you want... | Use this token |
|---|---|
| Page background | `var(--ink)` |
| Slightly darker bg | `var(--ink2)` |
| Darkest bg (section) | `var(--ink3)` |
| Card/panel bg | `var(--card)` |
| Secondary card bg | `var(--card2)` |
| Deep section bg | `var(--page-deep)` |
| Gold text/accent | `var(--gold)` |
| Body text | `var(--cream)` |
| Muted text | `var(--sand)` |
| Gold border (light) | `var(--border-gold)` |
| White/grey border | `var(--border-white)` |
| Teal accent | `var(--teal-bright)` |
| Shadow | `var(--shadow-dark)` |

**Never use**: `#0d1117`, `#0d1520`, `#07090c`, `#0a0e13`, `rgba(13,17,23,...)` directly.
These are hardcoded dark values that will break in Light Mode.

---

## 5. Adding Products to an Existing JSON (No Page Changes Needed)

To add a new fish species to AquaBounty:

1. Open `fish.json`
2. Find the correct category (`fresh_water`, `sea_water`, `ready_to_cook`, or `dry_fish`)
3. Add a new product object following the existing pattern:
```json
{
  "id": "fw-new-001",
  "fish_name": "Silver Carp",
  "local_name": "Silver Carp",
  "image_url": "/images/fish/fresh_water/silver_carp.webp",
  "fallback_image_url": "/images/fish/placeholder.webp",
  "availability_status": "available",
  "export_specifications": {
    "forms": ["IQF", "Block Frozen"],
    "storage_temp_c": -18
  }
}
```
4. Upload the image to `/images/fish/fresh_water/silver_carp.webp`
5. Redeploy — the count in the stats, the product grid, and the inquiry form dropdown
   all update automatically via `data-count="fish"` and `catalog.js`

**Image subdirectory note:** The fish images are further organised:
- `/images/fish/fresh_water/` — freshwater species
- `/images/fish/sea_water/` — seawater/marine species
- `/images/fish/dry_fish/` — dried fish and prawns
- `/images/fish/ready_to_cook/` — processed/RTC products

Match the `image_url` path to the correct subfolder.

---

## 6. Deployment Checklist

Before every Cloudflare Pages deployment:

- [ ] All `<style>` block colours use CSS variables (no hex hardcoding)
- [ ] New images are `.webp` format and under 150KB each
- [ ] Total deployment size is under 25MB (run `du -sh .` in project root)
- [ ] `robots.txt` has `Allow` entries for any new directories
- [ ] `sitemap.xml` has `<url>` entries for any new pages
- [ ] Nav dropdown updated on all 5 pages (or however many exist)
- [ ] Footer Navigate column has theme toggle HTML on new pages
- [ ] `shared.js` and `shared.css` are referenced as `shared.js` / `shared.css`
  (update paths if you move to `/js/` and `/css/` subdirectories)
