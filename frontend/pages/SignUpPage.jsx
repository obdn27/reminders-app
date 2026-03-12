import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

export default function SignUpPage({ navigation }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await signup({ email: email.trim(), password, name: name.trim() || null });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Create account</Text>

        <TextInput
          placeholder="Name (optional)"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          secureTextEntry
          placeholder="Password (min 8 chars)"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>

      <PrimaryButton title={loading ? 'Creating account...' : 'Sign up'} onPress={onSubmit} disabled={loading} />
      {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Text style={styles.footerLink} onPress={() => navigation.navigate('SignIn')}>
          Sign in
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    fontSize: 16,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: theme.colors.textSecondary,
  },
  footerLink: {
    color: theme.colors.primaryStrong,
    fontWeight: '700',
  },
});
