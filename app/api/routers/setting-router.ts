
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { siteSettings } from "../../db/schema";
import { eq } from "drizzle-orm";

const DEFAULTS: Record<string, string> = {
  siteTitle: "CreatorHub",
  tagline: "Your personal digital mansion",
  heroTitle: "The Digital Mansion",
  heroSubtitle: "Your all-access pass to my creative world. Explore my latest works, shop exclusive content, connect directly, and become part of the community.",
  accentColor: "#c9a96e",
  heroCtaText: "Enter the Mansion",
};

export const settingRouter = createRouter({
  getAll: publicQuery.query(() => {
    const rows = db.select().from(siteSettings);
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) settings[row.key] = row.value;
    return settings;
  }),

  get: publicQuery
    .input(z.object({ key: z.string() }))
    .query(({ input }) => {
      const rows = db.select().from(siteSettings).where(eq(siteSettings.key, input.key));
      return rows[0]?.value || DEFAULTS[input.key] || "";
    }),

  set: kingQuery
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(({ input }) => {
      const existing = db.select().from(siteSettings).where(eq(siteSettings.key, input.key));
      if (existing.length > 0) {
        db.update(siteSettings).set({ value: input.value }).where(eq(siteSettings.key, input.key));
      } else {
        db.insert(siteSettings).values(input);
      }
      return { success: true };
    }),
});