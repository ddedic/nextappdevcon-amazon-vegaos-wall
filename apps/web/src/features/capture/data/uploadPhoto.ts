import { type Tribe, type UploadResultDTO, uploadResultSchema } from "@vegaos-demo/shared";

import { apiFetch } from "@/lib/api";

type UploadPhotoArgs = { image: Blob; caption: string; tribe: Tribe };

export async function uploadPhoto({
  image,
  caption,
  tribe,
}: UploadPhotoArgs): Promise<UploadResultDTO> {
  const form = new FormData();
  form.set("image", image, "photo.jpg");
  form.set("caption", caption);
  form.set("tribe", tribe);
  form.set("consent", "true");
  const res = await apiFetch("/photos", { method: "POST", body: form });
  return uploadResultSchema.parse(await res.json());
}

export async function removeOwnPhoto(id: string, deleteToken: string): Promise<void> {
  await apiFetch(`/photos/${id}`, { method: "DELETE", headers: { "x-delete-token": deleteToken } });
}
