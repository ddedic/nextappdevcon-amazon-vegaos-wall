import { type PhotoDTO, type Tribe, tribeSchema } from "@boothwall/shared";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { controlCopy } from "@/features/control/constants/copy";

import { ControlPage } from "./ControlPage";

const photo = (n: number, overrides: Partial<PhotoDTO> = {}): PhotoDTO => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  status: "approved",
  caption: `Photo ${n}`,
  tribe: tribeSchema.options[0] as Tribe,
  imageUrl: `https://api.test/photos/p${n}/image`,
  thumbUrl: `https://api.test/photos/p${n}/thumb`,
  createdAt: "2026-10-07T12:00:00.000Z",
  ...overrides,
});

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

/** A tiny fake API: the queue, one page of photos and the edit endpoint. */
const api = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  if (url.pathname === "/photos/pending")
    return json({ photos: [photo(1, { status: "pending" })] });
  if (url.pathname === "/photos/manage")
    return json({ photos: [photo(2), photo(3)], nextCursor: null });
  if (init?.method === "PATCH") {
    const id = url.pathname.split("/")[2] ?? "";
    return json({ photo: { ...photo(2), id, status: "hidden" } });
  }
  return json({ error: { code: "ROUTE_NOT_FOUND" } }, 404);
});

beforeEach(() => {
  sessionStorage.clear();
  window.location.hash = "";
  vi.stubGlobal("fetch", api);
});

afterEach(() => {
  vi.unstubAllGlobals();
  api.mockClear();
});

describe("ControlPage", () => {
  it("unlocks into the queue, with the waiting count on the tab", async () => {
    const user = userEvent.setup();
    render(<ControlPage />);

    await user.type(screen.getByLabelText(controlCopy.passcodeLabel), "123456");
    await user.click(screen.getByRole("button", { name: controlCopy.unlock }));

    const queueTab = screen.getByRole("tab", { name: /Queue/ });
    expect(queueTab.getAttribute("aria-selected")).toBe("true");
    expect(await within(queueTab).findByText("1")).toBeTruthy();
    expect(await screen.findByText("Photo 1")).toBeTruthy();
    expect(api.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: "Bearer 123456" });
  });

  it("moves between tabs with the arrow keys", async () => {
    sessionStorage.setItem("boothwall:passcode", "123456");
    const user = userEvent.setup();
    render(<ControlPage />);

    await user.click(screen.getByRole("tab", { name: /Queue/ }));
    await user.keyboard("{ArrowRight}");

    const photosTab = screen.getByRole("tab", { name: /Photos/ });
    expect(photosTab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(photosTab);
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(photosTab.id);
  });

  it("hides selected photos in bulk after a confirmation", async () => {
    sessionStorage.setItem("boothwall:passcode", "123456");
    const user = userEvent.setup();
    render(<ControlPage />);

    await user.click(screen.getByRole("tab", { name: /Photos/ }));
    await screen.findByRole("button", { name: controlCopy.photos.openPhoto("Photo 2") });
    await user.click(screen.getByRole("button", { name: controlCopy.photos.select }));
    await user.click(
      screen.getByRole("button", { name: controlCopy.photos.selectPhoto("Photo 2") }),
    );
    await user.click(screen.getByRole("button", { name: /Hide/ }));
    await user.click(
      within(screen.getByRole("alertdialog", { hidden: true })).getByRole("button", {
        name: controlCopy.bulk.hide,
        hidden: true,
      }),
    );

    await waitFor(() => {
      const patch = api.mock.calls.find(([, init]) => init?.method === "PATCH");
      expect(patch?.[1]?.body).toBe(JSON.stringify({ hidden: true }));
    });
    expect(await screen.findByText(controlCopy.bulk.done.hide(1))).toBeTruthy();
  });
});
