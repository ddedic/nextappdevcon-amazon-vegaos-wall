import { connectionPhase } from "./connectionPhase";

describe("connectionPhase", () => {
  it("walks connecting → loading → ready on a clean start", () => {
    expect(connectionPhase("connecting", false)).toBe("connecting");
    expect(connectionPhase("live", false)).toBe("loading");
    expect(connectionPhase("live", true)).toBe("ready");
  });

  it("fails while nothing has loaded yet", () => {
    expect(connectionPhase("offline", false)).toBe("failed");
  });

  it("stays ready after the first load, even when the socket drops", () => {
    expect(connectionPhase("offline", true)).toBe("ready");
    expect(connectionPhase("simulated", false)).toBe("ready");
  });
});
