export interface ApiFetchDeps {
  fetch: typeof fetch;
  reload: () => void;
}

/**
 * Fetch wrapper that handles the platform "waking" response.
 * Returns null after triggering a reload when the server answers
 * HTTP 503 with JSON {"status": "waking"}; otherwise returns the response.
 */
export async function apiFetch(
  path: string,
  options?: RequestInit,
  deps?: Partial<ApiFetchDeps>,
): Promise<Response | null> {
  const doFetch = deps?.fetch ?? ((...a: Parameters<typeof fetch>) => globalThis.fetch(...a));
  const reload = deps?.reload ?? (() => location.reload());

  const res = await doFetch(path, options);
  if (res.status !== 503) return res;

  let body: unknown;
  try {
    body = await res.clone().json();
  } catch {
    return res;
  }

  if (
    typeof body === "object" &&
    body !== null &&
    (body as { status?: unknown }).status === "waking"
  ) {
    reload();
    return null;
  }
  return res;
}
