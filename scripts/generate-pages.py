#!/usr/bin/env python3
"""Generate small, responsive images for the current menu PDF."""

from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "menu.pdf"
INDEX = ROOT / "index.html"
START = "    <!-- BEGIN GENERATED MENU PAGES -->"
END = "    <!-- END GENERATED MENU PAGES -->"


def run(command):
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)


def render_page(number, directory):
    stem = directory / f"page-{number:02d}"
    run(["pdftoppm", "-f", str(number), "-l", str(number), "-singlefile",
         "-scale-to-x", "2000", "-scale-to-y", "-1", "-png", str(PDF), str(stem)])
    png = stem.with_suffix(".png")
    with png.open("rb") as image:
        header = image.read(24)
    if not header.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError(f"Could not read rendered page {number}")
    width, height = struct.unpack(">II", header[16:24])
    for target in (1000, 2000):
        output = directory / f"page-{number:02d}-{target}.webp"
        command = ["cwebp", "-quiet", "-q", "82", "-m", "6"]
        if target != width:
            command += ["-resize", str(target), "0"]
        run(command + [str(png), "-o", str(output)])
    png.unlink()
    return width, height


def main():
    for command in ("pdfinfo", "pdftoppm", "cwebp"):
        if not shutil.which(command):
            raise SystemExit(f"Missing required command: {command}")

    index = INDEX.read_text(encoding="utf-8")
    if index.count(START) != 1 or index.count(END) != 1:
        raise SystemExit("Could not find the menu page markers in index.html")
    info = subprocess.run(["pdfinfo", str(PDF)], check=True, capture_output=True, text=True).stdout
    count_match = re.search(r"^Pages:\s+(\d+)\s*$", info, re.MULTILINE)
    if not count_match or int(count_match.group(1)) < 1:
        raise SystemExit("Could not determine the PDF page count")
    count = int(count_match.group(1))
    version = sha256(PDF.read_bytes()).hexdigest()[:12]

    with tempfile.TemporaryDirectory(prefix="bontree-pages-") as temporary:
        directory = Path(temporary)
        with ThreadPoolExecutor(max_workers=3) as pool:
            dimensions = list(pool.map(lambda number: render_page(number, directory), range(1, count + 1)))

        destination = ROOT / "pages" / version
        destination.mkdir(parents=True, exist_ok=True)
        for image in directory.glob("*.webp"):
            shutil.move(str(image), destination / image.name)

    tags = []
    for number, (width, height) in enumerate(dimensions, 1):
        stem = f"pages/{version}/page-{number:02d}"
        loading = "eager" if number <= 2 else "lazy"
        priority = ' fetchpriority="high"' if number == 1 else ""
        tags.append(
            f'    <img class="page" data-page="{number}" src="{stem}-1000.webp" '
            f'srcset="{stem}-1000.webp 1000w, {stem}-2000.webp 2000w" '
            f'sizes="(max-width: 1000px) 100vw, 1000px" width="{width}" height="{height}" '
            f'alt="القائمة، الصفحة {number} من {count}" loading="{loading}" decoding="async"{priority}>'
        )

    before, remainder = index.split(START, 1)
    _, after = remainder.split(END, 1)
    updated = before + START + "\n" + "\n".join(tags) + "\n" + END + after
    updated = re.sub(r"menu\.pdf\?v=[0-9a-f]+", f"menu.pdf?v={version}", updated)
    INDEX.write_text(updated, encoding="utf-8")
    print(f"Generated {count} menu pages in pages/{version}/")


if __name__ == "__main__":
    main()
