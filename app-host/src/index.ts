const RUNTIME_CONFIG_PATH = '/runtime-config.js';

export type DuelWordsAppHostEnv = {
  ACCOUNTAV_API_BASE_URL: string;
  ACCOUNTAV_PUBLISHABLE_KEY: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
  DUELWORDSAV_API_BASE_URL: string;
  DUELWORDSAV_CONVEX_URL: string;
  ENVIRONMENT: string;
};

const staticSecurityHeaders = {
  'cross-origin-opener-policy': 'same-origin-allow-popups',
  'permissions-policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
} as const;

export default {
  async fetch(request: Request, env: DuelWordsAppHostEnv): Promise<Response> {
    const isHead = request.method === 'HEAD';
    if (request.method !== 'GET' && !isHead) {
      return applySecurityHeaders(new Response(isHead ? null : 'Method not allowed.', {
        status: 405,
        headers: {
          allow: 'GET, HEAD',
          'cache-control': 'no-store',
          'content-type': 'text/plain; charset=utf-8',
        },
      }), env);
    }

    const url = new URL(request.url);
    if (url.pathname === RUNTIME_CONFIG_PATH) {
      return runtimeConfigResponse(env, isHead);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const response = new Response(isHead ? null : assetResponse.body, assetResponse);
    if (isHtmlResponse(response)) {
      response.headers.set('cache-control', 'private, no-cache, must-revalidate');
    } else if (response.ok && isHashedAsset(url.pathname)) {
      response.headers.set('cache-control', 'public, max-age=31536000, immutable');
    }
    return applySecurityHeaders(response, env);
  },
};

function runtimeConfigResponse(env: DuelWordsAppHostEnv, head: boolean): Response {
  const config = validatedRuntimeConfig(env);
  const body = `globalThis.__DUELWORDSAV_WEB_RUNTIME__=${safeJson(config ?? { configured: false })};`;
  return applySecurityHeaders(new Response(head ? null : body, {
    status: config ? 200 : 503,
    headers: {
      'cache-control': 'private, no-store',
      'content-type': 'application/javascript; charset=utf-8',
    },
  }), env);
}

function validatedRuntimeConfig(env: DuelWordsAppHostEnv) {
  const environment = env.ENVIRONMENT;
  const expectedApiBaseUrl = environment === 'preview'
    ? 'https://api-account-av-preview.avalsys.com'
    : environment === 'production'
      ? 'https://api-account-av.avalsys.com'
      : null;
  const expectedKeyPrefix = environment === 'preview' ? 'pk_test_' : 'pk_live_';
  const convexUrl = safeHttpsUrl(env.DUELWORDSAV_CONVEX_URL);

  if (
    !expectedApiBaseUrl
    || env.ACCOUNTAV_API_BASE_URL !== expectedApiBaseUrl
    || env.DUELWORDSAV_API_BASE_URL !== expectedApiBaseUrl
    || !env.ACCOUNTAV_PUBLISHABLE_KEY.startsWith(expectedKeyPrefix)
    || !convexUrl
    || !new URL(convexUrl).hostname.endsWith('.convex.cloud')
  ) return null;

  return {
    configured: true,
    environment,
    accountPublishableKey: env.ACCOUNTAV_PUBLISHABLE_KEY,
    accountApiBaseUrl: expectedApiBaseUrl,
    apiBaseUrl: expectedApiBaseUrl,
    convexUrl,
  } as const;
}

function applySecurityHeaders(response: Response, env: DuelWordsAppHostEnv): Response {
  for (const [name, value] of Object.entries(staticSecurityHeaders)) {
    response.headers.set(name, value);
  }
  response.headers.set('content-security-policy', contentSecurityPolicy(env));
  return response;
}

function contentSecurityPolicy(env: DuelWordsAppHostEnv): string {
  const origins = [
    clerkFrontendApiOrigin(env.ACCOUNTAV_PUBLISHABLE_KEY),
    safeHttpsOrigin(env.ACCOUNTAV_API_BASE_URL),
    safeHttpsOrigin(env.DUELWORDSAV_API_BASE_URL),
    safeHttpsOrigin(env.DUELWORDSAV_CONVEX_URL),
  ].filter((value): value is string => value !== null);
  const dynamicOrigins = [...new Set(origins)].join(' ');
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${dynamicOrigins} https://challenges.cloudflare.com https://*.protect.clerk.com`,
    `connect-src 'self' ${dynamicOrigins} wss://*.convex.cloud https://clerk-telemetry.com https://*.clerk-telemetry.com https://img.clerk.com https://*.protect.clerk.com`,
    "img-src 'self' data: blob: https://img.clerk.com",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
    "frame-src 'self' https://challenges.cloudflare.com https://*.protect.clerk.com",
    "media-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
}

function clerkFrontendApiOrigin(publishableKey: string): string | null {
  const encoded = publishableKey.replace(/^pk_(?:test|live)_/, '').replace(/\$$/, '');
  if (!encoded) return null;
  try {
    const hostname = atob(encoded).replace(/\$$/, '').trim().toLowerCase();
    if (!/^[a-z0-9.-]+$/.test(hostname) || hostname.includes('..')) return null;
    return `https://${hostname}`;
  } catch {
    return null;
  }
}

function safeHttpsOrigin(value: string): string | null {
  const url = safeHttpsUrl(value);
  return url ? new URL(url).origin : null;
}

function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:'
      || url.username
      || url.password
      || url.search
      || url.hash
    ) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function isHtmlResponse(response: Response): boolean {
  return response.headers.get('content-type')?.startsWith('text/html') ?? false;
}

function isHashedAsset(pathname: string): boolean {
  return /^\/_expo\/static\/(?:css|js)\/[^/]+-[a-z0-9]+\.(?:css|js)$/i.test(pathname);
}
