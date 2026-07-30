const invitePathPattern = /^\/i\/c\/([a-z0-9_-]{8,160})\/?$/i;

export const appleAppSiteAssociation = {
  applinks: {
    details: [
      {
        appIDs: [
          '935PM55U6R.com.avalsys.duelwordsav.dev',
          '935PM55U6R.com.avalsys.duelwordsav',
        ],
        components: [
          {
            '/': '/i/c/*',
            comment: 'DuelWords AV challenge invitations',
          },
        ],
      },
    ],
  },
} as const;

const securityHeaders = {
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
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

    if (url.pathname === '/.well-known/apple-app-site-association') {
      const body = JSON.stringify(appleAppSiteAssociation);
      return new Response(isHead ? null : body, {
        headers: {
          'cache-control': 'public, max-age=0, must-revalidate',
          'content-type': 'application/json',
          ...securityHeaders,
        },
      });
    }

    const inviteMatch = invitePathPattern.exec(url.pathname);
    if (inviteMatch) {
      const playHostname = playHostnameForInviteHost(url.hostname);
      if (!playHostname) {
        return textResponse('Not found.', 404, isHead, { 'cache-control': 'no-store' });
      }
      return htmlResponse(invitePage(inviteMatch[1], playHostname), 200, isHead);
    }

    return textResponse('Not found.', 404, isHead, { 'cache-control': 'no-store' });
  },
};

function invitePage(inviteToken: string, playHostname: string): string {
  const nativeUrl = `com.avalsys.duelwordsav://i/c/${encodeURIComponent(inviteToken)}`;
  const webUrl = `https://${playHostname}/i/c/${encodeURIComponent(inviteToken)}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Word Duel invitation — DuelWords AV</title>
  <style>
    :root{color-scheme:light dark;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fbf7eb;color:#17211d}
    body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;box-sizing:border-box}
    main{width:min(100%,480px);padding:32px;border:1px solid #b8aa8b;border-radius:24px;background:#fffaf0;box-shadow:0 18px 50px #17211d1a}
    p{line-height:1.55;color:#53605a}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#4f8f31}
    h1{font-family:Georgia,serif;font-size:36px;line-height:1.05;margin:10px 0 14px}
    a{display:block;margin-top:24px;padding:15px 20px;border-radius:16px;background:#58bd35;color:#102311;text-align:center;text-decoration:none;font-weight:800}
    a.secondary{margin-top:12px;background:transparent;border:1px solid #75827b;color:inherit}
    @media(prefers-color-scheme:dark){:root{background:#101615;color:#f7f0df}main{background:#18211f;border-color:#46534e}p{color:#bec7c2}a{color:#102311}}
  </style>
</head>
<body><main><div class="eyebrow">DuelWords AV</div><h1>You have a Word Duel invitation.</h1><p>Review the challenge before joining. You can use the iPhone or iPad app, or play safely in this browser.</p><a href="${nativeUrl}">Open DuelWords AV</a><a class="secondary" href="${webUrl}">Play on the web</a></main></body>
</html>`;
}

function playHostnameForInviteHost(hostname: string): string | null {
  if (hostname === 'app.duelwords-av-preview.avalsys.com') {
    return 'play.duelwords-av-preview.avalsys.com';
  }
  if (hostname === 'app.duelwords-av.avalsys.com') {
    return 'play.duelwords-av.avalsys.com';
  }
  return null;
}

function htmlResponse(body: string, status: number, head: boolean): Response {
  return new Response(head ? null : body, {
    status,
    headers: {
      'cache-control': 'private, no-store',
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
