import { describe, expect, it } from "vitest";

import { clientKey } from "./client-ip";

describe("clientKey", () => {
  it("keeps IPv4 as is and groups IPv6 by its /64", () => {
    expect(clientKey("203.0.113.7")).toBe("203.0.113.7");
    expect(clientKey("2001:db8:aa:1:1111:2222:3333:4444")).toBe("2001:db8:aa:1::/64");
    expect(clientKey("2001:0db8:00aa:0001::9")).toBe("2001:db8:aa:1::/64");
    expect(clientKey("2001:db8::1")).toBe("2001:db8:0:0::/64");
  });
});
