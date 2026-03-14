"use client";

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { ReactNode } from "react";
import { useState } from "react";

import { getBaseUrl } from "@/lib/env/get-base-url";

import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

const {
  TRPCProvider: TRPCReactProvider,
  useTRPC,
  useTRPCClient,
} = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}

function makeTRPCClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
      }),
    ],
  });
}

export function TRPCProvider(props: Readonly<{ children: ReactNode }>) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() => makeTRPCClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCReactProvider queryClient={queryClient} trpcClient={trpcClient}>
        {props.children}
      </TRPCReactProvider>
    </QueryClientProvider>
  );
}

export { useTRPC, useTRPCClient };
