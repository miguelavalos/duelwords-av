export type LegalPageKey = 'privacy' | 'terms' | 'support' | 'delete-account' | 'notices';

const updatedAt = 'July 27, 2026';

const navigation: Array<{ key: LegalPageKey; label: string }> = [
  { key: 'privacy', label: 'Privacy' },
  { key: 'terms', label: 'Terms' },
  { key: 'support', label: 'Support' },
  { key: 'delete-account', label: 'Delete account' },
  { key: 'notices', label: 'Notices' },
];

const pages: Record<LegalPageKey, { title: string; lead: string; body: string }> = {
  privacy: {
    title: 'Privacy Policy',
    lead: 'DuelWords AV keeps local play on your device and uses only the data needed for accounts, connected games, and reliable diagnostics.',
    body: `
      <section><h2>What DuelWords collects</h2><p>If you use Account AV, we process your name, email address, and account identifier so you can sign in and use the same identity across supported Apps AV products. Connected Challenge and Official Daily process gameplay state such as language, attempts, results, and safe player names.</p></section>
      <section><h2>What stays on your device</h2><p>Practice, Play Avi, bundled word lists, most board state, and local progress are designed to work on your device. The server does not need a request for each word you type. A connected game sends only the state required to validate and coordinate that game.</p></section>
      <section><h2>Diagnostics</h2><p>We use diagnostic services to understand crashes and performance problems. Diagnostic events may include crash, performance, device/runtime information, and coarse location derived by the provider. They do not include your raw IP address, Account AV identifier, request contents, invitation token, room identifier, secret word, guess, answer, or opponent details. Coarse location is not linked to your account and is not used for tracking.</p></section>
      <section><h2>Sharing and tracking</h2><p>We use service providers only to operate Account AV, connected play, hosting, and diagnostics. DuelWords AV V1 does not include advertising, sell personal data, or track you across apps and websites owned by other companies.</p></section>
      <section><h2>Retention and deletion</h2><p>Account and connected-game data is retained while needed to provide the service, protect game integrity, and meet legal or operational obligations. You can start account deletion inside DuelWords AV. Guesses and account links are removed; anonymous match structure may remain without identifying you.</p></section>
      <section><h2>Your choices</h2><p>You can play local modes without an account, sign out from Account, or delete your Account AV identity from the app. For help, use the <a href="/support/">support page</a>.</p></section>
    `,
  },
  terms: {
    title: 'Terms of Use',
    lead: 'These terms explain the fair, personal use of DuelWords AV and its connected word-game services.',
    body: `
      <section><h2>Using DuelWords</h2><p>You may use DuelWords AV for personal, lawful play. Keep your Account AV credentials secure and do not use automation, tampering, harassment, or other methods that disrupt games or give an unfair advantage.</p></section>
      <section><h2>Guest and account play</h2><p>Local modes can work without an account. Account AV is required for features that need a stable identity. Challenge invitations are private links; share them only with the person you intend to invite.</p></section>
      <section><h2>Availability</h2><p>Local play is designed to remain available without a connection. Connected Challenge, Official Daily, sign-in, and diagnostics depend on online services and may occasionally be unavailable for maintenance or technical reasons.</p></section>
      <section><h2>Content and dictionaries</h2><p>Word lists are provided for gameplay and can contain uncommon or context-sensitive words. Acceptance of a word in the game is not a statement about its suitability outside the game. Source and license information is available in <a href="/notices/">Notices</a>.</p></section>
      <section><h2>Changes</h2><p>We may update the app or these terms as DuelWords evolves. Material changes will be reflected here with a new effective date. Stop using the service if you do not accept an updated term.</p></section>
      <section><h2>Questions</h2><p>Use the <a href="/support/">support page</a> for questions about these terms.</p></section>
    `,
  },
  support: {
    title: 'DuelWords Support',
    lead: 'Get help with sign-in, connected challenges, Daily, local play, privacy, or account deletion.',
    body: `
      <section><h2>Start in the app</h2><p>Open Settings for language and legal information. Open Account for sign-in, sign-out, Account AV status, and account deletion. If a connected game cannot continue, keep the invitation link and describe the step that failed without sharing the secret word or your guesses.</p></section>
      <section><h2>Contact Apps AV Support</h2><p>Use the secure <a class="button" href="https://support-av.avalsys.com">Apps AV support site</a>. Include DuelWords AV, your app version, device model, and the approximate time of the problem. Never send passwords, sign-in codes, invitation tokens, or secret words.</p></section>
      <section><h2>Email fallback</h2><p>If the support site is unavailable, contact support [at] avalsys [dot] com. This masked address is a fallback; account deletion remains available directly inside the app.</p></section>
    `,
  },
  'delete-account': {
    title: 'Delete your Account AV account',
    lead: 'DuelWords AV lets a signed-in user start permanent Account AV deletion from inside the app.',
    body: `
      <section><h2>Delete from DuelWords AV</h2><ol><li>Open DuelWords AV and go to <strong>Account</strong>.</li><li>Choose <strong>Delete account</strong>.</li><li>Review the shared Account AV impact and confirm deletion.</li></ol><p>The option is shown only while you are signed in. If you are signed out, sign in to the account you want to delete first.</p></section>
      <section><h2>What deletion removes</h2><p>Deletion removes the Account AV identity and the personal data attached to it across supported Apps AV products. In DuelWords, stored guesses are deleted, account identifiers and display names are removed from game history, and realtime account sessions are removed. Anonymous match structure can remain so the opponent's result stays consistent.</p></section>
      <section><h2>Before confirming</h2><p>Deletion is permanent and affects the shared Account AV identity, not only DuelWords AV. Local data on other devices may remain until those apps are opened, signed out, reset, or removed.</p></section>
      <section><h2>Cannot access the app?</h2><p>Use the <a href="https://support-av.avalsys.com">Apps AV support site</a>. Provide enough information to locate your account, but never send a password or one-time sign-in code.</p></section>
    `,
  },
  notices: {
    title: 'Dictionary and open-source notices',
    lead: 'DuelWords AV includes auditable five-letter word data for English, Spanish, Catalan, French, and German local play.',
    body: `
      <section><h2>English</h2><p>The English allowlist is based on ESDB / SCOWL. The bundled target set also uses a pinned Mozilla Gaia English frequency ranking. Upstream ESDB / SCOWL copyright and component notices are distributed with the app.</p></section>
      <section><h2>Spanish</h2><p>The Spanish allowlist is based on RLA-ES / hunspell-es under Mozilla Public License 1.1 or later. Spanish normalization preserves ñ and accepts omitted vowel accents.</p></section>
      <section><h2>Catalan, French, and German</h2><p>These word lists use pinned Mozilla Gaia Latin keyboard sources under Apache License 2.0. Catalan source attribution includes Professor Kevin Scannell of Saint Louis University; several Gaia lists originated from Android LatinIME.</p></section>
      <section><h2>Gameplay curation</h2><p>Valid guesses and possible target words are not identical sets. Targets use a smaller reviewed set. Accents and umlauts are normalized for keyboard-tolerant lookup; German sharp-s entries are excluded because one character can expand into two tiles.</p></section>
      <section><h2>Software notices</h2><p>DuelWords AV also includes open-source software and third-party SDKs under their respective licenses. Complete license texts and pinned source details are distributed with the source and release materials.</p></section>
    `,
  },
};

export function legalPageKey(pathname: string): LegalPageKey | 'index' | null {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  if (normalized === '/') return 'index';
  const key = normalized.slice(1) as LegalPageKey;
  return Object.hasOwn(pages, key) ? key : null;
}

export function legalPage(key: LegalPageKey | 'index'): string {
  const page = key === 'index'
    ? {
        title: 'Play fair. Know your choices.',
        lead: 'Privacy, account, support, and dictionary information for DuelWords AV.',
        body: `<section class="index-links">${navigation.map((item) => `<a href="/${item.key}/"><strong>${item.label}</strong><span>${indexDescription(item.key)}</span></a>`).join('')}</section>`,
      }
    : pages[key];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="description" content="${page.lead}">
  <title>${page.title} — DuelWords AV</title>
  <style>${styles}</style>
</head>
<body>
  <header>
    <a class="brand" href="/" aria-label="DuelWords AV legal home">${brandMark}</a>
    <nav aria-label="Legal pages">${navigation.map((item) => `<a${key === item.key ? ' aria-current="page"' : ''} href="/${item.key}/">${item.label}</a>`).join('')}</nav>
  </header>
  <main>
    <h1>${page.title}</h1>
    <p class="lead">${page.lead}</p>
    ${key === 'index' ? '' : `<p class="updated">Effective ${updatedAt}</p>`}
    <div class="content">${page.body}</div>
  </main>
  <footer><span>DuelWords AV</span><span>An Apps AV product by Avalsys</span></footer>
</body>
</html>`;
}

function indexDescription(key: LegalPageKey) {
  const descriptions: Record<LegalPageKey, string> = {
    privacy: 'What the app collects, what stays local, and how diagnostics work.',
    terms: 'The fair-use and connected-service rules for word duels.',
    support: 'Help with play, sign-in, privacy, and technical problems.',
    'delete-account': 'How to permanently delete your shared Account AV identity.',
    notices: 'Word-list sources, curation, attribution, and licenses.',
  };
  return descriptions[key];
}

const brandMark = `<svg viewBox="0 0 520 114" role="img" aria-label="DuelWords AV"><g fill="none" fill-rule="evenodd"><g transform="translate(6 7) scale(.25)"><path d="M64 66c86-18 171-18 257 0l-10 284c-79 25-157 25-237 0z" fill="#F7F0DE" stroke="currentColor" stroke-width="12"/><path d="M93 112h80v202H93zm105 0h80v202h-80z" stroke="currentColor" stroke-width="8"/><path d="M93 180h80m-80 67h80m25-67h80m-80 67h80" stroke="currentColor" stroke-width="6"/><path d="M99 253h68v55H99zm105 0h68v55h-68z" fill="#58bd35"/><path d="M188 84v250" stroke="currentColor" stroke-width="5"/></g><text x="104" y="77" fill="currentColor" font-family="Snell Roundhand, Brush Script MT, cursive" font-size="65" font-weight="700">DuelWords</text><path d="M110 89c65 5 151-7 265-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".65"/><g transform="translate(434 32) rotate(-3 30 22)"><path d="M4 10c16-4 35-4 52 1l-2 30c-16 4-33 4-49 0z" fill="#F7F0DE" stroke="#58bd35" stroke-width="2"/><text x="30" y="34" fill="#397A41" font-family="Avenir Next,Arial,sans-serif" font-size="22" font-weight="800" text-anchor="middle">AV</text></g></g></svg>`;

const styles = `
:root{color-scheme:light dark;--paper:#fbf7eb;--surface:#fffaf0;--ink:#173a59;--body:#334a48;--muted:#69766f;--line:#c9bea5;--green:#58bd35;--green-dark:#397a41;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--paper);color:var(--body)}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 80% 0,#e9f4df 0,transparent 32rem),var(--paper)}
header{max-width:1120px;margin:0 auto;padding:28px 28px 18px;display:flex;align-items:center;justify-content:space-between;gap:28px}.brand{color:var(--ink);width:260px;line-height:0}.brand svg{display:block;width:100%;height:auto}nav{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}nav a{color:var(--body);font-size:14px;font-weight:700;text-decoration:none;padding:9px 11px;border-radius:999px}nav a:hover,nav a:focus-visible,nav a[aria-current=page]{background:#dcebd4;color:#244f28;outline:none}
main{width:min(100% - 48px,780px);margin:48px auto 90px}h1{font-family:Georgia,"Times New Roman",serif;color:var(--ink);font-size:clamp(42px,8vw,72px);line-height:1.02;letter-spacing:-.045em;margin:0 0 20px;max-width:13ch}.lead{font-size:clamp(19px,3vw,24px);line-height:1.45;color:var(--body);max-width:66ch;margin:0}.updated{font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--green-dark);margin:22px 0 0}.content{margin-top:52px;border-top:1px solid var(--line)}section{padding:30px 0;border-bottom:1px solid var(--line)}h2{font-family:Georgia,"Times New Roman",serif;color:var(--ink);font-size:27px;line-height:1.18;margin:0 0 12px}p,li{font-size:17px;line-height:1.72}p{margin:0}ol{padding-left:24px;margin:0 0 18px}li+li{margin-top:6px}a{color:var(--green-dark);text-underline-offset:3px}.button{display:inline-block;margin-top:18px;padding:13px 18px;border-radius:14px;background:var(--green);color:#102311;text-decoration:none;font-weight:850}
.index-links{display:grid;grid-template-columns:1fr 1fr;gap:14px;border-bottom:0}.index-links a{display:flex;flex-direction:column;gap:7px;padding:24px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--surface) 88%,transparent);text-decoration:none;color:var(--body);transition:transform .16s ease,border-color .16s ease}.index-links a:hover,.index-links a:focus-visible{transform:translateY(-2px);border-color:var(--green-dark);outline:none}.index-links strong{font-family:Georgia,"Times New Roman",serif;color:var(--ink);font-size:23px}.index-links span{line-height:1.5}
footer{max-width:1120px;margin:0 auto;padding:26px 28px 34px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:20px;color:var(--muted);font-size:13px}
@media(max-width:760px){html,body{max-width:100%;overflow-x:hidden}header{width:100%;min-width:0;align-items:flex-start;flex-direction:column}.brand{width:220px;max-width:100%}nav{width:100%;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;justify-content:stretch}nav a{min-width:0;font-size:12px;line-height:1.2;padding:9px 4px;text-align:center;overflow-wrap:anywhere}main{width:calc(100% - 36px);min-width:0;margin-top:34px}.content{margin-top:40px}.index-links{width:100%;min-width:0;grid-template-columns:minmax(0,1fr)}.index-links a,.index-links span{min-width:0;max-width:100%;overflow-wrap:anywhere}footer{width:100%;min-width:0;flex-direction:column}}
@media(prefers-color-scheme:dark){:root{--paper:#101615;--surface:#18211f;--ink:#f7f0df;--body:#d5dcd7;--muted:#aab4ae;--line:#46534e;--green:#6acb45;--green-dark:#88df67}body{background:radial-gradient(circle at 80% 0,#1d3020 0,transparent 32rem),var(--paper)}nav a:hover,nav a:focus-visible,nav a[aria-current=page]{background:#233829;color:#a0ed83}.brand path[fill="#F7F0DE"],.brand g[fill="#F7F0DE"]{fill:#f7f0de}}
@media(prefers-reduced-motion:reduce){.index-links a{transition:none}}
`;
