# Building for Vega OS: notes from the field

Vega OS is new, and a lot of what you need to know isn't written down yet. These are the things I ran into while building the BoothWall TV app with React Native for Vega (SDK 0.24, React Native 0.83) on an Apple Silicon Mac. Each one cost me some time. If you find one that's missing or out of date, a pull request is very welcome.

## At a glance

| Topic                    | How BoothWall does it                                                                                                     | Where                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Remote input             | `useTVEventHandler` from `@amazon-devices/react-native-kepler`, acting on key up only (every press arrives twice)         | `apps/tv/src/platform/useVegaRemote.ts`                |
| Kiosk-safe Back          | `BackHandler` closes the spotlight; on the wall a second Back within 2.5 s calls `exitApp()`, with an on-screen hint      | `features/wall/hooks/useWallRemote.ts`                 |
| Layout                   | Everything is sized on a 960×540 dp canvas, which a 1080p TV draws at 2×                                                  | `theme/tokens.ts`, `features/wall/constants/layout.ts` |
| Smooth motion on a Stick | Only `transform` and `opacity` animate, on the native driver; flat shadows on moving cards; 480 px thumbnails on the wall | `features/wall/components/`                            |
| Realtime                 | A WebSocket with backoff, a connecting screen until the first snapshot, and a fresh snapshot on every reconnect           | `features/wall/hooks/useWallFeed.ts`                   |
| Builds                   | The JavaScript is bundled into the `.vpkg`, so rebuild after a change; Metro alone doesn't update an installed app        | `apps/tv/package.json`                                 |
| Testing without a TV     | The Virtual Device at 1080p, demo mode, and a laptop remote that sends real key presses through `inputd-cli`              | `scripts/remote/`                                      |

Paths are relative to `packages/wall-ui/src` unless they start with `apps/` or `scripts/`. The rest of this page is the gotchas behind these.

## Setup

**The installer can stop halfway.** If `vega sdk list-installed` says "No SDK versions installed" after running `get_vvm.sh`, the SDK download was interrupted and only the Virtual Device got installed. Run `vega sdk install <version> --non-interactive` to finish it. The installer also doesn't always create `~/vega/env`; adding `export PATH="$HOME/vega/bin:$PATH"` to your shell profile is enough.

**It's `build-vega`, not `build-kepler`.** Kepler was Vega's internal name, and older samples still call `react-native build-kepler`. The current template uses `react-native build-vega --build-type Debug|Release`. You get one `.vpkg` per architecture: `armv7` for Fire TV Sticks, `aarch64` for the Virtual Device on Apple Silicon, `x86_64` for Intel. The package file is named after your `package.json` name, so a package called `@scope/tv` builds `tv_aarch64.vpkg`.

**pnpm works, with a flat node_modules.** Vega's templates assume npm or Yarn, and Vega Studio doesn't support pnpm, but the CLI does. Metro, autolinking and the build tools expect a flat `node_modules`, so set `node-linker=hoisted` in `.npmrc` and `NPM_EXECPATH=$(which pnpm)` when building.

## The manifest

- **Icons need the extension, and keep the title ASCII.** Use `icon = "@image/app_icon.png"`, not `@image/app_icon`; it points at `assets/image/app_icon.png` (512×512 PNG). Without the extension the build only warns that the icon is missing. I also had a `×` in `title` at the time, and the install failed with "Package is invalid". Fixing both solved it, so I'd avoid non-ASCII titles.
- **Set a build number:** `build-number = 1` in `[package]` clears the `build_number is 0` warning.
- **Declare the services you use.** Remote key events need `com.amazon.inputd.service`. Without it they silently don't arrive. Networking works without a declaration for now, but the device log warns that it's only allowed through a temporary exception list. Declare `com.amazon.network.service` plus the `/com.amazon.kepler.net.net_manager@INetManager` module.

## Layout and input

- **The canvas is 960×540 dp.** A 1080p TV renders at 2x. If you size things for 1920×1080, everything comes out doubled.
- **Remote events come twice.** `useTVEventHandler` from `@amazon-devices/react-native-kepler` reports a key down (`eventKeyAction: 0`) and a key up (`1`). Act on one of them or every press fires twice. OK arrives as `enter`, not only `select`.
- **OK may only reach the focused view.** On a screen with no focusable elements, the Virtual Device's on-screen OK button can skip the global handler. An invisible, always-focused `Pressable` with `hasTVPreferredFocus` catches it.
- **Back exits the app unless you stop it.** For a kiosk-style app, add a `BackHandler` listener for `hardwareBackPress` that returns `true`.

## Rendering and animation

- **Changing `zIndex` makes images blink.** Reordering native views on Vega made neighbouring images flash. Keep z-order fixed and draw "lifted" content in a separate top layer.
- **Don't remount an image to animate it out.** A new component means a new image load and an empty frame. Keep the same instance while it fades.
- **Build Animated nodes once.** Recreating `interpolate` and `add` nodes on every render makes native-driven motion jump. `useMemo` them, and memoize image `source` objects too.
- **zod v4 needs one Babel plugin.** It ships `export * as ns` syntax that the React Native preset doesn't transform. Add `@babel/plugin-transform-export-namespace-from`.

## Performance on Vega OS

The current Vega OS sticks (Fire TV Stick 4K Select, Stick HD and Stick 4K 3rd gen) share the same budget: four Cortex-A55 cores at up to 1.7 GHz, a Mali G310 GPU and 1 GB of RAM ([device specs](https://developer.amazon.com/docs/device-specs/device-specifications-fire-tv-streaming-media-player.html)). Amazon's targets are foreground memory under 400 MiB (the platform enforces 420 MB) and UI fluidity above 99% ([app KPIs](https://developer.amazon.com/docs/vega/0.24/measure-app-kpis.html), [FAQ](https://developer.amazon.com/docs/vega/0.24/faq.html)). What that meant for the wall:

- **Decode images at the size you draw them.** A wall card is about 210 px wide at 1080p, but uploads are 1080 px, so every card decoded about 27 times the pixels it showed. The phone now uploads a 480 px thumbnail next to the original. Wall cards use `thumbUrl`, and only the spotlight loads `imageUrl`. Vega's `Image` caches natively, so there's no extra image library ([best practices](https://developer.amazon.com/docs/vega/0.24/best_practices.html)).
- **Ship the backdrop at canvas size.** The backdrop is 960×540 with its dimming baked in, so there's one opaque full-screen layer instead of a 1080p image under a translucent scrim.
- **No blurred shadows on moving things.** Eleven drifting cards each had a 12 dp shadow. Wall cards now sit on a flat offset plate, and only the lifted card and the spotlight card get a real shadow. The focus ring is a white border plus a flat brand-coloured halo, not a glow.
- **Animate as little as possible.** The drift only moves cards up and down (rotation is fixed), runs on the native driver, and stops for a card that's hidden under its lifted copy.
- **Fewer translucent panels.** The now-showing strip is plain text and a 2 dp line on the backdrop, with no bordered box behind it.
- **Reconnect politely.** The WebSocket backoff has jitter and only resets once the server sends something, so a socket that opens and drops straight away doesn't retry every second.
- **Tilted cards need a texture.** A rotated view on Vega draws with hard, stair-stepped edges. `renderToHardwareTextureAndroid` on the tilted card draws it once into a texture, which gets filtered edges and is cheaper to move. The soft shadow under each card is two faint, slightly larger rounded rects, not a blur.
- **Long runs.** A booth leaves the wall on all day. Two leaks would have grown without limit: the simulated feed kept every photo, and a card replaced before its "new" badge settled stayed in the fresh list forever. Both are capped now. A socket that dies silently, for example after the TV sleeps, is dropped after two missed pongs. An error boundary shows "Restarting the wall…" and remounts instead of leaving a red or blank screen.
- **Image cache.** Vega exposes `Image.prefetch`, `queryCache` and `abortPrefetch`, but no way to clear the cache. The wall prefetches the next full-size photo shortly before the spotlight needs it, and retries a failed load twice before showing the placeholder.
- **Don't add image variants the demo doesn't need.** 320 px wall copies of the demo photos measured worse: the demo cycles through few enough photos that both sizes end up decoded and cached. Real uploads still get the 480 px thumbnail.

**Measuring.** `vega exec perf doctor --app-name=<id>` checks your setup. `vega exec perf memory-monitor --app-name=<id>` prints RSS/USS/PSS over time, and it works on the Virtual Device. UI fluidity (`vega exec perf kpi-visualizer --kpi ui-fluidity`) needs Appium, and its numbers only mean something on a real stick ([performance CLI](https://developer.amazon.com/docs/vega/0.24/performance-cli.html)). To find overdraw, launch with `SHOW_OVERDRAWN=true` from Vega Studio ([overdraw](https://developer.amazon.com/docs/vega/0.24/detect-overdraw.html)). On the Virtual Device with a debug build in demo mode, these changes took the wall's average PSS from about 277 MiB to about 190 MiB. Those are single runs, so treat them as a rough guide, and expect different absolute numbers on a stick. A 22-minute soak of the release build in demo mode climbed to about 200–230 MiB in the first five minutes while the image cache filled, then grew by about 0.3 MiB a minute, the same before and after this pass. If that slope held for eight hours, it would end near 370 MiB, close to the 400 MiB budget. It may well flatten as garbage collection catches up, but run a longer soak on a real stick before an event.

## Debugging

- **JS logs aren't in the device log.** React Native 0.83 sends them to React Native DevTools. Run Metro (`react-native start`), forward port 8081 to the device, then attach to the target listed at `http://localhost:8081/json/list`.
- **Port forwarding is same-port only.** `vega device start-port-forwarding -p 8081 --forward false` maps the device's 8081 to your Mac's 8081. If another Metro or Expo server already owns 8081, stop it.
- **Some warnings are Vega's, not yours.** `hasViewManagerConfig('RCTSafeAreaView') is not implemented` and "Running debug build of JavaScript" come from the runtime. Silence those exact messages with `LogBox.ignoreLogs`, not `ignoreAllLogs`. `UISoundManager` / `AudioSystemService` errors in the device log come from the Virtual Device having no audio.
- **Jest:** the Vega preset's `Dimensions` mock doesn't implement `addEventListener` properly, so components using `useWindowDimensions` crash on unmount in tests. Read `Dimensions.get("window")` once instead; a TV window never resizes.

## Handy tools

- **Press remote keys from your Mac:** `vega device run-cmd --device VirtualDevice --command 'inputd-cli button_press KEY_RIGHT'`. It's the dev-mode input injector, and it also takes `KEY_ENTER`, `KEY_BACK`, `KEY_PLAYPAUSE` and more. `pnpm remote` in this repo wraps it in a small web remote.
- **Check what's running:** `vega device running-apps` and `vega device is-app-running --appName <id>`.
- **Live logs:** `vega device start-log-stream --device VirtualDevice`.

## Shipping

Release builds install on a Fire TV in developer mode (`vega devmode login`, then `vega devmode enable-device --code <code>`) with `vega run-app <armv7 .vpkg> <component id> -d <serial>`. For the Appstore, the release `.vpkg` goes into the Amazon Appstore Developer Console, where Live App Testing lets you run a beta first.
