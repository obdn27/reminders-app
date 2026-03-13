import { StyleSheet, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SettingsSection from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../state/ProfileContext';
import { theme } from '../theme/theme';

export default function AccountPage() {
  const { profile } = useProfile();
  const { logout } = useAuth();

  return (
    <ScreenContainer>
      <SettingsSection title="Account">
        <SettingsRow
          label="Email"
          value={profile?.email || 'Unknown user'}
        />
        <SettingsRow
          label="Change password"
          helper="Account security actions can live here next."
          showChevron
          isLast
        />
      </SettingsSection>

      <View style={styles.actions}>
        <PrimaryButton variant="danger" title="Log out" onPress={logout} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: {
    paddingTop: theme.spacing.sm,
  },
});
