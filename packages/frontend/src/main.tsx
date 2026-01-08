import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n"; // Initialize i18n
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { initializeTheme } from "./stores/themeStore.ts";
import { SocketProvider } from "./contexts/SocketContext.tsx";
import { queryClient } from "./lib/queryClient.ts";

initializeTheme(); // CALL THIS FUNCTION HERE

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

