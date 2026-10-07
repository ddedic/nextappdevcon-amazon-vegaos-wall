# Contributing

Thanks for taking a look. Issues and pull requests are welcome, especially from anyone building for Vega OS.

## Getting set up

Follow [Getting started](README.md#getting-started) in the README. You don't need a Fire TV: the Vega Virtual Device runs on a Mac, and the TV app has a simulation mode (`simulation.enabled` in `apps/tv/src/app/app.config.ts`) that works without the API.

## Before you open a pull request

```sh
pnpm typecheck && pnpm lint && pnpm test && pnpm format:check
```

CI runs the same checks. If you touch the TV app, also make sure `pnpm tv:build:debug` still builds.

## How the code is organised

- Everything lives in named folders; only `index.ts` sits at a feature or module root.
- API modules are split into `http/`, `domain/` and `data/` (see [docs/architecture.md](docs/architecture.md)).
- Frontend features are split into `screens/` or `pages/`, `components/`, `hooks/`, `data/`, `state/` and `constants/`.
- Import across folders with the `@/` alias, and only through a module's or feature's `index.ts`.
- Keep comments short and only where something isn't obvious.

## Good places to start

Look for issues labelled [`good first issue`](https://github.com/ddedic/nextappdevcon-amazon-vegaos-wall/labels/good%20first%20issue) or [`help wanted`](https://github.com/ddedic/nextappdevcon-amazon-vegaos-wall/labels/help%20wanted). If you hit a Vega OS gotcha that isn't in [docs/vega-os-notes.md](docs/vega-os-notes.md), a pull request adding it is very welcome.
