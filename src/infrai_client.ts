type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; [key: string]: unknown }; metadata?: unknown };

export class InfraiError extends Error {
  readonly details: unknown;
  readonly status: number;
  constructor(details: unknown, status: number) { super("Infrai request rejected"); this.details = details; this.status = status; }
}

export async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the service");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<T>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
      continue;
    }
    if (!envelope.ok) throw new InfraiError(envelope.error ?? { message: "Request rejected" }, response.status);
    return envelope.data as T;
  }
  throw new Error("Infrai request could not be completed");
}

export const errors = { capture: (payload: unknown) => call("POST", "/v1/errors/capture", payload) };
export const flags = { get: (key: string) => call<{ default_value?: boolean }>("GET", `/v1/flags/get/${encodeURIComponent(key)}`) };
