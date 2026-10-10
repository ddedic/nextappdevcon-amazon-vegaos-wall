/**
 * How much of the canvas edge fades into the sharp backdrop copy behind it. The two line up
 * pixel for pixel, so the fade only softens cards that reach the edge. The wall keeps its
 * content clear of this margin.
 */
export const CANVAS_EDGE_FEATHER = "3%";
/** How far the sharp backdrop copy fades into the blurred one that covers the window. */
export const BACKDROP_EDGE_FEATHER = "12%";
/** Touch-first devices get the "Add your photo" button instead of the full screen hint. */
export const COARSE_POINTER_QUERY = "(pointer: coarse)";
/** Phones and tablets held upright get the feed: the 16:9 canvas would be a thin strip there. */
export const PORTRAIT_HANDHELD_QUERY = "(orientation: portrait) and (max-width: 1024px)";
