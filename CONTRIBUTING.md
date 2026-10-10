# Contributing

Thanks for taking a look. Issues and pull requests are welcome, especially from anyone building for Vega OS.

## Getting set up

Follow [Try it](README.md#try-it) in the README. You don't need a Fire TV or a Cloudflare account: the Vega Virtual Device runs on a Mac, and the web wall runs in any browser. The committed config talks to the public demo API; set `demo: true` in `packages/shared/src/config/boothwall.config.ts` (or add `?demo` in the browser) to work offline on the bundled photos.

## Commands

| Command                                          | What it does                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `pnpm web:dev`                                   | The web app: the wall at `/`, the upload page at `/snap`, the Control panel at `/control`     |
| `pnpm api:dev`                                   | The API on your machine, no Cloudflare account needed (see [below](#running-the-api-locally)) |
| `pnpm tv:build:debug` / `tv:build:release`       | Build the TV app, one `.vpkg` per architecture                                                |
| `pnpm tv:vvd:start:1080` / `tv:vvd:restart:1080` | Start or restart the Virtual Device at 1080p (restart also relaunches the app)                |
| `pnpm tv:run:vvd`                                | Install and launch the debug build on the Virtual Device                                      |
| `pnpm remote`                                    | A laptop remote for the TV at http://localhost:4400                                           |
| `pnpm boothwall setup`                           | One-time Cloudflare setup and first deploy                                                    |
| `pnpm boothwall deploy`                          | Apply migrations, then redeploy the API and the web app                                       |
| `pnpm boothwall example [name]`                  | List the examples, or apply one's config and artwork                                          |

## Running the API locally

No Cloudflare account needed. `cf dev` simulates D1, R2 and the Durable Object, and keeps their data in `apps/api/.cloudflare/state`.

```sh
cp apps/api/.dev.vars.example apps/api/.dev.vars   # set ADMIN_TOKEN, the local booth passcode
pnpm --filter @boothwall/api db:migrate:local      # create the local database
pnpm api:dev                                       # serves the API on the URL it prints
```

Control panel routes take the token as `Authorization: Bearer <ADMIN_TOKEN>`. To use the upload page and the Control panel against it, run `VITE_API_URL=<the printed URL> pnpm --filter @boothwall/web exec vite` and open `/snap` or `/control`. The wall itself reads `urls.api` from the config (the TV has no environment variables), so to point the wall at your local API, change `urls.api` for the session and don't commit it. Run the migrate step again after pulling new migrations.

## Changing the database

Edit `apps/api/src/db/schema.ts`, run `pnpm --filter @boothwall/api db:generate`, then apply the new migration with `pnpm --filter @boothwall/api db:migrate:local` (and `pnpm boothwall deploy` for your Cloudflare account).

## Before you open a pull request

```sh
pnpm typecheck && pnpm lint && pnpm test && pnpm format:check
```

CI runs the same checks. If you touch the TV app or `packages/wall-ui`, also make sure `pnpm tv:build:debug` still builds and the wall still runs at `/` in `pnpm web:dev`.

## How the code is organised

- Everything lives in named folders; only `index.ts` sits at a feature or module root.
- API modules are split into `http/`, `domain/` and `data/` (see [docs/architecture.md](docs/architecture.md)).
- Frontend features are split into `screens/` or `pages/`, `components/`, `hooks/`, `data/`, `state/` and `constants/`.
- Import across folders with the `@/` alias, and only through a module's or feature's `index.ts`. `packages/wall-ui` is the exception: both apps compile it from source, so its imports are relative.
- Keep comments short and only where something isn't obvious.

## Good places to start

Look for issues labelled [`good first issue`](https://github.com/ddedic/boothwall/labels/good%20first%20issue) or [`help wanted`](https://github.com/ddedic/boothwall/labels/help%20wanted). If you hit a Vega OS gotcha that isn't in [docs/vega-os-notes.md](docs/vega-os-notes.md), a pull request adding it is very welcome.
