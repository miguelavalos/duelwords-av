import { requireNativeComponent, UIManager, type NativeSyntheticEvent, type ViewProps } from 'react-native';

import type { SharedAppleAction, SharedAppleSurfaceProps } from './shared-apple-surface.types';

const NATIVE_VIEW_NAME = 'DuelWordsSharedAppleView';

type NativeSharedAppleSurfaceProps = ViewProps & Omit<SharedAppleSurfaceProps, 'onAction'> & {
  onAction?: (event: NativeSyntheticEvent<SharedAppleAction>) => void;
};

export const isSharedAppleSurfaceAvailable = UIManager.getViewManagerConfig(NATIVE_VIEW_NAME) !== null;

const NativeSharedAppleSurface = isSharedAppleSurfaceAvailable
  ? requireNativeComponent<NativeSharedAppleSurfaceProps>(NATIVE_VIEW_NAME)
  : null;

export function SharedAppleSurface({
  accountAvailable = false,
  activeProvider = '',
  appearance = 'system',
  authError = '',
  authInitiallyPresented = false,
  displayName = '',
  deletionBlockersJSON = '[]',
  deletionBusy = false,
  deletionCanFinalize = false,
  deletionError = '',
  deletionStatus = '',
  deletionWarningsJSON = '[]',
  email = '',
  hapticsEnabled = true,
  interfaceLocale = 'en',
  onAction,
  planTier = 'free',
  selectedTab = 'play',
  signedIn = false,
  ...props
}: SharedAppleSurfaceProps) {
  if (!NativeSharedAppleSurface) return null;

  return (
    <NativeSharedAppleSurface
      {...props}
      accountAvailable={accountAvailable}
      activeProvider={activeProvider}
      appearance={appearance}
      authError={authError}
      authInitiallyPresented={authInitiallyPresented}
      displayName={displayName}
      deletionBlockersJSON={deletionBlockersJSON}
      deletionBusy={deletionBusy}
      deletionCanFinalize={deletionCanFinalize}
      deletionError={deletionError}
      deletionStatus={deletionStatus}
      deletionWarningsJSON={deletionWarningsJSON}
      email={email}
      hapticsEnabled={hapticsEnabled}
      interfaceLocale={interfaceLocale}
      onAction={onAction ? (event) => onAction(event.nativeEvent) : undefined}
      planTier={planTier}
      selectedTab={selectedTab}
      signedIn={signedIn}
    />
  );
}

export type { SharedAppleAction, SharedAppleSurfaceName, SharedAppleSurfaceProps } from './shared-apple-surface.types';
