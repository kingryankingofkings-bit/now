
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { products } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const productRouter = createRouter({
  list: publicQuery.query(() => {
    return db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const result = db.select().from(products).where(eq(products.id, input.id));
      return result[0] ?? null;
    }),

  create: kingQuery
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.string().or(z.number()),
        imageUrl: z.string().optional(),
        category: z.enum(["digital", "physical", "merch", "exclusive"]).default("digital"),
        inventory: z.number().default(-1),
      })
    )
    .mutation(({ input }) => {
      const result = db.insert(products).values({
        ...input,
        price: String(input.price),
      });
      return { id: Number(result.lastInsertRowid) };
    }),

  update: kingQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.string().or(z.number()).optional(),
        imageUrl: z.string().optional(),
        category: z.enum(["digital", "physical", "merch", "exclusive"]).optional(),
        inventory: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.price !== undefined) {
        updateData.price = String(data.price);
      }
      db.update(products).set(updateData).where(eq(products.id, id));
      return { success: true };
    }),

  delete: kingQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),
});