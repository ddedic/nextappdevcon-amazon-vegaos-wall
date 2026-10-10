# Example: next.app devCon 2026

BoothWall started as Live Wall, the photo wall at next.app devCon 2026 in Berlin. This folder is that setup, kept as a worked example of a fully branded wall: the config, the logo, the TV backdrop, the glow behind the phone pages and the app icons. The code as it ran at the event is on the [`devcon-2026`](https://github.com/ddedic/boothwall/tree/devcon-2026) branch, tagged [v1.0.0](https://github.com/ddedic/boothwall/releases/tag/v1.0.0).

The folder mirrors the repo layout. Apply it from the repo root with:

```sh
pnpm boothwall example nextapp-devcon
```

Then build and deploy as usual. To go back to the default BoothWall look, restore those files with `git checkout -- apps packages`.

## Brand assets

The next.app devCon logos and artwork in this folder belong to their owners and are **not** covered by the repository's MIT license. They're here so you can see a real event's branding end to end. Use your own for your event.
