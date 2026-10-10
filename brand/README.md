# Default BoothWall artwork

Sources for the default look. The files the apps actually use live next to the code:

| Source     | Rendered to                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `logo.svg` | `packages/wall-ui/src/assets/brand/logo.png`, `apps/web/src/assets/brand/logo.png`                                          |
| `icon.svg` | `apps/tv/assets/image/app_icon.png` (512), `apps/web/public/apple-touch-icon.png` (180), `apps/web/public/favicon.png` (64) |

The default wall backdrop (`packages/wall-ui/src/assets/brand/backdrop.jpg`) and the glow behind the phone pages (`apps/web/src/assets/brand/glow.jpg`) are generated images, not rendered from here; `backdrop.svg` and `glow.svg` are simple vector fallbacks in the same colours. The demo photos (`packages/wall-ui/src/assets/demo`) mix generated booth scenes with the author's own photos from the next.app devCon 2026 booth.

To brand your own wall, replace the rendered files with your artwork using the same names. The apps pick up any logo aspect ratio. To tweak the defaults instead, edit an SVG and render it again, for example with `rsvg-convert` and ImageMagick:

```sh
rsvg-convert brand/logo.svg | magick - -trim +repage -bordercolor none -border 6 packages/wall-ui/src/assets/brand/logo.png
rsvg-convert -w 512 brand/icon.svg -o apps/tv/assets/image/app_icon.png
```

The colours match the default `theme` in `packages/shared/src/config/boothwall.config.ts`. The logo text is set in Avenir Next; use any font you like.
