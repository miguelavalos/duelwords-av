import type { StyleProp, ViewStyle } from 'react-native';

export type SharedAppleSurfaceName =
  | 'account'
  | 'delete-account'
  | 'footer'
  | 'header'
  | 'onboarding'
  | 'paywall'
  | 'settings'
  | 'sidebar'
  | 'splash';

export type SharedAppleAction = {
  action: string;
  value?: string;
};

export type SharedAppleSurfaceProps = {
  accountAvailable?: boolean;
  activeProvider?: '' | 'apple' | 'google';
  appearance?: 'dark' | 'light' | 'system';
  authError?: string;
  authInitiallyPresented?: boolean;
  displayName?: string;
  deletionBlockersJSON?: string;
  deletionBusy?: boolean;
  deletionCanFinalize?: boolean;
  deletionError?: string;
  deletionStatus?: string;
  deletionWarningsJSON?: string;
  email?: string;
  hapticsEnabled?: boolean;
  interfaceLocale?: string;
  onAction?: (event: SharedAppleAction) => void;
  planTier?: string;
  selectedTab?: string;
  signedIn?: boolean;
  subscriptionBusy?: boolean;
  subscriptionError?: string;
  subscriptionPrice?: string;
  subscriptionState?: string;
  style?: StyleProp<ViewStyle>;
  surface: SharedAppleSurfaceName;
};
