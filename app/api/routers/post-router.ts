
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { posts } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const postRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        type: z.enum(["thought", "creation", "update"]).optional(),
        tier: z.enum(["public", "subscribers", "vip"]).optional(),
      }).optional()
    )
    .query(({ input }) => {
      const conditions = [];
      if (input?.type) {
        conditions.push(eq(posts.type, input.type));
      }
      if (input?.tier) {
        conditions.push(eq(posts.tier, input.tier));
      }
      
      if (conditions.length > 0) {
        return db.select().from(posts).where(conditions[0]).orderBy(desc(posts.createdAt));
      }
      return db.select().from(posts).orderBy(desc(posts.createdAt));
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const result = db.select().from(posts).where(eq(posts.id, input.id));
      return result[0] ?? null;
    }),

  create: kingQuery
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(["thought", "creation", "update"]).default("thought"),
        tier: z.enum(["public", "subscribers", "vip"]).default("public"),
        mediaUrl: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const result = db.insert(posts).values(input);
      return { id: Number(result.lastInsertRowid) };
    }),

  update: kingQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        type: z.enum(["thought", "creation", "update"]).optional(),
        tier: z.enum(["public", "subscribers", "vip"]).optional(),
        mediaUrl: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      db.update(posts).set(data).where(eq(posts.id, id));
      return { success: true };
    }),

  delete: kingQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(posts).where(eq(posts.id, input.id));
      return { success: true };
    }),

  like: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      const post = db.select().from(posts).where(eq(posts.id, input.id));
      if (post[0]) {
        db.update(posts).set({ likes: (post[0].likes || 0) + 1 }).where(eq(posts.id, input.id));
      }
      return { success: true };
    }),
});