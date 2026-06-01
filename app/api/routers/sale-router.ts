
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { sales } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

export const saleRouter = createRouter({
  listActive: publicQuery.query(() => {
    const rows = db.select().from(sales)
      .where(sql`${sales.expiresAt} > NOW()`)
      .orderBy(sql`${sales.createdAt} DESC`);
    return rows.map((r) => ({ ...r, productIds: JSON.parse(r.productIds || "[]") as number[] }));
  }),

  create: kingQuery
    .input(z.object({
      name: z.string().min(1),
      discountPercent: z.number().min(1).max(99),
      productIds: z.array(z.number()),
      expiresAt: z.string(),
    }))
    .mutation(({ input }) => {
      const result = db.insert(sales).values({
        name: input.name,
        discountPercent: input.discountPercent,
        productIds: JSON.stringify(input.productIds),
        expiresAt: new Date(input.expiresAt),
      });
      return { id: Number(result.lastInsertRowid) };
    }),

  delete: kingQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(sales).where(eq(sales.id, input.id));
      return { success: true };
    }),
});