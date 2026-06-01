
import { z } from "zod";
import { createRouter, publicQuery, kingQuery } from "../middleware";
import { db } from "../queries/connection";
import { polls } from "../../db/schema";
import { eq } from "drizzle-orm";

export const pollRouter = createRouter({
  list: publicQuery.query(() => {
    const rows = db.select().from(polls);
    return rows.map((r) => ({
      ...r,
      options: JSON.parse(r.options || "[]") as string[],
      votes: JSON.parse(r.votes || "{}") as Record<number, number>,
      votedBy: JSON.parse(r.votedBy || "[]") as string[],
    }));
  }),

  create: kingQuery
    .input(z.object({ question: z.string().min(1), options: z.array(z.string()).min(2) }))
    .mutation(({ input }) => {
      const votes: Record<number, number> = {};
      input.options.forEach((_, i) => { votes[i] = 0; });
      const result = db.insert(polls).values({
        question: input.question,
        options: JSON.stringify(input.options),
        votes: JSON.stringify(votes),
        votedBy: "[]",
      });
      return { id: Number(result.lastInsertRowid) };
    }),

  vote: publicQuery
    .input(z.object({ id: z.number(), optionIndex: z.number(), userId: z.string() }))
    .mutation(({ input }) => {
      const result = db.select().from(polls).where(eq(polls.id, input.id));
      if (result.length === 0) throw new Error("Poll not found");
      const poll = result[0];
      const votedBy = JSON.parse(poll.votedBy || "[]") as string[];
      if (votedBy.includes(input.userId)) throw new Error("Already voted");
      const votes = JSON.parse(poll.votes || "{}") as Record<number, number>;
      votes[input.optionIndex] = (votes[input.optionIndex] || 0) + 1;
      db.update(polls).set({
        votes: JSON.stringify(votes),
        votedBy: JSON.stringify([...votedBy, input.userId]),
      }).where(eq(polls.id, input.id));
      return { success: true };
    }),

  delete: kingQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(polls).where(eq(polls.id, input.id));
      return { success: true };
    }),
});