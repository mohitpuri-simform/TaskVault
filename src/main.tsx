import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long cached data is considered fresh before background refetch.
      staleTime: 30_000,
      // Keep unused query data in cache for 5 minutes.
      gcTime: 5 * 60_000,
      // Show cached data while refetching in the background.
      refetchOnWindowFocus: true,
      // Retry once on network error before showing an error state.
      retry: 1,
    },
  },
});

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info("App ready to work offline.");
  },
  onRegisteredSW(
    _swUrl: string,
    registration: ServiceWorkerRegistration | undefined,
  ) {
    if (registration) {
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000,
      );
    }
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* QueryClientProvider makes the shared cache available to every component */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
