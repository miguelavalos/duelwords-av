const appJson = require('./app.json');

function createExpoConfig() {
  const apiBaseUrl = normalizedOptionalString(process.env.EXPO_PUBLIC_DUELWORDSAV_API_BASE_URL);
  const apiDisabled = isRuntimeDisabled(process.env.EXPO_PUBLIC_DUELWORDSAV_API_DISABLED);
  const convexUrl = normalizedOptionalString(process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_URL);
  const convexRealtimeDisabled = isRuntimeDisabled(process.env.EXPO_PUBLIC_DUELWORDSAV_CONVEX_REALTIME_DISABLED);

  return {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra ?? {}),
      duelWordsAv: {
        ...(appJson.expo.extra?.duelWordsAv ?? {}),
        apiBaseUrl,
        apiDisabled,
        convexRealtimeDisabled,
        convexUrl,
      },
    },
  };
}

function normalizedOptionalString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRuntimeDisabled(value) {
  return !(typeof value === 'string' && value.trim().toLowerCase() === 'false');
}

module.exports = createExpoConfig;
