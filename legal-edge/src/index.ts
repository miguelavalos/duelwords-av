import { legalPage, legalPageKey } from './legal-page';

const legalHosts = new Set([
  'duelwords-av-preview.avalsys.com',
  'duelwords-av.avalsys.com',
]);

const securityHeaders = {
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
} as const;

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const isHead = request.method === 'HEAD';
    if (request.method !== 'GET' && !isHead) {
      return textResponse('Method not allowed.', 405, isHead, {
        allow: 'GET, HEAD',
        'cache-control': 'no-store',
      });
    }

    const pageKey = legalPageKey(url.pathname);
    const isLocal = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
    if (pageKey !== null && (legalHosts.has(url.hostname) || isLocal)) {
      return htmlResponse(legalPage(pageKey), isHead);
    }

    return textResponse('Not found.', 404, isHead, { 'cache-control': 'no-store' });
  },
};

function htmlResponse(body: string, head: boolean): Response {
  return new Response(head ? null : body, {
    headers: {
      'cache-control': 'public, max-age=300, must-revalidate',
      'content-type': 'text/html; charset=utf-8',
      ...securityHeaders,
    },
  });
}

function textResponse(
  body: string,
  status: number,
  head: boolean,
  headers: Record<string, string>,
): Response {
  return new Response(head ? null : body, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      ...securityHeaders,
      ...headers,
    },
  });
}
