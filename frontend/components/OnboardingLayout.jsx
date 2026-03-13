import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

function ProgressDots({ step, totalSteps }) {
  return (
    <View style={styles.progressWrap}>
      <Text style={styles.progressText}>
        Step {step} of {totalSteps}
      </Text>
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={String(index)}
            style={[
              styles.dot,
              index < step ? styles.dotActive : null,
              index + 1 === step ? styles.dotCurrent : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function OnboardingLayout({
  step,
  totalSteps,
  eyebrow = null,
  title,
  subtitle,
  children,
  footer = null,
}) {
  return (
    <View style={styles.wrapper}>
      <ProgressDots step={step} totalSteps={totalSteps} />
      <View style={styles.header}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.content}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xl,
  },
  progressWrap: {
    gap: theme.spacing.sm,
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primarySoft,
  },
  dotCurrent: {
    backgroundColor: theme.colors.primary,
  },
  header: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  content: {
    gap: theme.spacing.md,
  },
  footer: {
    gap: theme.spacing.md,
  },
});

