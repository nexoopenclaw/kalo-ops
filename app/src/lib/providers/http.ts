export type HttpJson = Record<string, unknown> | unknown[];

export function isLiveTestEnabled() {
  const raw = process.env.INTEGRATIONS_LIVE_TESTS ?? process.env.PROVIDER_LIVE_TESTS;
  return String(raw ?? "").trim().toLowerCase() === "true" || String(raw ?? "").trim() === "1";
}

export function getTimeoutMs(defaultMs = 8000) {
  const raw = process.env.INTEGRATIONS_TEST_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return defaultMs;
}

export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<{ ok: true; status: number; json: HttpJson } | { ok: false; status: number; error: string; body?: string }> {
  const timeoutMs = init.timeoutMs ?? getTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      let body = "";
      try {
        body = isJson ? JSON.stringify(await res.json()) : (await res.text());
      } catch {
        body = "";
      }
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        body: body.slice(0, 800),
      };
    }

    const json = (isJson ? await res.json() : (await res.text())) as HttpJson;
    return { ok: true, status: res.status, json };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected fetch error";
    return { ok: false, status: 0, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
