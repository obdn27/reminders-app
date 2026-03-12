import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import PrimaryButton from './PrimaryButton';
import { theme } from '../theme/theme';

export default function BottomSheetPicker({
  visible,
  title,
  items,
  value,
  onChange,
  onClose,
  getLabel,
}) {
  const translateY = useRef(new Animated.Value(420)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(420);
    }
  }, [visible]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.hint}>Scroll to choose</Text>
          </View>

          <Picker selectedValue={value} onValueChange={onChange} style={styles.picker} itemStyle={styles.itemStyle}>
            {items.map((item) => (
              <Picker.Item key={String(item)} label={getLabel ? getLabel(item) : String(item)} value={item} />
            ))}
          </Picker>

          <PrimaryButton title="Done" onPress={onClose} />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    gap: 2,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  picker: {
    width: '100%',
  },
  itemStyle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
});
