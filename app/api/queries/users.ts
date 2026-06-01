import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { db } from "./connection";
import { env } from "../lib/env";

export function findUserByUnionId(unionId: string) {
  const rows = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .all();
  return rows.at(0);
}

export function upsertUser(data: typeof schema.users.$inferInsert) {
  const values = { ...data };
  const updateSet: Partial<typeof schema.users.$inferInsert> = {
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  db.insert(schema.users)
    .values(values)
    .onConflictDoUpdate({
      target: schema.users.unionId,
      set: updateSet,
    })
    .run();
}
