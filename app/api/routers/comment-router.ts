
import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { db } from "../queries/connection";
import { comments } from "../../db/schema";
import { eq, asc } from "drizzle-orm";

export const commentRouter = createRouter({
  list: publicQuery
    .input(z.object({ postId: z.number() }))
    .query(({ input }) => {
      return db.select().from(comments).where(eq(comments.postId, input.postId)).orderBy(asc(comments.createdAt));
    }),

  create: publicQuery
    .input(z.object({
      postId: z.number(),
      authorId: z.string(),
      authorName: z.string(),
      authorTier: z.enum(["fan", "fanatic"]).default("fan"),
      content: z.string().min(1),
    }))
    .mutation(({ input }) => {
      const result = db.insert(comments).values(input);
      return { id: Number(result.lastInsertRowid) };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(comments).where(eq(comments.id, input.id));
      return { success: true };
    }),
});