import { z } from "zod";

import { boothwallConfig } from "../config/boothwall.config";

/** Category ids from the config. Stored with every photo; "tribe" is the wire name. */
export type Tribe = (typeof boothwallConfig.categories)[number]["id"];

const categories = boothwallConfig.categories;

/** id → label, in config order. Powers the tribe battle and the phone's picker. */
export const TRIBES = Object.fromEntries(
  categories.map((category) => [category.id, category.label]),
) as Record<Tribe, string>;

/** The catch-all category, if the config has one: not printed on cards, not in the battle. */
export const CATCH_ALL_TRIBE: Tribe | undefined = categories.find(
  (category): category is (typeof categories)[number] & { catchAll: true } =>
    "catchAll" in category && category.catchAll === true,
)?.id;

export const tribeSchema = z.enum(categories.map((category) => category.id) as [Tribe, ...Tribe[]]);
