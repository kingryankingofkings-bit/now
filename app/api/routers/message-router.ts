
import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { db } from "../queries/connection";
import { messages } from "../../db/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";

export const messageRouter = createRouter({
  listByFan: publicQuery
    .input(z.object({ fanId: z.string() }))
    .query(({ input }) => {
      return db.select().from(messages)
        .where(or(eq(messages.senderId, input.fanId), eq(messages.receiverId, input.fanId)))
        .orderBy(desc(messages.createdAt));
    }),

  conversation: publicQuery
    .input(z.object({ userA: z.string(), userB: z.string() }))
    .query(({ input }) => {
      return db.select().from(messages)
        .where(
          or(
            and(eq(messages.senderId, input.userA), eq(messages.receiverId, input.userB)),
            and(eq(messages.senderId, input.userB), eq(messages.receiverId, input.userA))
          )
        )
        .orderBy(messages.createdAt);
    }),

  send: publicQuery
    .input(z.object({
      senderId: z.string(),
      senderName: z.string(),
      senderTier: z.enum(["fan", "fanatic"]).default("fan"),
      receiverId: z.string(),
      content: z.string().min(1),
    }))
    .mutation(({ input }) => {
      const result = db.insert(messages).values(input);
      return { id: Number(result.lastInsertRowid) };
    }),

  markRead: publicQuery
    .input(z.object({ fanId: z.string() }))
    .mutation(({ input }) => {
      db.update(messages).set({ isRead: true })
        .where(and(eq(messages.receiverId, "king"), eq(messages.senderId, input.fanId), eq(messages.isRead, false)));
      return { success: true };
    }),

  unreadForKing: publicQuery.query(() => {
    return db.select().from(messages).where(and(eq(messages.receiverId, "king"), eq(messages.isRead, false)));
  }),

  unreadForFan: publicQuery
    .input(z.object({ fanId: z.string() }))
    .query(({ input }) => {
      return db.select().from(messages).where(and(eq(messages.receiverId, input.fanId), eq(messages.isRead, false)));
    }),
});