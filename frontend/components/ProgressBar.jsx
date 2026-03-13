import { StyleSheet, View } from 'react-native';
import { theme } from '../theme/theme';

export default function ProgressBar({ value = 0, max = 1, color = null }) {
  const safeMax = Math.max(1, max);
  const ratio = Math.max(0, Math.min(1, value / safeMax));
  const fillColor = color || (ratio <= 0 ? theme.colors.borderSoft : theme.colors.primaryStrong);

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.progressTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.primaryStrong,
  },
});
