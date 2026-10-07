import {
  type PhotoDTO,
  photoSchema,
  type RemoteCommand,
  type WallSnapshotDTO,
  wallSnapshotSchema,
} from "@vegaos-demo/shared";
import { z } from "zod";

import { apiFetch } from "@/lib/api";

const auth = (passcode: string) => ({ authorization: `Bearer ${passcode}` });

export async function fetchApproved(): Promise<WallSnapshotDTO> {
  const res = await apiFetch("/photos?limit=100");
  return wallSnapshotSchema.parse(await res.json());
}

export async function fetchPending(passcode: string): Promise<PhotoDTO[]> {
  const res = await apiFetch("/photos/pending?limit=100", { headers: auth(passcode) });
  return z.object({ photos: z.array(photoSchema) }).parse(await res.json()).photos;
}

export async function approvePhoto(id: string, passcode: string): Promise<void> {
  await apiFetch(`/photos/${id}/approve`, { method: "POST", headers: auth(passcode) });
}

export async function sendRemoteCommand(command: RemoteCommand, passcode: string): Promise<void> {
  await apiFetch("/wall/remote", {
    method: "POST",
    headers: { ...auth(passcode), "content-type": "application/json" },
    body: JSON.stringify({ command }),
  });
}

export async function removePhoto(id: string, passcode: string): Promise<void> {
  await apiFetch(`/photos/${id}`, { method: "DELETE", headers: auth(passcode) });
}
