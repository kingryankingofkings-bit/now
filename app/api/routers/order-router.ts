
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { orders, products } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const orderRouter = createRouter({
  list: publicQuery
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(({ input }) => {
      if (input?.userId) {
        return db.select().from(orders).where(eq(orders.userId, input.userId)).orderBy(desc(orders.createdAt));
      }
      return db.select().from(orders).orderBy(desc(orders.createdAt));
    }),

  create: publicQuery
    .input(z.object({
      userId: z.string(),
      userName: z.string(),
      productId: z.number(),
      productName: z.string(),
      quantity: z.number().min(1).default(1),
      totalPrice: z.string(),
    }))
    .mutation(({ input }) => {
      const result = db.insert(orders).values(input);
      return { id: Number(result.lastInsertRowid) };
    }),

  updateStatus: kingQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "completed", "cancelled"]) }))
    .mutation(({ input }) => {
      db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      return { success: true };
    }),
});