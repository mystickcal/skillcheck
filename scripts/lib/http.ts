type FetchOptions = {
  headers?: Record<string, string>;
  minDelayMs?: number;
  timeoutMs?: number;
};

let lastAt = 0;

export async function fetchText(url: string, options: FetchOptions = {}): Promise<{ status: number; text: string; headers: Headers }> {
  let attempt = 0;
  while (true) {
    await pace(options.minDelayMs ?? 0);
    const response = await fetch(url, {
      headers: {
        "user-agent": "skillcheck-ingest/0.1 (metadata index; +https://github.com/mystickcal/skillcheck)",
        accept: "application/json, text/plain, application/xml, */*",
        ...options.headers,
      },
      signal: AbortSignal.timeout(options.timeoutMs ?? 20000),
    });
    if ((response.status === 429 || response.status === 503) && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1);
      await response.arrayBuffer();
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      attempt += 1;
      continue;
    }
    const text = await response.text();
    return { status: response.status, text, headers: response.headers };
  }
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<{ status: number; data: T; headers: Headers }> {
  const result = await fetchText(url, options);
  if (result.status === 304) {
    return { status: result.status, data: null as T, headers: result.headers };
  }
  if (!result.status.toString().startsWith("2")) {
    throw new Error(`${url} returned ${result.status}`);
  }
  return { status: result.status, data: JSON.parse(result.text) as T, headers: result.headers };
}

async function pace(minDelayMs: number): Promise<void> {
  if (minDelayMs <= 0) return;
  const wait = lastAt + minDelayMs - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastAt = Date.now();
}
