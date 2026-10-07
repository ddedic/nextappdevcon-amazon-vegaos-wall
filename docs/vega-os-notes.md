# Building for Vega OS: notes from the field

Vega OS is new, and a lot of what you need to know isn't written down yet. These are the things I ran into while building the Live Wall TV app with React Native for Vega (SDK 0.24, React Native 0.83) on an Apple Silicon Mac. Each one cost me some time; hopefully they save you some.

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
