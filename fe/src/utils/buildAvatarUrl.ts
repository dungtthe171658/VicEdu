export function buildAvatarUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  // If already absolute (http/https), return as-is
  if (/^https?:\/\//i.test(raw)) return raw;

  // Base API URL (may include /api). Fallback suits local dev.
  const base = (import.meta as any)?.env?.VITE_API_URL || "http://localhost:8888/api";

  // Normalize base and drop trailing /api for static files
  let normalizedBase = String(base).replace(/\/+$/, "");
  normalizedBase = normalizedBase.replace(/\/api$/i, "");

  const path = String(raw).replace(/^\/+/, "");
  return `${normalizedBase}/${path}`;
}

