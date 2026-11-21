# Bon Tree menu

A menu-only GitHub Pages site for `bontree.coffee`. It displays responsive images generated from `menu.pdf`, with no surrounding interface. The first pages load immediately and later pages load as visitors scroll. The browser's normal pinch or page zoom remains available, and the PDF is available as a fallback.

## Preview

Run `python3 -m http.server 8000` from this directory and open `http://localhost:8000`.

## Update the menu

Replace `menu.pdf` with the new PDF and regenerate the menu pages:

```sh
python3 scripts/generate-pages.py
```

The script requires Python 3, Poppler's `pdfinfo` and `pdftoppm`, and `cwebp`. It creates 1000px and 2000px images for every page, updates the generated page list in `index.html`, and uses a PDF-derived version in the image paths and PDF links to avoid stale caches. Preview the site, check the first and last pages and their text, and commit `menu.pdf`, `index.html`, and the new `pages/` directory. Old versioned page directories can be removed after checking the new menu.

`og.jpg` is a landscape crop of the first page for social sharing. `cover.jpg` is kept for visitors with a cached copy of the older PDF.js viewer. If the cover changes, regenerate both and inspect the crop:

```sh
pdftoppm -f 1 -l 1 -singlefile -scale-to 1200 -jpeg -jpegopt quality=90 menu.pdf cover
swift scripts/create-og.swift menu.pdf og.jpg
```

The crop is centered on the tree logo in the current PDF. Adjust the focal point in the script if a future cover has a different layout.

## GitHub Pages and domain

Publish the repository from the root of its default branch. `CNAME` specifies `bontree.coffee`. Configure the same domain in the repository's Pages settings and check the DNS and HTTPS settings before making any changes to existing records.

`viewer.mjs` and `vendor/` retain the older PDF.js viewer and its official 6.5.438 distribution for visitors with cached pages.
