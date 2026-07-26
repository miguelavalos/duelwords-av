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

export type AccountDeletionItem = {
  type: 'linkedApp' | 'activeAiCredits' | 'activeProAccess' | 'activeBillingSubscription' | 'identityProvider' | 'deletionInProgress' | 'eligibilityUnavailable';
  appId: string | null;
  label: string;
  detail: string | null;
  managementUrl: string | null;
};

export type AccountDeletionJob = {
  id: string;
  status: 'queued' | 'blocked' | 'processing' | 'awaitingIdentityDeletion' | 'completed' | 'failed';
  requestedAt: string;
  completedAt: string | null;
  notes: string | null;
};

export type AccountDeletionEligibility = {
  status: 'eligible' | 'blocked' | 'inProgress' | 'completed';
  blockers: AccountDeletionItem[];
  warnings: AccountDeletionItem[];
  currentJob: AccountDeletionJob | null;
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

export async function fetchAccountDeletionEligibility(input: {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}): Promise<AccountDeletionEligibility> {
  const payload = await authorizedAccountRequest(input, '/v1/me');
  return parseDeletionEligibility(requireRecord(payload).deleteAccountEligibility);
}

export async function requestAccountDeletion(input: {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}): Promise<AccountDeletionEligibility> {
  const payload = await authorizedAccountRequest(input, '/v1/me/delete-account-request', 'POST');
  return parseDeletionEligibility(requireRecord(payload).deleteAccountEligibility);
}

export async function finalizeAccountDeletion(input: {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}): Promise<AccountDeletionEligibility> {
  const payload = await authorizedAccountRequest(input, '/v1/me/delete-account-finalize', 'POST');
  return parseDeletionEligibility(requireRecord(payload).deleteAccountEligibility);
}

async function authorizedAccountRequest(
  input: { baseUrl: string; getToken: () => Promise<string | null> },
  path: string,
  method = 'GET',
): Promise<unknown> {
  const token = await input.getToken();
  if (!token) throw new Error('account_token_unavailable');
  const response = await fetch(`${input.baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'x-appsav-app-id': DUELWORDS_ACCOUNT_AV_APP_ID,
    },
  });
  if (!response.ok) throw new Error(`account_api_unavailable:${response.status}`);
  return response.json();
}

function parseUser(value: unknown): AccountAvInternalUser {
  const record = requireRecord(requireRecord(value).user);
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

export function parseDeletionEligibility(value: unknown): AccountDeletionEligibility {
  const record = requireRecord(value);
  if (!['eligible', 'blocked', 'inProgress', 'completed'].includes(String(record.status))) {
    throw new Error('invalid_account_deletion_status');
  }
  return {
    status: record.status as AccountDeletionEligibility['status'],
    blockers: requireArray(record.blockers).map(parseDeletionItem),
    warnings: requireArray(record.warnings).map(parseDeletionItem),
    currentJob: record.currentJob === null ? null : parseDeletionJob(record.currentJob),
  };
}

function parseDeletionItem(value: unknown): AccountDeletionItem {
  const record = requireRecord(value);
  const type = String(record.type);
  const allowedTypes = ['linkedApp', 'activeAiCredits', 'activeProAccess', 'activeBillingSubscription', 'identityProvider', 'deletionInProgress', 'eligibilityUnavailable'];
  if (!allowedTypes.includes(type) || typeof record.label !== 'string') throw new Error('invalid_account_deletion_item');
  return {
    type: type as AccountDeletionItem['type'],
    appId: optionalString(record.appId),
    label: record.label,
    detail: optionalString(record.detail),
    managementUrl: optionalHttpsUrl(record.managementUrl),
  };
}

function parseDeletionJob(value: unknown): AccountDeletionJob {
  const record = requireRecord(value);
  const status = String(record.status);
  if (typeof record.id !== 'string' || typeof record.requestedAt !== 'string' || !['queued', 'blocked', 'processing', 'awaitingIdentityDeletion', 'completed', 'failed'].includes(status)) {
    throw new Error('invalid_account_deletion_job');
  }
  return {
    id: record.id,
    status: status as AccountDeletionJob['status'],
    requestedAt: record.requestedAt,
    completedAt: optionalString(record.completedAt),
    notes: optionalString(record.notes),
  };
}

function optionalHttpsUrl(value: unknown): string | null {
  const text = optionalString(value);
  if (!text) return null;
  try {
    return new URL(text).protocol === 'https:' ? text : null;
  } catch {
    return null;
  }
}

function requireArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('invalid_account_array');
  return value;
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
