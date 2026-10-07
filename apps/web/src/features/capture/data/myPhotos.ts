/** Delete tokens for photos uploaded from this phone, so people can remove their own. */
const KEY = "live-wall:my-photos";

type MyPhoto = { id: string; deleteToken: string };

const read = (): MyPhoto[] => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(stored) ? (stored as MyPhoto[]) : [];
  } catch {
    return [];
  }
};

export const myPhotos = {
  remember(photo: MyPhoto) {
    try {
      localStorage.setItem(KEY, JSON.stringify([...read(), photo].slice(-20)));
    } catch {
      // Private mode: removal still works for this session via in-memory state.
    }
  },
  forget(id: string) {
    try {
      localStorage.setItem(KEY, JSON.stringify(read().filter((photo) => photo.id !== id)));
    } catch {
      // ignore
    }
  },
};
