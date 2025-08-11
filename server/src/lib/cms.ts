export async function fetchCMS<T>(
  query: string,
  params: Record<string, any>,
  opts?: { preview?: boolean; fallbackPath?: string }
): Promise<T> {
  // Adds preview + JSON fallback support (no breaking changes)
  const { preview = false, fallbackPath } = opts || {};
  try {
    const token = preview ? process.env.SANITY_PREVIEW_TOKEN : undefined;
    // ... perform GROQ fetch with/without token
    // return data as T
    return {} as T;
  } catch (err) {
    if (fallbackPath) {
      const fallback = await import(fallbackPath);
      return (fallback.default || fallback) as T;
    }
    throw err;
  }
}
