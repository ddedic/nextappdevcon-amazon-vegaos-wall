import demo01 from "../../../assets/demo/demo-01.jpg";
import demo02 from "../../../assets/demo/demo-02.jpg";
import demo03 from "../../../assets/demo/demo-03.jpg";
import demo04 from "../../../assets/demo/demo-04.jpg";
import demo05 from "../../../assets/demo/demo-05.jpg";
import demo06 from "../../../assets/demo/demo-06.jpg";
import demo07 from "../../../assets/demo/demo-07.jpg";
import demo08 from "../../../assets/demo/demo-08.jpg";
import demo09 from "../../../assets/demo/demo-09.jpg";
import demo10 from "../../../assets/demo/demo-10.jpg";
import demo11 from "../../../assets/demo/demo-11.jpg";
import demo12 from "../../../assets/demo/demo-12.jpg";
import demo13 from "../../../assets/demo/demo-13.jpg";
import demo14 from "../../../assets/demo/demo-14.jpg";
import demo15 from "../../../assets/demo/demo-15.jpg";
import demo16 from "../../../assets/demo/demo-16.jpg";
import demo17 from "../../../assets/demo/demo-17.jpg";
import demo18 from "../../../assets/demo/demo-18.jpg";
import demo19 from "../../../assets/demo/demo-19.jpg";
import demo20 from "../../../assets/demo/demo-20.jpg";
import demo21 from "../../../assets/demo/demo-21.jpg";
import demo22 from "../../../assets/demo/demo-22.jpg";
import demo23 from "../../../assets/demo/demo-23.jpg";
import demo24 from "../../../assets/demo/demo-24.jpg";
import demo25 from "../../../assets/demo/demo-25.jpg";
import demo26 from "../../../assets/demo/demo-26.jpg";
import demo27 from "../../../assets/demo/demo-27.jpg";
import demo28 from "../../../assets/demo/demo-28.jpg";
import demo29 from "../../../assets/demo/demo-29.jpg";
import demo30 from "../../../assets/demo/demo-30.jpg";
import demo31 from "../../../assets/demo/demo-31.jpg";
import demo32 from "../../../assets/demo/demo-32.jpg";
import demo33 from "../../../assets/demo/demo-33.jpg";
import demo34 from "../../../assets/demo/demo-34.jpg";
import demo35 from "../../../assets/demo/demo-35.jpg";
import demo36 from "../../../assets/demo/demo-36.jpg";
import demo37 from "../../../assets/demo/demo-37.jpg";
import demo38 from "../../../assets/demo/demo-38.jpg";
import demo39 from "../../../assets/demo/demo-39.jpg";
import demo40 from "../../../assets/demo/demo-40.jpg";
import demo41 from "../../../assets/demo/demo-41.jpg";
import demo42 from "../../../assets/demo/demo-42.jpg";
import demo43 from "../../../assets/demo/demo-43.jpg";
import demo44 from "../../../assets/demo/demo-44.jpg";
import demo45 from "../../../assets/demo/demo-45.jpg";
import demo46 from "../../../assets/demo/demo-46.jpg";
import demo47 from "../../../assets/demo/demo-47.jpg";
import demo48 from "../../../assets/demo/demo-48.jpg";
import demo49 from "../../../assets/demo/demo-49.jpg";
import demo50 from "../../../assets/demo/demo-50.jpg";
import demo51 from "../../../assets/demo/demo-51.jpg";
import demo52 from "../../../assets/demo/demo-52.jpg";
import { type BundledImage, imageUri } from "../utils/bundledImage";

type DemoSource = { source: BundledImage; caption: string; category: string };

/**
 * Demo mode: 01–24 are generated booth scenes and 25–52 are the author's own photos from the
 * next.app devCon 2026 booth, with the captions they have on the public demo wall. The list
 * interleaves the two so the wall shows a mix rather than two blocks. 600 px each; wall cards
 * and the spotlight share one file, because separate 320 px wall copies measured worse (the
 * demo cycles through few enough photos that both sizes end up decoded and cached). They ship
 * inside the app, so the demo needs no network. Metro and Vite only bundle static imports, so
 * each file is listed. A category that isn't in your config falls back to a weighted pick.
 */
const SOURCES: DemoSource[] = [
  { source: demo25, caption: "Keynote, packed hall", category: "react-native" },
  { source: demo01, caption: "Two sticks, two smiles", category: "fire-tv" },
  { source: demo26, caption: "The wall, backstage", category: "vega-os" },
  { source: demo02, caption: "Paired in 5 seconds", category: "fire-tv" },
  { source: demo27, caption: "Day one beers 🍻", category: "visiting" },
  { source: demo03, caption: "Shipping from the booth", category: "vega-os" },
  { source: demo28, caption: "Amazon hackathon kickoff", category: "fire-tv" },
  { source: demo04, caption: "Booth crew 🎉", category: "visiting" },
  { source: demo29, caption: "Break time, wall still on", category: "vega-os" },
  { source: demo05, caption: "Filming the wall", category: "visiting" },
  { source: demo30, caption: "Caught by the camera crew", category: "visiting" },
  { source: demo31, caption: "Expo floor soundcheck", category: "visiting" },
  { source: demo06, caption: "Live demo on stage", category: "react-native" },
  { source: demo32, caption: "Booth crew, still smiling", category: "fire-tv" },
  { source: demo07, caption: "Coffee and Vega OS ☕", category: "vega-os" },
  { source: demo33, caption: "Two thumbs up for Vega OS", category: "vega-os" },
  { source: demo08, caption: "Hackathon crew 🍕", category: "react-native" },
  { source: demo34, caption: "Future of React Native", category: "react-native" },
  { source: demo09, caption: "Scanning in", category: "visiting" },
  { source: demo35, caption: "Who's free? Nobody.", category: "web-cloud" },
  { source: demo10, caption: "It's on the TV!", category: "fire-tv" },
  { source: demo36, caption: "Front row, for once", category: "visiting" },
  { source: demo11, caption: "Couch-testing the remote", category: "fire-tv" },
  { source: demo37, caption: "$160K prize pool 🏎️", category: "fire-tv" },
  { source: demo38, caption: "Coffee and beanbags", category: "visiting" },
  { source: demo12, caption: "High five, it shipped", category: "vega-os" },
  { source: demo39, caption: "Expo sticker haul", category: "react-native" },
  { source: demo13, caption: "Plugging in the Stick", category: "fire-tv" },
  { source: demo40, caption: "On my way to the venue", category: "visiting" },
  { source: demo14, caption: "Showing off my app", category: "web-cloud" },
  { source: demo41, caption: "Live demo, fingers crossed", category: "react-native" },
  { source: demo15, caption: "Coffee #3", category: "visiting" },
  { source: demo42, caption: "Parking lot spot", category: "visiting" },
  { source: demo16, caption: "Couch co-op 🎮", category: "react-native" },
  { source: demo43, caption: "Read your own code, folks", category: "web-cloud" },
  { source: demo17, caption: "Pair programming", category: "web-cloud" },
  { source: demo44, caption: "Biergarten debrief", category: "visiting" },
  { source: demo45, caption: "Met at the booth", category: "fire-tv" },
  { source: demo18, caption: "Booth in full swing", category: "visiting" },
  { source: demo46, caption: "Next session, this way", category: "visiting" },
  { source: demo19, caption: "Thumbs up for D-pad focus", category: "vega-os" },
  { source: demo47, caption: "Booth selfie!", category: "vega-os" },
  { source: demo20, caption: "Selfie time 📸", category: "visiting" },
  { source: demo48, caption: "Monorepo? Always.", category: "web-cloud" },
  { source: demo21, caption: "Remote in hand", category: "fire-tv" },
  { source: demo49, caption: "Hallway track > talks", category: "react-native" },
  { source: demo22, caption: "Ask me about Vega OS", category: "vega-os" },
  { source: demo50, caption: "Vega SDK between talks", category: "vega-os" },
  { source: demo23, caption: "Whiteboard session", category: "web-cloud" },
  { source: demo51, caption: "We made it. Berlin! 🎉", category: "fire-tv" },
  { source: demo52, caption: "Found my photo! 👉", category: "visiting" },
  { source: demo24, caption: "Team photo!", category: "react-native" },
];

/** How many photos demo mode has, one wall pool's worth. */
export const DEMO_PHOTO_COUNT = SOURCES.length;

export type DemoPhoto = { full: string; thumb: string; caption: string; category: string };

let photos: DemoPhoto[] | null = null;

/** Resolved on first use, so a live (non-demo) wall never pays for it at start-up. */
export function demoPhotos(): DemoPhoto[] {
  photos ??= SOURCES.map(({ source, caption, category }) => {
    const uri = imageUri(source);
    return { full: uri, thumb: uri, caption, category };
  });
  return photos;
}
