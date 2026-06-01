
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { walletEntries, withdrawals } from "../../db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const walletRouter = createRouter({
  balance: publicQuery.query(() => {
    const entries = db.select().from(walletEntries).orderBy(desc(walletEntries.createdAt));
    const withdrawalList = db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
    const totalIn = entries.reduce((s, e) => s + Number(e.amount), 0);
    const totalOut = withdrawalList.filter((w) => w.status === "completed").reduce((s, w) => s + Number(w.amount), 0);
    return { balance: (totalIn - totalOut).toFixed(2), entries, withdrawals: withdrawalList };
  }),

  add: publicQuery
    .input(z.object({ type: z.enum(["donation", "order", "tip"]), amount: z.string(), description: z.string().optional(), fromName: z.string().optional() }))
    .mutation(({ input }) => {
      db.insert(walletEntries).values(input);
      return { success: true };
    }),

  withdraw: kingQuery
    .input(z.object({ amount: z.string() }))
    .mutation(({ input }) => {
      db.insert(withdrawals).values({ amount: input.amount, status: "pending" });
      return { success: true };
    }),

  completeWithdrawal: kingQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.update(withdrawals).set({ status: "completed" }).where(eq(withdrawals.id, input.id));
      return { success: true };
    }),
});