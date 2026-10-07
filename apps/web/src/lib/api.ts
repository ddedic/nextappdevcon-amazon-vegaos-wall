import { appConfig } from "@/app/app.config";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

/** fetch against the wall API; non-2xx responses become ApiError with the server code. */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${appConfig.apiBaseUrl}${path}`, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    throw new ApiError(res.status, body?.error?.code ?? "UNKNOWN");
  }
  return res;
}
