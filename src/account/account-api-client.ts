import { DUELWORDS_ACCOUNT_AV_APP_ID } from './account-av-config';

export type AccountAvInternalUser = {
  id: string;
  displayName: string | null;
  email: string | null;
};

export type DuelWordsAccess = {
  accessMode: 'guest' | 'signedInFree' | 'signedInPro';
  planTier: 'free' | 'pro';
};

export async function fetchAccountAvIdentity(input: {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}): Promise<{ access: DuelWordsAccess; user: AccountAvInternalUser }> {
  const token = await input.getToken();
  if (!token) throw new Error('account_token_unavailable');

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'x-appsav-app-id': DUELWORDS_ACCOUNT_AV_APP_ID,
  };
  const [meResponse, accessResponse] = await Promise.all([
    fetch(`${input.baseUrl}/v1/me`, { headers }),
    fetch(`${input.baseUrl}/v1/me/access`, { headers }),
  ]);
  if (!meResponse.ok || !accessResponse.ok) {
    throw new Error(`account_api_unavailable:${meResponse.status}:${accessResponse.status}`);
  }

  const user = parseUser(await meResponse.json());
  const access = parseAccess(await accessResponse.json());
  return { access, user };
}

function parseUser(value: unknown): AccountAvInternalUser {
  const record = requireRecord(value);
  if (typeof record.id !== 'string' || record.id.trim().length === 0) {
    throw new Error('invalid_account_user');
  }
  return {
    id: record.id,
    displayName: optionalString(record.displayName),
    email: optionalString(record.email),
  };
}

function parseAccess(value: unknown): DuelWordsAccess {
  const record = requireRecord(value);
  if (!Array.isArray(record.apps)) throw new Error('invalid_account_access');
  const app = record.apps.find((entry) => {
    const item = requireRecord(entry);
    return item.appId === DUELWORDS_ACCOUNT_AV_APP_ID;
  });
  const item = requireRecord(app);
  if (
    (item.accessMode !== 'guest' && item.accessMode !== 'signedInFree' && item.accessMode !== 'signedInPro')
    || (item.planTier !== 'free' && item.planTier !== 'pro')
  ) {
    throw new Error('invalid_duelwords_access');
  }
  return { accessMode: item.accessMode, planTier: item.planTier };
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('invalid_account_payload');
  }
  return value as Record<string, unknown>;
}
