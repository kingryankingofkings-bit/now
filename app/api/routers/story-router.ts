
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { stories } from "../../db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const storyRouter = createRouter({
  list: publicQuery.query(() => {
    // Only return stories from last 24 hours
    return db.select().from(stories)
      .where(sql`${stories.createdAt} > DATE_SUB(NOW(), INTERVAL 24 HOUR)`)
      .orderBy(desc(stories.createdAt));
  }),

  create: kingQuery
    .input(z.object({ content: z.string().min(1), imageUrl: z.string().optional() }))
    .mutation(({ input }) => {
      const result = db.insert(stories).values(input);
      return { id: Number(result.lastInsertRowid) };
    }),

  delete: kingQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(stories).where(eq(stories.id, input.id));
      return { success: true };
    }),
});