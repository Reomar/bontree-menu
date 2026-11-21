# Bon Tree menu

A menu-only GitHub Pages site for `bontree.coffee`. It displays `menu.pdf` directly, with no surrounding interface. PDF.js loads PDF data and renders pages as visitors scroll, and the browser's normal pinch or page zoom remains available. The current PDF is compressed and optimized for web viewing.

## Preview

Run `python3 -m http.server 8000` from this directory and open `http://localhost:8000`. A web server is needed for the PDF renderer.

## Update the menu

Replace `menu.pdf` with the new PDF, preview it, and commit the change. Keep the filename `menu.pdf`. To avoid serving cached older files, replace the version in `viewer.mjs`, the viewer script URL, and all PDF links in `index.html` with the first 12 characters from `shasum -a 256 menu.pdf`. The site renders every page automatically. `cover.jpg` is the first page shown while the PDF loads, and `og.jpg` is a landscape crop of that page for social sharing. If the cover changes, regenerate both images and inspect the crop:

```sh
pdftoppm -f 1 -l 1 -singlefile -scale-to 1200 -jpeg -jpegopt quality=90 menu.pdf cover
swift scripts/create-og.swift menu.pdf og.jpg
```

The crop is centered on the tree logo in the current PDF. Adjust the focal point in the script if a future cover has a different layout. If the new cover has different proportions, update the `cover.jpg` dimensions in `index.html`.

## GitHub Pages and domain

Publish the repository from the root of its default branch. `CNAME` specifies `bontree.coffee`. Configure the same domain in the repository's Pages settings and check the DNS and HTTPS settings before making any changes to existing records.

`vendor/` contains the official PDF.js 6.5.438 browser distribution and its license.
