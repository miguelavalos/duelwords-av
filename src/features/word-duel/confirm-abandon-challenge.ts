import { Alert } from 'react-native';

export type ConfirmAbandonChallengeInput = {
  cancelLabel: string;
  confirmLabel: string;
  detail: string;
  onConfirm: () => void;
  title: string;
};

export function showAbandonChallengeConfirmation({
  cancelLabel,
  confirmLabel,
  detail,
  onConfirm,
  title,
}: ConfirmAbandonChallengeInput) {
  Alert.alert(title, detail, [
    {
      style: 'cancel',
      text: cancelLabel,
    },
    {
      onPress: onConfirm,
      style: 'destructive',
      text: confirmLabel,
    },
  ]);
}
