import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { captureCopy } from "@/features/capture/constants/copy";

import { CapturePage } from "./CapturePage";

vi.mock("@/lib/resizeImage", () => ({
  resizeImage: vi.fn(async () => new Blob(["x"], { type: "image/jpeg" })),
}));

describe("CapturePage", () => {
  it("only enables sending once a photo, tribe and consent are given", async () => {
    globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
    globalThis.URL.revokeObjectURL = vi.fn();
    const user = userEvent.setup();
    render(<CapturePage />);

    await user.upload(
      screen.getByTestId("gallery-input"),
      new File(["x"], "me.jpg", { type: "image/jpeg" }),
    );
    const send = (await screen.findByRole("button", {
      name: new RegExp(captureCopy.submit),
    })) as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    await user.click(screen.getByRole("radio", { name: "reactCon" }));
    expect(send.disabled).toBe(true);

    await user.click(screen.getByRole("checkbox"));
    expect(send.disabled).toBe(false);
  });
});
