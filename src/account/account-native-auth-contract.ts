const DUELWORDS_IOS_URL_SCHEME = /^com[.]avalsys[.]duelwordsav(?:[.]dev)?$/;

export function duelWordsIosSsoRedirectUrl(
  configuredScheme: string | readonly string[] | undefined,
): string {
  const schemes = typeof configuredScheme === 'string'
    ? [configuredScheme]
    : configuredScheme
      ? [...configuredScheme]
      : [];

  if (
    schemes.length !== 1
    || !schemes[0]
    || !DUELWORDS_IOS_URL_SCHEME.test(schemes[0])
  ) {
    throw new Error('DuelWords AV iOS requires one approved native URL scheme.');
  }

  return `${schemes[0]}://callback`;
}
