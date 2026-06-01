
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { verifyFanToken } from "./routers/fan-router";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  fan?: { id: number; username: string; tier: string };
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try OAuth first
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // OAuth not available
  }

  // Try fan auth token
  try {
    const token = opts.req.headers.get("x-fan-token");
    if (token) {
      const fan = await verifyFanToken(token);
      if (fan) ctx.fan = fan;
    }
  } catch {
    // Fan auth not available
  }

  return ctx;
}