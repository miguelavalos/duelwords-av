import { useSyncExternalStore } from 'react';

import {
  getDuelWordsActivityRevision,
  readDuelWordsActivity,
  subscribeToDuelWordsActivity,
} from '@/game/activity/device-activity-store';

export function useDeviceActivity() {
  useSyncExternalStore(
    subscribeToDuelWordsActivity,
    getDuelWordsActivityRevision,
    getDuelWordsActivityRevision,
  );

  return readDuelWordsActivity();
}
