import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

import { spacing } from '@/ui/theme';
import { useDuelWordsAds } from './ads-context';

export function HomeBannerAd() {
  const ads = useDuelWordsAds();
  const { activateHomePlacement } = ads;
  const [failed, setFailed] = useState(false);

  useEffect(() => activateHomePlacement(), [activateHomePlacement]);

  if (!ads.canShowAds || failed) return null;

  const unitId = ads.mode === 'test' ? TestIds.ADAPTIVE_BANNER : ads.homeBannerAdUnitId;
  if (!unitId) return null;

  return (
    <View accessibilityLabel="Advertisement" accessibilityRole="summary" style={styles.container}>
      <BannerAd
        onAdFailedToLoad={() => setFailed(true)}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        unitId={unitId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
    paddingVertical: spacing.xs,
  },
});
