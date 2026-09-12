import type { ApiErrorBody } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string | undefined;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = "ApiError";
    this.code = body.error.code;
    this.status = status;
    this.requestId = body.error.request_id;
  }
}

/** Thrown when the backend can't be reached at all (network/DNS/refused). */
export class ApiUnreachableError extends Error {
  constructor(cause: unknown) {
    super("Start Currency's server could not be reached.");
    this.name = "ApiUnreachableError";
    this.cause = cause;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      // Price/availability freshness matters more than caching here.
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiUnreachableError(cause);
  }

  if (!response.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // fall through to generic error below
    }
    if (body?.error) {
      throw new ApiError(response.status, body);
    }
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
