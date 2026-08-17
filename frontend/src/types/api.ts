/** Matches the backend's global exception filter response shape. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

export function firstErrorMessage(body: ApiErrorBody | undefined, fallback: string): string {
  if (!body) return fallback;
  return Array.isArray(body.message) ? (body.message[0] ?? fallback) : body.message;
}
