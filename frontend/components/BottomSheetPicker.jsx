import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraftValue(value);
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
          <Pressable onPress={() => {}} style={styles.content}>
            <View style={styles.header}>
              <Pressable style={styles.headerAction} onPress={onClose}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                style={[styles.headerAction, styles.headerActionPrimary]}
                onPress={() => {
                  onChange(draftValue);
                  onClose();
                }}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color={theme.colors.textPrimary}
                />
              </Pressable>
            </View>

            <View style={styles.wheelFrame}>
              <View pointerEvents="none" style={styles.selectionBand} />
              <Picker
                selectedValue={draftValue}
                onValueChange={setDraftValue}
                style={styles.picker}
                itemStyle={styles.itemStyle}
              >
                {items.map((item) => (
                  <Picker.Item
                    key={String(item)}
                    label={getLabel ? getLabel(item) : String(item)}
                    value={item}
                  />
                ))}
              </Picker>
              <LinearGradient
                pointerEvents="none"
                colors={[theme.colors.surface, 'rgba(22, 27, 34, 0)']}
                style={styles.topFade}
              />
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(22, 27, 34, 0)', theme.colors.surface]}
                style={styles.bottomFade}
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  content: {
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  headerActionPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  wheelFrame: {
    position: 'relative',
    height: 208,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -25,
    height: 50,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.pickerSelection,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  picker: {
    width: '100%',
    height: 208,
  },
  itemStyle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  topFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 52,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 52,
  },
});
