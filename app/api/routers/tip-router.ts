
import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { db } from "../queries/connection";
import { tips, posts, walletEntries } from "../../db/schema";
import { desc, eq } from "drizzle-orm";

export const tipRouter = createRouter({
  list: publicQuery.query(() => {
    return db.select().from(tips).orderBy(desc(tips.createdAt));
  }),

  create: publicQuery
    .input(z.object({
      postId: z.number(),
      fromId: z.string(),
      fromName: z.string(),
      amount: z.string(),
    }))
    .mutation(({ input }) => {
      db.insert(tips).values(input);
      const post = db.select().from(posts).where(eq(posts.id, input.postId));
      if (post[0]) {
        db.update(posts).set({
          tips: String(Number(post[0].tips || 0) + Number(input.amount)),
          tipCount: (post[0].tipCount || 0) + 1,
        }).where(eq(posts.id, input.postId));
      }
      db.insert(walletEntries).values({
        type: "tip",
        amount: input.amount,
        description: `Tip on post #${input.postId}`,
        fromName: input.fromName,
      });
      return { success: true };
    }),
});