import { boothwallConfig } from "@boothwall/shared";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  WALL_BACKDROP,
  WallErrorBoundary,
  WallScreen,
} from "@boothwall/wall-ui";

import { FullscreenHint } from "@/features/wall/components/canvas/FullscreenHint";
import { PhoneWall } from "@/features/wall/components/phone/PhoneWall";
import { SnapButton } from "@/features/wall/components/shared/SnapButton";
import {
  BACKDROP_EDGE_FEATHER,
  CANVAS_EDGE_FEATHER,
  COARSE_POINTER_QUERY,
  PORTRAIT_HANDHELD_QUERY,
} from "@/features/wall/constants/layout";
import { HINT_VISIBLE_MS } from "@/features/wall/constants/timing";
import { useCanvasScale } from "@/features/wall/hooks/useCanvasScale";
import { useFullscreen } from "@/features/wall/hooks/useFullscreen";
import { useIdleCursor } from "@/features/wall/hooks/useIdleCursor";
import { useKeyboardRemote } from "@/features/wall/hooks/useKeyboardRemote";
import { useMediaQuery } from "@/features/wall/hooks/useMediaQuery";
import { useTimedFlag } from "@/features/wall/hooks/useTimedFlag";
import { useWallParams } from "@/features/wall/hooks/useWallParams";
import { cn } from "@/lib/cn";

/**
 * The TV wall in a browser, rendered through react-native-web. Like the TV, it runs live or on
 * the bundled demo photos as boothwall.config.ts says; `?demo` forces the demo. The 960×540
 * canvas is scaled as one piece, the same way Vega scales it to 1080p, and the wall's backdrop
 * covers the window around it, so a window that isn't 16:9 shows no bars. F or a double-click
 * toggles full screen; `?kiosk` hides the hint, cursor and phone button, and `?fullscreen` also
 * goes full screen on the first key press or click. Phones get an "Add your photo" button, and
 * a phone held upright gets the wall as a feed instead (PhoneWall).
 */
export function WallPage() {
  const params = useWallParams();
  const demo = params.demo || boothwallConfig.demo;
  const portraitPhone = useMediaQuery(PORTRAIT_HANDHELD_QUERY);
  const phone = useMediaQuery(COARSE_POINTER_QUERY);
  if (portraitPhone && !params.kiosk) return <PhoneWall demo={demo} />;
  return (
    <CanvasWall
      kiosk={params.kiosk}
      autoFullscreen={params.autoFullscreen}
      demo={demo}
      phone={phone}
    />
  );
}

const edgeMask = (spare: "x" | "y", feather: string) =>
  `linear-gradient(${spare === "x" ? "to right" : "to bottom"}, transparent, black ${feather}, black calc(100% - ${feather}), transparent)`;

interface CanvasWallProps {
  kiosk: boolean;
  autoFullscreen: boolean;
  demo: boolean;
  /** A touch-first device: show the "Add your photo" button instead of the hint. */
  phone: boolean;
}

/** The TV's 960×540 canvas, scaled to the window. */
function CanvasWall({ kiosk, autoFullscreen, demo, phone }: CanvasWallProps) {
  const { scale, spare } = useCanvasScale();
  const fullscreen = useFullscreen(autoFullscreen);
  const hintVisible = useTimedFlag(HINT_VISIBLE_MS, !kiosk);
  const hideCursor = useIdleCursor(kiosk);

  return (
    <main
      className={cn(
        "fixed inset-0 flex items-center justify-center overflow-hidden bg-canvas",
        hideCursor && "cursor-none",
      )}
    >
      {/* Two copies of the canvas backdrop fill the window: a blurred one covering it, and a
          sharp one exactly behind the canvas, so the canvas edge fades into identical pixels. */}
      <img
        src={WALL_BACKDROP}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full scale-110 object-cover opacity-70 blur-2xl"
      />
      <img
        src={WALL_BACKDROP}
        alt=""
        aria-hidden
        className="absolute max-w-none"
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
          maskImage: edgeMask(spare, BACKDROP_EDGE_FEATHER),
        }}
      />
      <div
        className="relative flex shrink-0 flex-col"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          maskImage: edgeMask(spare, CANVAS_EDGE_FEATHER),
        }}
      >
        <WallErrorBoundary>
          <WallScreen useRemoteInput={useKeyboardRemote} demo={demo} />
        </WallErrorBoundary>
      </div>
      {!kiosk && (phone ? <SnapButton /> : <FullscreenHint visible={hintVisible && !fullscreen} />)}
    </main>
  );
}
