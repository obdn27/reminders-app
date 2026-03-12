import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

export default function ScreenContainer({ children, scroll = true }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'left', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
});
