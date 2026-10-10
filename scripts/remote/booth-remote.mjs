// Laptop remote for the booth: a local page with big buttons that presses real
// remote keys on a Vega device (Virtual Device or a dev-mode Fire TV) through
// `inputd-cli`. Run `pnpm remote` and open the printed URL.
//
//   VEGA_DEVICE=<serial>  target a specific device (default: VirtualDevice)
//   PORT=4400             local port
//   VEGA_CLI=<path>       vega binary (default: ~/vega/bin/vega, else `vega` on PATH)
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 4400);
const DEVICE = process.env.VEGA_DEVICE ?? "VirtualDevice";
const DEFAULT_CLI = `${process.env.HOME}/vega/bin/vega`;
const VEGA_CLI = process.env.VEGA_CLI ?? (existsSync(DEFAULT_CLI) ? DEFAULT_CLI : "vega");

// Only these keys can be sent; the value is passed to the device as-is.
const KEYS = {
  up: "KEY_UP",
  down: "KEY_DOWN",
  left: "KEY_LEFT",
  right: "KEY_RIGHT",
  ok: "KEY_ENTER",
  back: "KEY_BACK",
  playpause: "KEY_PLAYPAUSE",
  home: "KEY_HOMEPAGE",
  menu: "KEY_MENU",
};

const press = (key) =>
  new Promise((resolve, reject) =>
    execFile(
      VEGA_CLI,
      ["device", "run-cmd", "--device", DEVICE, "--command", `inputd-cli button_press ${key}`],
      { timeout: 15_000 },
      (error, stdout, stderr) =>
        error ? reject(new Error(stderr || error.message)) : resolve(stdout),
    ),
  );

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Booth remote</title>
<style>
  :root { color-scheme: dark; --pink:#f255e3; --blue:#1d85fc; --line:rgb(255 255 255/.14); }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; background:#000; color:#fff;
         font:600 16px/1.4 ui-sans-serif,system-ui,sans-serif; }
  main { display:grid; gap:28px; justify-items:center; padding:24px; }
  h1 { margin:0; font-size:20px; } p { margin:0; color:#8a8fa3; font-size:13px; text-align:center; }
  .pad { position:relative; width:260px; height:260px; border-radius:50%; border:1px solid var(--line);
         background:rgb(255 255 255/.06); }
  button { border:0; cursor:pointer; color:#fff; background:transparent; font:inherit; border-radius:999px; }
  button:active { transform:scale(.95); } button.sent { outline:2px solid var(--pink); }
  .arrow { position:absolute; width:64px; height:64px; font-size:28px; }
  .up { top:6px; left:98px } .down { bottom:6px; left:98px } .left { left:6px; top:98px } .right { right:6px; top:98px }
  .ok { position:absolute; inset:70px; background:linear-gradient(135deg,var(--pink),#9b6bff,var(--blue)); font-size:22px; }
  .row { display:grid; grid-template-columns:repeat(4,72px); gap:12px; }
  .row button { height:56px; border:1px solid var(--line); background:rgb(255 255 255/.06); font-size:20px; }
  #status { min-height:20px; }
</style></head><body><main>
  <h1>Booth remote</h1>
  <p>Device: ${DEVICE} · keyboard: arrows, Enter, Backspace, Space</p>
  <div class="pad">
    <button class="arrow up" data-key="up" aria-label="Up">▲</button>
    <button class="arrow left" data-key="left" aria-label="Left">◀</button>
    <button class="ok" data-key="ok">OK</button>
    <button class="arrow right" data-key="right" aria-label="Right">▶</button>
    <button class="arrow down" data-key="down" aria-label="Down">▼</button>
  </div>
  <div class="row">
    <button data-key="back" aria-label="Back">↩</button>
    <button data-key="home" aria-label="Home">⌂</button>
    <button data-key="menu" aria-label="Menu">☰</button>
    <button data-key="playpause" aria-label="Play or pause">⏯</button>
  </div>
  <p id="status"></p>
</main><script>
  const status = document.getElementById("status");
  const send = async (key) => {
    const button = document.querySelector('[data-key="' + key + '"]');
    button?.classList.add("sent");
    const res = await fetch("/press/" + key, { method: "POST" }).catch(() => null);
    button?.classList.remove("sent");
    status.textContent = res?.ok ? "" : "Couldn't reach the device. Is it running?";
  };
  document.querySelectorAll("[data-key]").forEach((b) => b.addEventListener("click", () => send(b.dataset.key)));
  const map = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right", Enter:"ok", Backspace:"back", " ":"playpause" };
  addEventListener("keydown", (e) => { if (map[e.key]) { e.preventDefault(); send(map[e.key]); } });
</script></body></html>`;

createServer(async (req, res) => {
  const match = req.method === "POST" && req.url?.match(/^\/press\/(\w+)$/);
  if (match) {
    const key = KEYS[match[1]];
    if (!key) return res.writeHead(404).end();
    try {
      await press(key);
      return res.writeHead(204).end();
    } catch (error) {
      console.error(`press ${key} failed: ${error.message}`);
      return res.writeHead(502).end();
    }
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page);
}).listen(PORT, "127.0.0.1", () => {
  console.info(`Booth remote for ${DEVICE}: http://localhost:${PORT}`);
});
