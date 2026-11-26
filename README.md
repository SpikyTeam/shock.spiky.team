# shock.spiky.team

The personal page published at [shock.spiky.team](https://shock.spiky.team).

The page is static: the name, handle and avatar are part of its HTML, so the
old server-side profile refresh is gone and the page only changes when its
source changes — `shock/` in [SpikyMC-Sites](../SpikyMC-Sites), assembled by
that repository's `.github/workflows/pages.yml`.

GitHub Pages builds this repository itself: `.github/workflows/publish.yml`
pushes the assembled page onto the `gh-pages` branch Pages serves.
