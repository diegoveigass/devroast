import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

function handler(req: Request) {
  return fetchRequestHandler({
    createContext: createTRPCContext,
    endpoint: "/api/trpc",
    req,
    router: appRouter,
  });
}

export { handler as GET, handler as POST };
