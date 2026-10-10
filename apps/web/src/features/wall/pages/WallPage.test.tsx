import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HINT_VISIBLE_MS } from "@/features/wall/constants/timing";

import { WallPage } from "./WallPage";

/** Demo mode still opens the socket for phone remote commands; keep it offline here. */
class OfflineSocket {
  static readonly OPEN = 1;
  readyState = 0;
  onopen = null;
  onmessage = null;
  onerror = null;
  onclose = null;
  send() {}
  close() {}
}

/** matchMedia that matches only the given queries. */
const stubMedia = (...matching: string[]) =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matching.includes(query),
    addEventListener() {},
    removeEventListener() {},
  }));

describe("WallPage", () => {
  beforeEach(() => vi.stubGlobal("WebSocket", OfflineSocket));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  it("renders the shared TV wall in demo mode", () => {
    render(<WallPage />);

    expect(screen.getByTestId("wall-screen")).toBeTruthy();
    expect(screen.getByTestId("demo-chip")).toBeTruthy();
  });

  it("shows the full screen hint, then fades it out", () => {
    vi.useFakeTimers();
    render(<WallPage />);

    const hint = screen.getByTestId("fullscreen-hint");
    expect(hint.textContent).toBe("Press F for full screen");
    expect(hint.getAttribute("aria-hidden")).toBe("false");

    act(() => vi.advanceTimersByTime(HINT_VISIBLE_MS));
    expect(hint.getAttribute("aria-hidden")).toBe("true");
  });

  it.each(["?kiosk", "?fullscreen"])("hides the hint with %s", (search) => {
    window.history.replaceState(null, "", `/wall${search}`);
    render(<WallPage />);

    expect(screen.queryByTestId("fullscreen-hint")).toBeNull();
    expect(screen.getByRole("main").className).toContain("cursor-none");
  });

  it("offers phones the upload page instead of the hint", () => {
    stubMedia("(pointer: coarse)");
    render(<WallPage />);

    expect(screen.getByTestId("snap-button").getAttribute("href")).toBe("/snap");
    expect(screen.queryByTestId("fullscreen-hint")).toBeNull();
  });

  it("shows a phone held upright the wall as a feed", () => {
    stubMedia("(pointer: coarse)", "(orientation: portrait) and (max-width: 1024px)");
    window.history.replaceState(null, "", "/?demo");
    render(<WallPage />);

    expect(screen.queryByTestId("wall-screen")).toBeNull();
    expect(screen.getByTestId("phone-wall-status").textContent).toContain("Demo");
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(5);
    expect(screen.getByTestId("snap-button")).toBeTruthy();
  });
});
