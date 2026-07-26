import { NativeModules } from 'react-native';

type SimulatorUITestRuntimeModule = {
  accountMode?: unknown;
  enabled?: unknown;
};

export type SimulatorUITestAccountMode = 'free' | 'pro';

export function getSimulatorUITestAccountMode(): SimulatorUITestAccountMode | null {
  const runtime = NativeModules.DuelWordsSimulatorUITestRuntime as SimulatorUITestRuntimeModule | undefined;
  if (runtime?.enabled !== true) return null;
  return runtime.accountMode === 'free' || runtime.accountMode === 'pro' ? runtime.accountMode : null;
}
