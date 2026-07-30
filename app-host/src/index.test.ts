import { describe, expect, it } from 'vitest';

import worker, { type DuelWordsAppHostEnv } from './index';

const clerkHost = 'clerk.preview.example';
const publishableKey = `pk_test_${btoa(`${clerkHost}$`)}`;

function environment(overrides: Partial<DuelWordsAppHostEnv> = {}): DuelWordsAppHostEnv {
  return {
    ACCOUNTAV_API_BASE_URL: 'https://api-account-av-preview.avalsys.com',
    ACCOUNTAV_PUBLISHABLE_KEY: publishableKey,
    ASSETS: {
      fetch: async () => new Response('<!doctype html><html></html>', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
    },
    DUELWORDSAV_API_BASE_URL: 'https://api-account-av-preview.avalsys.com',
    DUELWORDSAV_CONVEX_URL: 'https://duelwords-preview.convex.cloud',
    ENVIRONMENT: 'preview',
    ...overrides,
  };
}

describe('DuelWords web app host', () => {
  it('serves no-store client-safe runtime configuration without server secrets', async () => {
    const response = await worker.fetch(
      new Request('https://play.duelwords-av-preview.avalsys.com/runtime-config.js'),
      environment(),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('content-type')).toContain('application/javascript');
    expect(body).toContain('"configured":true');
    expect(body).toContain('https://api-account-av-preview.avalsys.com');
    expect(body).toContain('https://duelwords-preview.convex.cloud');
    expect(body).not.toContain('secret');
  });

  it('fails closed when an environment points at the wrong backend or key class', async () => {
    const response = await worker.fetch(
      new Request('https://play.duelwords-av-preview.avalsys.com/runtime-config.js'),
      environment({ ACCOUNTAV_API_BASE_URL: 'https://api-account-av.avalsys.com' }),
    );

    expect(response.status).toBe(503);
    expect(await response.text()).toContain('"configured":false');
  });

  it('adds browser security headers and bounded caching to HTML assets', async () => {
    const response = await worker.fetch(
      new Request('https://play.duelwords-av-preview.avalsys.com/word-duel/challenge'),
      environment(),
    );
    const csp = response.headers.get('content-security-policy') ?? '';

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-cache, must-revalidate');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(csp).toContain(`https://${clerkHost}`);
    expect(csp).toContain('https://api-account-av-preview.avalsys.com');
    expect(csp).toContain('https://duelwords-preview.convex.cloud');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('supports HEAD and rejects mutations before asset handling', async () => {
    const head = await worker.fetch(
      new Request('https://play.duelwords-av-preview.avalsys.com/runtime-config.js', { method: 'HEAD' }),
      environment(),
    );
    const post = await worker.fetch(
      new Request('https://play.duelwords-av-preview.avalsys.com/', { method: 'POST' }),
      environment(),
    );

    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect(post.status).toBe(405);
    expect(post.headers.get('allow')).toBe('GET, HEAD');
  });
});
