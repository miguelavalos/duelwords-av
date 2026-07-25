export type AccountSessionActivator =
  | ((params: { session: string }) => Promise<unknown>)
  | undefined;

export async function activateCreatedSession(
  createdSessionId: string | null,
  setActive: AccountSessionActivator,
): Promise<string> {
  if (!createdSessionId || !setActive) {
    throw new Error('Account AV did not return an active session.');
  }
  await setActive({ session: createdSessionId });
  return createdSessionId;
}
