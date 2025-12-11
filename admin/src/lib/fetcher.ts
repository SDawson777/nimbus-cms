export class HttpError extends Error {
  status: number;

  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function readResponseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");

  if (isJson) {
    const clone = res.clone();

    try {
      return await clone.json();
    } catch (error) {
      return res.text();
    }
  }

  return res.text();
}

export function buildError(res: Response, body: unknown, fallback: string) {
  const parsedMessage =
    typeof body === "string"
      ? body
      : typeof body === "object" && body !== null
        ? (body as { message?: string }).message
        : undefined;
  const message = parsedMessage || fallback;
  return new HttpError(res.status, message, body);
}

export async function jsonFetcher<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  const body = await readResponseBody(res);

  if (!res.ok) {
    const fallback = `Request failed: ${res.status}`;
    throw buildError(res, body, fallback);
  }

  return body as T;
}
