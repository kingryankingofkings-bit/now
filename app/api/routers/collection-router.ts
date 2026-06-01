
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { collections, posts } from "../../db/schema";
import { eq } from "drizzle-orm";

export const collectionRouter = createRouter({
  list: publicQuery.query(() => {
    return db.select().from(collections);
  }),

  create: kingQuery
    .input(z.object({ name: z.string().min(1), description: z.string().optional(), coverImage: z.string().optional() }))
    .mutation(({ input }) => {
      const result = db.insert(collections).values(input);
      return { id: Number(result.lastInsertRowid) };
    }),

  delete: kingQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(collections).where(eq(collections.id, input.id));
      db.update(posts).set({ collectionId: null }).where(eq(posts.collectionId, input.id));
      return { success: true };
    }),

  posts: publicQuery
    .input(z.object({ collectionId: z.number() }))
    .query(({ input }) => {
      return db.select().from(posts).where(eq(posts.collectionId, input.collectionId));
    }),
});