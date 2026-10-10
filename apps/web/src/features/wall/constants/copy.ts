export const wallCopy = {
  fullscreenHint: "Press F for full screen",
  snapButton: "Add your photo",
  phone: {
    eyebrow: "Live wall",
    title: "Get on the big screen.",
    intro: "Every photo here is on the Fire TV at the booth right now.",
    moments: (count: number) => (count === 1 ? "1 moment" : `${count} moments`),
    status: { demo: "Demo", connecting: "Connecting", live: "Live" },
    whoIsHere: "Who's here",
    empty: "No photos yet. Yours could be the first.",
    rotate: "Turn your phone sideways to see the wall as it is on the TV.",
  },
};
