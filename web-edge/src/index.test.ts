import { describe, expect, it } from 'vitest';

import worker, { appleAppSiteAssociation } from './index';

describe('DuelWords invite edge', () => {
  it('serves a bounded AASA file for development and production', async () => {
    const response = await worker.fetch(new Request(
      'https://app.duelwords-av.avalsys.com/.well-known/apple-app-site-association',
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual(appleAppSiteAssociation);
    expect(JSON.stringify(appleAppSiteAssociation)).not.toContain('/s/r/*');
  });

  it('serves a no-store invite fallback without contacting an API', async () => {
    const response = await worker.fetch(new Request(
      'https://app.duelwords-av.avalsys.com/i/c/dwr_1234567890abcdef',
    ));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(body).toContain('com.avalsys.duelwordsav://i/c/dwr_1234567890abcdef');
    expect(body).toContain('review the challenge before joining');
  });

  it('does not expose arbitrary paths or malformed tokens', async () => {
    const invalid = await worker.fetch(new Request(
      'https://app.duelwords-av.avalsys.com/i/c/short',
    ));
    const unrelated = await worker.fetch(new Request(
      'https://app.duelwords-av.avalsys.com/account',
    ));

    expect(invalid.status).toBe(404);
    expect(unrelated.status).toBe(404);
  });

  it('supports HEAD and rejects mutations', async () => {
    const head = await worker.fetch(new Request(
      'https://app.duelwords-av.avalsys.com/i/c/dwr_1234567890abcdef',
      { method: 'HEAD' },
    ));
    const post = await worker.fetch(new Request(
      'https://app.duelwords-av.avalsys.com/i/c/dwr_1234567890abcdef',
      { method: 'POST' },
    ));

    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET, HEAD');
  });
});
