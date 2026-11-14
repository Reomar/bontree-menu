# Bon Tree menu

A menu-only GitHub Pages site for `bontree.coffee`. It displays `menu.pdf` directly, with no surrounding interface. PDF.js renders pages as visitors scroll, and the browser's normal pinch or page zoom remains available.

## Preview

Run `python3 -m http.server 8000` from this directory and open `http://localhost:8000`. A web server is needed for the PDF renderer.

## Update the menu

Replace `menu.pdf` with the new PDF, preview it, and commit the change. Keep the filename `menu.pdf`. The site renders every page automatically. `og.jpg` is a copy of the PDF's first page used as the initial cover and social preview; update it if the cover changes. With Poppler installed, regenerate it with `pdftoppm -f 1 -l 1 -singlefile -scale-to 1200 -jpeg -jpegopt quality=90 menu.pdf og`. If the new cover has different proportions, update its dimensions in `index.html`.

## GitHub Pages and domain

Publish the repository from the root of its default branch. `CNAME` specifies `bontree.coffee`. Configure the same domain in the repository's Pages settings and check the DNS and HTTPS settings before making any changes to existing records.

`vendor/` contains the official PDF.js 6.5.438 browser distribution and its license.
