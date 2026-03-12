import { StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';

export default function OnboardingDisciplinePage({ navigation }) {
  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Set your discipline baseline</Text>
        <Text style={styles.copy}>
          This app is for maintaining baseline discipline. It is not about perfection.
        </Text>
        <Text style={styles.copy}>
          It helps you keep structure during stressful periods of your job hunt.
        </Text>
      </Card>

      <PrimaryButton
        title="Continue"
        onPress={() => navigation.navigate('OnboardingMinimums')}
      />
      <PrimaryButton
        variant="secondary"
        title="How this app works"
        onPress={() => navigation.navigate('HowItWorks')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  copy: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
});
