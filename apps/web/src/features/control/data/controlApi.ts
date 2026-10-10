import {
  type PhotoDTO,
  type PhotoListQuery,
  type PhotoPageDTO,
  photoPageSchema,
  type PhotoPatch,
  photoSchema,
  type PhotoStatsDTO,
  photoStatsSchema,
  type RemoteCommand,
} from "@boothwall/shared";
import { z } from "zod";

import { apiFetch } from "@/lib/api";

const auth = (passcode: string) => ({ authorization: `Bearer ${passcode}` });

const photoResultSchema = z.object({ photo: photoSchema });

export async function fetchPending(passcode: string): Promise<PhotoDTO[]> {
  const res = await apiFetch("/photos/pending?limit=100", { headers: auth(passcode) });
  return z.object({ photos: z.array(photoSchema) }).parse(await res.json()).photos;
}

/** One page of the Control panel's photo list; empty filters are left out of the URL. */
export async function fetchPhotos(query: PhotoListQuery, passcode: string): Promise<PhotoPageDTO> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const res = await apiFetch(`/photos/manage?${params}`, { headers: auth(passcode) });
  return photoPageSchema.parse(await res.json());
}

/** `since` is the start of the booth's day, so "uploads today" means today where it stands. */
export async function fetchStats(since: Date, passcode: string): Promise<PhotoStatsDTO> {
  const params = new URLSearchParams({ since: since.toISOString() });
  const res = await apiFetch(`/photos/stats?${params}`, { headers: auth(passcode) });
  return photoStatsSchema.parse(await res.json());
}

export async function updatePhoto(
  id: string,
  patch: PhotoPatch,
  passcode: string,
): Promise<PhotoDTO> {
  const res = await apiFetch(`/photos/${id}`, {
    method: "PATCH",
    headers: { ...auth(passcode), "content-type": "application/json" },
    // Sent as typed: the API trims the caption and turns an empty one into none.
    body: JSON.stringify(patch),
  });
  return photoResultSchema.parse(await res.json()).photo;
}

export async function approvePhoto(id: string, passcode: string): Promise<PhotoDTO> {
  const res = await apiFetch(`/photos/${id}/approve`, {
    method: "POST",
    headers: auth(passcode),
  });
  return photoResultSchema.parse(await res.json()).photo;
}

export async function removePhoto(id: string, passcode: string): Promise<void> {
  await apiFetch(`/photos/${id}`, { method: "DELETE", headers: auth(passcode) });
}

export async function sendRemoteCommand(command: RemoteCommand, passcode: string): Promise<void> {
  await apiFetch("/wall/remote", {
    method: "POST",
    headers: { ...auth(passcode), "content-type": "application/json" },
    body: JSON.stringify({ command }),
  });
}
