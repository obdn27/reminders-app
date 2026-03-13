import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

export default function ToneSelector({ options, value, onChange }) {
  const [width, setWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const activeIndex = Math.max(0, options.indexOf(value));
  const inset = theme.spacing.xs;
  const segmentWidth = width > 0 ? (width - inset * 2) / options.length : 0;

  useEffect(() => {
    if (!segmentWidth) return;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: activeIndex * segmentWidth,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
        mass: 0.9,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, segmentWidth]);

  return (
    <View style={styles.wrap} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {segmentWidth ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            {
              width: segmentWidth,
              transform: [{ translateX }],
              opacity,
            },
          ]}
        />
      ) : null}
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={({ pressed }) => [styles.option, pressed ? styles.pressed : null]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    flexDirection: 'row',
    padding: theme.spacing.xs,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
  },
  activePill: {
    position: 'absolute',
    top: theme.spacing.xs,
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
  },
  option: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    ...theme.typography.bodySm,
    textTransform: 'capitalize',
    fontWeight: '700',
  },
  labelActive: {
    color: theme.colors.textPrimary,
  },
  labelInactive: {
    color: theme.colors.textSecondary,
  },
  pressed: {
    opacity: 0.92,
  },
});
