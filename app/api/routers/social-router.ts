
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { socialLinks } from "../../db/schema";
import { eq } from "drizzle-orm";

export const socialRouter = createRouter({
  list: publicQuery.query(() => {
    return db.select().from(socialLinks).where(eq(socialLinks.isActive, true));
  }),

  create: kingQuery
    .input(
      z.object({
        platform: z.string().min(1),
        url: z.string().min(1),
        displayName: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const result = db.insert(socialLinks).values(input);
      return { id: Number(result.lastInsertRowid) };
    }),

  update: kingQuery
    .input(
      z.object({
        id: z.number(),
        platform: z.string().optional(),
        url: z.string().optional(),
        displayName: z.string().optional(),
        icon: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      db.update(socialLinks).set(data).where(eq(socialLinks.id, id));
      return { success: true };
    }),

  delete: kingQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(socialLinks).where(eq(socialLinks.id, input.id));
      return { success: true };
    }),
});