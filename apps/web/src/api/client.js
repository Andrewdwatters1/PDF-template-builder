const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
export async function apiFetch(path, init) {
    const res = await fetch(`${BASE}${path}`, init);
    if (!res.ok) {
        let errorMsg = res.statusText;
        try {
            const body = await res.json();
            errorMsg = body.error ?? errorMsg;
        }
        catch {
            // ignore JSON parse error
        }
        throw new Error(errorMsg);
    }
    return res.json();
}
export async function apiFetchBlob(path, init) {
    const res = await fetch(`${BASE}${path}`, init);
    if (!res.ok) {
        let errorMsg = res.statusText;
        try {
            const body = await res.json();
            errorMsg = body.error ?? errorMsg;
        }
        catch {
            // ignore JSON parse error
        }
        throw new Error(errorMsg);
    }
    return res.blob();
}
