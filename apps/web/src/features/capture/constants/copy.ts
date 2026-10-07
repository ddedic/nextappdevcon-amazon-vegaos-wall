import { EVENT } from "@vegaos-demo/shared";

import { appConfig } from "@/app/app.config";

export const captureCopy = {
  eyebrow: `Live Wall · ${appConfig.venue}`,
  title: "Get on the wall.",
  intro: "Snap a photo and it shows up on the big Fire TV screen at the booth.",
  steps: [
    { title: "Snap", body: "Take a selfie or pick a photo." },
    { title: "Tag", body: "Add a caption and your conference." },
    { title: "Shine", body: "Once the booth approves it, it floats onto the wall." },
  ],
  takePhoto: "Take a photo",
  pickPhoto: "Choose from gallery",
  retake: "Change photo",
  back: "Back",
  captionLabel: "Caption",
  captionPlaceholder: "Say hi to Berlin 👋",
  tribeLabel: "Which conference are you here for?",
  consent: `I'm fine with this photo being shown on the public screen at the booth. It's deleted automatically after ${appConfig.retentionDays} days.`,
  submit: "Send to the wall",
  sending: "Sending…",
  preparing: "Preparing photo…",
  successTitle: "Sent!",
  successBody: "The booth team will approve it in a moment — then keep an eye on the screen.",
  hashtag: EVENT.hashtag,
  another: "Add another photo",
  remove: "Remove my photo",
  removed: "Your photo was removed from the wall.",
  errors: {
    PHOTO_RATE_LIMITED: "Easy there! You've posted a lot — try again in a few minutes.",
    PHOTO_WALL_BUSY: "The wall is extra busy right now. Try again in a few minutes.",
    PHOTO_DIMENSIONS_TOO_LARGE: "That photo is too large. Try another one.",
    PHOTO_TOO_LARGE: "That photo is too large. Try another one.",
    PHOTO_UNSUPPORTED_TYPE: "That file type isn't supported. Use a JPG or PNG.",
    DECODE: "We couldn't read that photo. Try taking a new one.",
    generic: "Something went wrong. Check your connection and try again.",
  },
} as const;
