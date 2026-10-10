import { boothwallConfig } from "./boothwall.config";
import type { BoothwallConfig } from "./boothwall.schema";

/** The event this wall runs at, from boothwall.config.ts. Typed by the schema, so optional fields stay optional. */
export const EVENT: BoothwallConfig["event"] = boothwallConfig.event;

/** The project chip on the TV top bar and the phone header. */
export const SHOWCASE_LABEL = "Built on Vega OS";
