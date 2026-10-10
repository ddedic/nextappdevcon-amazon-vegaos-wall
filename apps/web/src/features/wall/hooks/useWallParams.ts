import { useState } from "react";

import { readWallParams } from "@/features/wall/data/wallParams";

/** The wall's display options, read once on mount. */
export function useWallParams() {
  const [params] = useState(() => readWallParams(window.location.search));
  return params;
}
