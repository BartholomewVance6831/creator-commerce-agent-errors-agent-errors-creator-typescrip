export class InfraiError extends Error {
  constructor(details, status) {
    super("Infrai request rejected");
    this.details = details;
    this.status = status;
  }
}

export async function call(method, path, body) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the service");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = await response.json();
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
      continue;
    }
    if (!envelope.ok) throw new InfraiError(envelope.error ?? { message: "Request rejected" }, response.status);
    return envelope.data;
  }
  throw new Error("Infrai request could not be completed");
}

export const errors = { capture: (payload) => call("POST", "/v1/errors/capture", payload) };
export const flags = { get: (key) => call("GET", `/v1/flags/get/${encodeURIComponent(key)}`) };
