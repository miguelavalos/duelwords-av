import { describe, expect, it } from 'vitest';

import worker from './index';

describe('DuelWords legal edge', () => {
  it.each([
    ['/privacy/', 'Privacy Policy'],
    ['/terms/', 'Terms of Use'],
    ['/support/', 'DuelWords Support'],
    ['/delete-account/', 'Delete your Account AV account'],
    ['/notices/', 'Dictionary and open-source notices'],
  ])('serves the branded legal page %s without a runtime dependency', async (path, heading) => {
    const response = await worker.fetch(new Request(`https://duelwords-av.avalsys.com${path}`));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=300, must-revalidate');
    expect(response.headers.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(body).toContain(heading);
    expect(body).toContain('DuelWords AV');
    expect(body).toContain('cdn.avalsys.com/apps-av/duelwords-av/web-v1/');
    expect(body).not.toContain('mailto:');
    expect(body).not.toContain('Google Mobile Ads');
  });

  it.each([
    ['/', 'lang="en"', 'One word. Two paths. A fair duel.', 'Official Daily'],
    ['/es/', 'lang="es"', 'Una palabra. Dos caminos. Un duelo justo.', 'Reto diario oficial'],
    ['/ca/', 'lang="ca"', 'Una paraula. Dos camins. Un duel just.', 'Repte diari oficial'],
    ['/fr/', 'lang="fr"', 'Un mot. Deux chemins. Un duel équitable.', 'Défi quotidien officiel'],
    ['/de/', 'lang="de"', 'Ein Wort. Zwei Wege. Ein faires Duell.', 'Offizielles Daily'],
  ])('serves the localized commercial page %s', async (path, language, heading, dailyMode) => {
    const response = await worker.fetch(new Request(
      `https://duelwords-av.avalsys.com${path}`,
    ));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain(language);
    expect(body).toContain(heading);
    expect(body).toContain(dailyMode);
    expect(body).toContain('cdn.avalsys.com/apps-av/duelwords-av/web-v1/');
    expect(body).not.toContain('<script');
    expect(body).not.toContain('<form');
    expect(body).not.toContain('apps.apple.com');
  });

  it('keeps preview pages out of search indexes and points them to preview Apps AV', async () => {
    const response = await worker.fetch(new Request(
      'https://duelwords-av-preview.avalsys.com/es/',
    ));
    const body = await response.text();

    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(body).toContain('https://apps-av-preview.avalsys.com/');
    expect(body).toContain('https://duelwords-av.avalsys.com/es/');
  });

  it('allows only the approved brand CDN in the commercial CSP', async () => {
    const response = await worker.fetch(new Request(
      'https://duelwords-av.avalsys.com/',
    ));

    expect(response.headers.get('content-security-policy')).toBe(
      "default-src 'none'; img-src https://cdn.avalsys.com; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
  });

  it('keeps account deletion public and signed-in deletion inside the app', async () => {
    const response = await worker.fetch(new Request(
      'https://duelwords-av.avalsys.com/delete-account/',
    ));
    const body = await response.text();

    expect(body).toContain('The option is shown only while you are signed in.');
    expect(body).toContain('stored guesses are deleted');
    expect(body).toContain('support-av.avalsys.com');
  });

  it('supports HEAD and rejects unrelated paths and mutation methods', async () => {
    const head = await worker.fetch(new Request(
      'https://duelwords-av.avalsys.com/privacy/',
      { method: 'HEAD' },
    ));
    const missing = await worker.fetch(new Request(
      'https://duelwords-av.avalsys.com/admin/',
    ));
    const missingLocalizedLegal = await worker.fetch(new Request(
      'https://duelwords-av.avalsys.com/es/privacy/',
    ));
    const post = await worker.fetch(new Request(
      'https://duelwords-av.avalsys.com/privacy/',
      { method: 'POST' },
    ));

    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect(missing.status).toBe(404);
    expect(missingLocalizedLegal.status).toBe(404);
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET, HEAD');
  });
});
