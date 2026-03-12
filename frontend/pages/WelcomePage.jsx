import { StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { theme } from '../theme/theme';

export default function WelcomePage({ navigation }) {
  return (
    <ScreenContainer>
      <Card style={styles.hero}>
        <Text style={styles.title}>Discipline Sprint</Text>
        <Text style={styles.subtitle}>
          A calm structure to protect your daily baseline during job search stress.
        </Text>
      </Card>

      <PrimaryButton title="Start your sprint" onPress={() => navigation.navigate('SignUp')} />
      <PrimaryButton
        variant="secondary"
        title="Sign in / Continue"
        onPress={() => navigation.navigate('SignIn')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 40,
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
});
