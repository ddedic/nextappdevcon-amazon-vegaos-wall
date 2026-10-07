import { sha256Hex } from "./crypto";

/**
 * The unit we rate-limit: an IPv4 address, or the /64 an IPv6 client gets from its ISP
 * (one device can rotate through billions of addresses inside it).
 */
export function clientKey(ip: string): string {
  if (!ip.includes(":")) return ip;
  const [head = "", tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = ip.includes("::")
    ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
    : left;
  return `${groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

/** Client key hashed with a per-UTC-day salt, so it can't be correlated across days. */
export const hashClient = (ip: string, now: Date) =>
  sha256Hex(`${now.toISOString().slice(0, 10)}:${clientKey(ip)}`);
