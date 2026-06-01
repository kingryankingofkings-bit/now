import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "../../api/router";
import { handleLocalTrpc } from "@/lib/localTrpcHandler";

export const trpc = createTRPCReact<AppRouter>();

// Custom tRPC link that routes all calls to localStorage
function localStorageLink() {
  return () => {
    return ({ op }: any) => {
      return observable((observer) => {
        const pathParts = op.path.split(".");
        const router = pathParts[0];
        const procedure = pathParts[1];
        const fullPath = `${router}.${procedure}`;

        handleLocalTrpc(fullPath, op.input, op.type)
          .then((result) => {
            observer.next({ result: { type: "data", data: result } });
            observer.complete();
          })
          .catch((error) => {
            observer.error(error);
          });
      });
    };
  };
}

class LocalTrpcClient {
  private queryClient: QueryClient;

  constructor() {
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 1000 * 30, refetchOnWindowFocus: false },
      },
    });
  }

  getQueryClient() {
    return this.queryClient;
  }
}

const localClient = new LocalTrpcClient();

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => localClient.getQueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [localStorageLink() as any],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
