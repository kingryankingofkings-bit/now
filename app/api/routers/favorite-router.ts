
import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { db } from "../queries/connection";
import { favorites } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export const favoriteRouter = createRouter({
  list: publicQuery
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return db.select().from(favorites).where(eq(favorites.userId, input.userId));
    }),

  toggle: publicQuery
    .input(z.object({ userId: z.string(), postId: z.number() }))
    .mutation(({ input }) => {
      const existing = db.select().from(favorites)
        .where(and(eq(favorites.userId, input.userId), eq(favorites.postId, input.postId)));
      if (existing.length > 0) {
        db.delete(favorites).where(and(eq(favorites.userId, input.userId), eq(favorites.postId, input.postId)));
        return { favorited: false };
      }
      db.insert(favorites).values(input);
      return { favorited: true };
    }),
});