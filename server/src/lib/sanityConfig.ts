export function isSanityConfigured() {
  return Boolean(
    process.env.SANITY_PROJECT_ID &&
      process.env.SANITY_DATASET &&
      (process.env.SANITY_API_TOKEN || process.env.SANITY_PREVIEW_TOKEN),
  );
}
