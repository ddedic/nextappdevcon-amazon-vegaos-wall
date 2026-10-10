import { lazy, StrictMode, Suspense } from "react";

import { resolveRoute } from "@/app/routes";
import { CapturePage } from "@/features/capture";
import { ControlPage } from "@/features/control";

// The wall brings React Native for Web with it, so the upload page and Control panel load without it.
const WallPage = lazy(() =>
  import("@/features/wall").then(({ WallPage }) => ({ default: WallPage })),
);

export function App() {
  const { screen, redirectTo } = resolveRoute(window.location.pathname);
  if (redirectTo) {
    const { search, hash } = window.location;
    history.replaceState(null, "", `${redirectTo}${search}${hash}`);
  }
  // No StrictMode on the wall, as on the TV: its dev-only double mount stops running Animated
  // animations in react-native-web (the spotlight would never open).
  if (screen === "wall")
    return (
      <Suspense fallback={null}>
        <WallPage />
      </Suspense>
    );
  return <StrictMode>{screen === "control" ? <ControlPage /> : <CapturePage />}</StrictMode>;
}
