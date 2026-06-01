
import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { db } from "../queries/connection";
import { fans } from "../../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.FAN_JWT_SECRET || "creatorhub-fan-secret-key-2024");

export async function createFanToken(fan: { id: number; username: string; tier: string }) {
  return new SignJWT({ id: fan.id, username: fan.username, tier: fan.tier })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyFanToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload as { id: number; username: string; tier: string };
  } catch {
    return null;
  }
}

export const fanRouter = createRouter({
  register: publicQuery
    .input(z.object({
      username: z.string().min(3).max(50),
      password: z.string().min(4),
      displayName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      tier: z.enum(["fan", "fanatic"]).default("fan"),
      referredBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = db.select().from(fans).where(eq(fans.username, input.username));
      if (existing.length > 0) throw new Error("Username already taken");

      const passwordHash = await bcrypt.hash(input.password, 10);
      const referralCode = "CH" + Math.random().toString(36).substring(2, 8).toUpperCase();

      const result = db.insert(fans).values({
        username: input.username,
        passwordHash,
        displayName: input.displayName,
        email: input.email,
        phone: input.phone || "",
        tier: input.tier,
        referralCode,
      });

      const fanId = Number(result.lastInsertRowid);
      const token = await createFanToken({ id: fanId, username: input.username, tier: input.tier });
      return { token, fan: { id: fanId, username: input.username, displayName: input.displayName, tier: input.tier } };
    }),

  login: publicQuery
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = db.select().from(fans).where(eq(fans.username, input.username));
      if (result.length === 0) throw new Error("Invalid username or password");

      const fan = result[0];
      const valid = await bcrypt.compare(input.password, fan.passwordHash);
      if (!valid) throw new Error("Invalid username or password");

      const token = await createFanToken({ id: fan.id, username: fan.username, tier: fan.tier });
      return { token, fan: { id: fan.id, username: fan.username, displayName: fan.displayName, tier: fan.tier, avatar: fan.avatar, bio: fan.bio, cover: fan.cover } };
    }),

  me: publicQuery
    .query(async ({ ctx }) => {
      const fan = (ctx as any).fan;
      if (!fan) return null;
      const result = db.select().from(fans).where(eq(fans.id, fan.id));
      if (result.length === 0) return null;
      const f = result[0];
      return { id: f.id, username: f.username, name: f.displayName || f.username, displayName: f.displayName, tier: f.tier, avatar: f.avatar, bio: f.bio, cover: f.cover, referralCode: f.referralCode, totalSpent: f.totalSpent };
    }),

  updateProfile: publicQuery
    .input(z.object({
      displayName: z.string().optional(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      cover: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fan = (ctx as any).fan;
      if (!fan) throw new Error("Not authenticated");
      db.update(fans).set(input).where(eq(fans.id, fan.id));
      return { success: true };
    }),

  list: publicQuery.query(async () => {
    return db.select({
      id: fans.id,
      username: fans.username,
      displayName: fans.displayName,
      tier: fans.tier,
      totalSpent: fans.totalSpent,
      createdAt: fans.createdAt,
    }).from(fans).orderBy(fans.createdAt);
  }),
});