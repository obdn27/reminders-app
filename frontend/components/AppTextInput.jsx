import { TextInput } from 'react-native';
import { theme } from '../theme/theme';

export default function AppTextInput(props) {
  const { style, placeholderTextColor, selectionColor, ...rest } = props;

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor || theme.colors.textMuted}
      selectionColor={selectionColor || theme.colors.primaryDark}
      style={[theme.forms.input, style]}
      {...rest}
    />
  );
}
