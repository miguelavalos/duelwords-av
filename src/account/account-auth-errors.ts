export class AccountAuthCancelledError extends Error {
  constructor() {
    super('Account authentication was cancelled.');
    this.name = 'AccountAuthCancelledError';
  }
}

export function isAccountAuthCancellation(error: unknown) {
  if (error instanceof AccountAuthCancelledError) return true;
  if (!isRecord(error)) return false;

  const code = typeof error.code === 'string' ? error.code.toLowerCase() : '';
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return code.includes('cancel') || message.includes('cancelled') || message.includes('canceled');
}

export function isClerkSessionExistsError(error: unknown) {
  if (!isRecord(error)) return false;
  if (error.code === 'session_exists') return true;
  if (!Array.isArray(error.errors)) return false;
  return error.errors.some((item) => (
    isRecord(item) && item.code === 'session_exists'
  ));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
