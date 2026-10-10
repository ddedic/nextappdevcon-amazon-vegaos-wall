import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@boothwall/wall-ui";
import { useEffect, useState } from "react";

export interface CanvasFit {
  /** How far to scale the 960×540 wall to fit the window at 16:9. */
  scale: number;
  /** The axis with room left over around the canvas (a window wider than 16:9 is "x"). */
  spare: "x" | "y";
}

const fit = (): CanvasFit => {
  const x = window.innerWidth / CANVAS_WIDTH;
  const y = window.innerHeight / CANVAS_HEIGHT;
  return { scale: Math.min(x, y), spare: x > y ? "x" : "y" };
};

/** The wall's scale for the current window, kept up to date on resize. */
export function useCanvasScale() {
  const [canvasFit, setCanvasFit] = useState(fit);
  useEffect(() => {
    const onResize = () => setCanvasFit(fit());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return canvasFit;
}
