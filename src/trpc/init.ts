import { initTRPC } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

import { db } from "@/db";

export async function createTRPCContextInner(opts?: { headers: Headers }) {
  return {
    db,
    headers: opts?.headers ?? new Headers(),
  };
}

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  return createTRPCContextInner({
    headers: opts.req.headers,
  });
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContextInner>>;

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
