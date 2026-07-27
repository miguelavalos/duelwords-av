import { describe, expect, it } from 'vitest';

import worker from './index';

describe('DuelWords legal edge', () => {
  it.each([
    ['/', 'Play fair. Know your choices.'],
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
    expect(body).not.toContain('mailto:');
    expect(body).not.toContain('Google Mobile Ads');
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
    const post = await worker.fetch(new Request(
      'https://duelwords-av.avalsys.com/privacy/',
      { method: 'POST' },
    ));

    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect(missing.status).toBe(404);
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET, HEAD');
  });
});
