# Customising BoothWall

A wall is yours once you've changed two things: one config file and a handful of images. You shouldn't need to touch the app code.

## The config file

[`packages/shared/src/config/boothwall.config.ts`](../packages/shared/src/config/boothwall.config.ts) is read by the TV app, the web app and the API when they build. It's checked against a schema every time, so a typo fails the build instead of your booth.

The copy in the repo runs the public demo at boothwall.dedic.dev. Change at least `event`, `categories` and `deploy` before you run `pnpm boothwall setup`. Setup notices that the database id belongs to someone else and creates a new one in your account, but it stops if the demo's domains are still set.

| Field                                  | What it does                                                                                                                                                                                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `event.name`                           | Shown in page titles, on the upload page and as the logo's accessibility label.                                                                                                                                                                                                    |
| `event.hashtag`                        | Printed on the TV and on every polaroid. Starts with `#`.                                                                                                                                                                                                                          |
| `event.venue`                          | Optional. Shown on the upload page and the phone feed ("Live wall · CITYCUBE Berlin").                                                                                                                                                                                             |
| `event.year`                           | Optional, four digits. Drawn as a stacked "20 / 26" next to the logo on the TV.                                                                                                                                                                                                    |
| `categories`                           | What visitors pick when they upload: tracks, teams, conferences. Each has an `id` (lowercase and stored with every photo, so don't rename it mid-event) and a `label`. Mark one `catchAll: true` for "Just visiting": it isn't printed on polaroids and sits below the other bars. |
| `theme.primary`                        | The main brand colour: buttons, hashtags, highlights and the glow around the selected photo.                                                                                                                                                                                       |
| `theme.secondary`                      | Category labels on polaroids, the category chip in the spotlight and the phone feed.                                                                                                                                                                                               |
| `theme.tertiary`                       | A spare accent. The default design doesn't use it; on the web it's there as `--color-tertiary`.                                                                                                                                                                                    |
| `urls.api`                             | Your API. Filled in by `pnpm boothwall setup`.                                                                                                                                                                                                                                     |
| `urls.web`                             | Your web app: the wall at `/`, the upload page at `/snap` (where the TV's QR code points) and `/control`. Filled in by setup.                                                                                                                                                      |
| `urls.source`                          | Where your code lives, for the "Scan for the source" card on the TV.                                                                                                                                                                                                               |
| `author.handle`                        | The small credit on the TV and the upload page.                                                                                                                                                                                                                                    |
| `demo`                                 | `true` runs the TV and the web wall on the bundled photos, with no API or network. Setup turns it off.                                                                                                                                                                             |
| `retentionDays`                        | Photos are deleted this many days after upload, unless marked `keep` through the API. The consent text quotes it.                                                                                                                                                                  |
| `deploy.name`                          | The base name for your Cloudflare resources: Workers `<name>-api` and `<name>`, D1 database `<name>`, R2 bucket `<name>-photos`. Set it before the first setup.                                                                                                                    |
| `deploy.d1DatabaseId`                  | Filled in by setup.                                                                                                                                                                                                                                                                |
| `deploy.apiDomain`, `deploy.webDomain` | Custom domains on a zone in your Cloudflare account, or `""` for workers.dev. Set them before setup. If you change them later, run `pnpm boothwall deploy` and update `urls` to match.                                                                                             |

Use two separate subdomains for the API and the web app, like `wall.example.com` and `wall-api.example.com`. Cloudflare's free certificate covers one level of subdomain, so `api.wall.example.com` would need a paid one.

### Colours

Pick the colours you like. Text drawn on a brand colour is black or white, whichever reads better, and a brand colour used as text (a hashtag on the dark TV, a category on a white polaroid) is shaded just enough to stay readable.

## Brand images

Replace these with your own, keeping the file names. Any logo aspect ratio works.

| File                                                  | Used for                         | Size                       |
| ----------------------------------------------------- | -------------------------------- | -------------------------- |
| `packages/wall-ui/src/assets/brand/logo.png`          | The wall's top bar (TV and web)  | about 800×180, transparent |
| `packages/wall-ui/src/assets/brand/backdrop.jpg`      | The wall's background            | 960×540, already darkened  |
| `apps/tv/assets/image/app_icon.png`                   | The Fire TV app icon             | 512×512                    |
| `apps/web/src/assets/brand/logo.png`                  | The upload page and phone header | about 800×180, transparent |
| `apps/web/src/assets/brand/glow.jpg`                  | The glow behind the phone pages  | 1600×1000                  |
| `apps/web/public/favicon.png`, `apple-touch-icon.png` | Browser and home-screen icons    | 64×64, 180×180             |
| `packages/wall-ui/src/assets/demo/demo-*.jpg`         | Demo mode only                   | about 600×600              |

The logo and icons are rendered from the SVGs in [`brand/`](../brand), and the backdrop and glow are generated images. Keep the backdrop dark in the middle, where the photos sit: the wall draws it as it is, with no dimming layer on top. Keep it at 960×540 too. The TV scales it up anyway, and a full 1080p image only costs memory on a Stick.

The demo photos mix generated booth scenes (`demo-01` to `demo-24`) with the author's own photos from the next.app devCon 2026 booth (`demo-25` to `demo-52`). Their captions and categories are in `packages/wall-ui/src/features/wall/data/demoPhotos.ts`. Swap in your own there, or leave them; they only show while `demo` is on or with `?demo` in the browser.

## Examples

[`examples/`](../examples) holds complete setups that mirror the repo layout. `pnpm boothwall example nextapp-devcon` applies one, and `git checkout -- apps packages` undoes it. If you run BoothWall at your event, a pull request with your setup is welcome, as long as you're allowed to share the artwork.

## After a change

- **API or web app:** `pnpm boothwall deploy`.
- **TV:** rebuild and reinstall (`pnpm tv:build:release`, then `vega run-app …`). The config is bundled into the app, so a TV keeps the old values until you do.
