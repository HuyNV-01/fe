import viMessages from "../../messages/vi.json";

export function tStore(
  keyPath: string,
  params?: Record<string, string | number>,
): string {
  const segments = keyPath.split(".");
  let current: any = viMessages;

  for (const seg of segments) {
    if (current == null || typeof current !== "object") {
      return keyPath;
    }
    current = current[seg];
  }

  if (typeof current !== "string") {
    return keyPath;
  }

  if (!params) return current;

  return current.replace(/\{(\w+)\}/g, (_, token) =>
    params[token] !== undefined ? String(params[token]) : `{${token}}`,
  );
}