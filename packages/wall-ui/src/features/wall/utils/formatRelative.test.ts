import { formatRelative } from "./formatRelative";

const now = Date.UTC(2026, 9, 7, 12, 0, 0);
const ago = (ms: number) => new Date(now - ms).toISOString();

describe("formatRelative", () => {
  it("counts minutes, hours and days", () => {
    expect(formatRelative(ago(30_000), now)).toBe("just now");
    expect(formatRelative(ago(5 * 60_000), now)).toBe("5 min ago");
    expect(formatRelative(ago(3 * 3_600_000), now)).toBe("3 h ago");
    expect(formatRelative(ago(2 * 86_400_000), now)).toBe("2 d ago");
  });

  it("never shows a future or broken time", () => {
    expect(formatRelative(ago(-10 * 60_000), now)).toBe("just now");
    expect(formatRelative("not a date", now)).toBe("just now");
  });
});
