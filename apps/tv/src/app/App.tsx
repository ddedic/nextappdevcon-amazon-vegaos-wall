import { WallErrorBoundary, WallScreen } from "@boothwall/wall-ui";
import React from "react";

import { useVegaRemote } from "@/platform/useVegaRemote";

export const App = () => (
  <WallErrorBoundary>
    <WallScreen useRemoteInput={useVegaRemote} />
  </WallErrorBoundary>
);
