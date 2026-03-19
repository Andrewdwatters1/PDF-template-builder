const BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';

export function getFieldDefsHeaders(): Record<string, string> {
  const key = import.meta.env.VITE_FIELD_DEFINITIONS_API_KEY as string | undefined;
  return key ? { 'x-api-key': key } : {};
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    let errorMsg = res.statusText;
    try {
      const body = await res.json() as { error?: string };
      errorMsg = body.error ?? errorMsg;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorMsg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiFetchBlob(path: string, init?: RequestInit): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    let errorMsg = res.statusText;
    try {
      const body = await res.json() as { error?: string };
      errorMsg = body.error ?? errorMsg;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorMsg);
  }
  return res.blob();
}
