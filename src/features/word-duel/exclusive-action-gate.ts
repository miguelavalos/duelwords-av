export type ExclusiveActionGate = {
  finish(actionName: string): void;
  tryStart(actionName: string): boolean;
};

export function createExclusiveActionGate(): ExclusiveActionGate {
  let activeAction: string | null = null;

  return {
    finish(actionName) {
      if (activeAction === actionName) {
        activeAction = null;
      }
    },
    tryStart(actionName) {
      if (activeAction !== null) {
        return false;
      }
      activeAction = actionName;
      return true;
    },
  };
}
