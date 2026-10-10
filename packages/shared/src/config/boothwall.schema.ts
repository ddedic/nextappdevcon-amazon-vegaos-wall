import { z } from "zod";

const url = z.url({ protocol: /^https?$/ });
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "colours are 6-digit hex, like #FF9F1C");

/** Everything a deployer changes to make BoothWall theirs. Validated at build and test time. */
export const boothwallConfigSchema = z
  .object({
    event: z.object({
      /** Shown in titles and on the upload page. */
      name: z.string().min(1),
      /** Printed on the wall and on every photo. */
      hashtag: z.string().regex(/^#\w+$/, "hashtag must look like #yourevent"),
      /** Where the booth is, shown on the upload page. Optional. */
      venue: z.string().optional(),
      /** Shown as a stacked "20 / 26" mark next to the logo on the TV. Optional. */
      year: z
        .string()
        .regex(/^\d{4}$/, "year is four digits, like 2026")
        .optional(),
    }),
    /**
     * What attendees pick when they upload ("which conference are you here for?"). Ids are
     * stored with every photo, so keep them stable once the wall is live. At most one entry
     * can be the catch-all: it isn't printed on cards and sits below the battle bars.
     */
    categories: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/, "category ids are lowercase, digits and dashes"),
          label: z.string().min(1),
          catchAll: z.boolean().optional(),
        }),
      )
      .min(1),
    /**
     * Brand colours for the TV, the web app and the Control panel. Gradients run primary →
     * secondary → tertiary. Text on top of them is picked automatically for contrast.
     * Logo and backdrop images live in each app's assets/brand folder.
     */
    theme: z.object({ primary: hex, secondary: hex, tertiary: hex }),
    urls: z.object({
      /** The API Worker. */
      api: url,
      /** The web app: the wall at `/`, the upload page at `/snap` (the TV's QR code) and `/control`. */
      web: url,
      /** Where the code lives, for the "Scan for the source" card. */
      source: url,
    }),
    /** Small "by" credit on the upload page and the TV source card. */
    author: z.object({ handle: z.string().min(1) }),
    /**
     * Demo mode: the TV shows the bundled demo photos and needs no API, which is handy for trying
     * BoothWall on the Vega Virtual Device. Turn it off once your API is deployed.
     */
    demo: z.boolean(),
    /** Photos are deleted this many days after upload. */
    retentionDays: z.number().int().positive(),
    /**
     * Your Cloudflare resources. `name` is the base for everything: the API Worker is
     * `<name>-api`, the web app Worker `<name>`, the D1 database `<name>` and the R2
     * bucket `<name>-photos`. `pnpm boothwall setup` creates them and fills in the rest.
     */
    deploy: z.object({
      name: z
        .string()
        .regex(/^[a-z0-9][a-z0-9-]{1,40}$/, "deploy.name is lowercase, digits and dashes"),
      /** Filled in by `pnpm boothwall setup`. */
      d1DatabaseId: z.union([z.uuid(), z.literal("")]),
      /** Optional custom domains on a zone in your account. Empty means workers.dev. */
      apiDomain: z.string(),
      webDomain: z.string(),
    }),
  })
  .superRefine((config, ctx) => {
    const ids = config.categories.map((category) => category.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["categories"],
        message: "category ids must be unique",
      });
    }
    if (config.categories.filter((category) => category.catchAll).length > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["categories"],
        message: "only one catch-all category",
      });
    }
  });

export type BoothwallConfig = z.input<typeof boothwallConfigSchema>;
