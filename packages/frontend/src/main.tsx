import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { initializeTheme } from "./stores/themeStore.ts";
import { SocketProvider } from "./contexts/SocketContext.tsx";

initializeTheme(); // CALL THIS FUNCTION HERE

// Configure React Query with proper defaults to prevent memory leaks
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      // GC time: how long inactive data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Refetch settings
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Retry settings
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <App />
        </SocketProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

export { queryClient };
