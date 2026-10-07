import { AdminPage } from "@/features/admin";
import { CapturePage } from "@/features/capture";

/** Two screens only, so a pathname switch beats pulling in a router. */
export function App() {
  return window.location.pathname.startsWith("/admin") ? <AdminPage /> : <CapturePage />;
}
