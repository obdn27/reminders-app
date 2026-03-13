import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AnchorsProvider } from './state/AnchorsContext';
import { AnchorProgressProvider } from './state/AnchorProgressContext';
import { DebugTimeProvider } from './state/DebugTimeContext';
import { DailyGoalsProvider } from './state/DailyGoalsContext';
import { OnboardingProvider } from './state/OnboardingContext';
import { ProfileProvider } from './state/ProfileContext';
import { ReminderProvider } from './state/ReminderContext';
import { SessionProvider } from './state/SessionContext';
import { TodayProgressProvider } from './state/TodayProgressContext';
import { WeeklyReviewProvider } from './state/WeeklyReviewContext';
import { theme } from './theme/theme';

import WelcomePage from './pages/WelcomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

import OnboardingAnchorSelectionPage from './pages/OnboardingAnchorSelectionPage';
import OnboardingAnchorTargetPage from './pages/OnboardingAnchorTargetPage';
import OnboardingFirstActionPage from './pages/OnboardingFirstActionPage';
import OnboardingGoalContextPage from './pages/OnboardingGoalContextPage';
import OnboardingIntroPage from './pages/OnboardingIntroPage';
import OnboardingReminderTimesPage from './pages/OnboardingReminderTimesPage';
import OnboardingSummaryPage from './pages/OnboardingSummaryPage';
import OnboardingTonePage from './pages/OnboardingTonePage';
import HomePage from './pages/HomePage';
import StartFocusSessionPage from './pages/StartFocusSessionPage';
import StartMovementSessionPage from './pages/StartMovementSessionPage';
import ActiveSessionPage from './pages/ActiveSessionPage';
import SessionCompletePage from './pages/SessionCompletePage';
import MovementCheckInPage from './pages/MovementCheckInPage';
import DailyReviewPage from './pages/DailyReviewPage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import AdjustmentSuggestionPage from './pages/AdjustmentSuggestionPage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import HistoryPage from './pages/HistoryPage';
import HowItWorksPage from './pages/HowItWorksPage';
import DebugToolsPage from './pages/DebugToolsPage';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.background,
    text: theme.colors.textPrimary,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
};

function BootSplash() {
  return (
    <View style={styles.bootSplash}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={styles.bootText}>Starting session...</Text>
    </View>
  );
}

const sharedScreenOptions = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: theme.colors.background },
  headerTitleStyle: { fontWeight: '700' },
  headerTitleAlign: 'center',
  headerTintColor: theme.colors.textPrimary,
  headerBackTitleVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: theme.colors.background },
};

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={sharedScreenOptions}>
      <Stack.Screen name="Welcome" component={WelcomePage} options={{ title: 'Welcome' }} />
      <Stack.Screen name="SignIn" component={SignInPage} options={{ title: 'Sign In' }} />
      <Stack.Screen name="SignUp" component={SignUpPage} options={{ title: 'Sign Up' }} />
    </Stack.Navigator>
  );
}

function AppProviders({ children }) {
  return (
    <ProfileProvider>
      <DailyGoalsProvider>
        <AnchorsProvider>
          <OnboardingProvider>
            <AnchorProgressProvider>
              <TodayProgressProvider>
                <ReminderProvider>
                  <WeeklyReviewProvider>
                    <SessionProvider>{children}</SessionProvider>
                  </WeeklyReviewProvider>
                </ReminderProvider>
              </TodayProgressProvider>
            </AnchorProgressProvider>
          </OnboardingProvider>
        </AnchorsProvider>
      </DailyGoalsProvider>
    </ProfileProvider>
  );
}

function AppStack() {
  const { user } = useAuth();
  const initialRouteName = user?.hasCompletedOnboarding ? 'Home' : 'OnboardingIntro';

  return (
    <AppProviders>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={sharedScreenOptions}>
        <Stack.Screen name="OnboardingIntro" component={OnboardingIntroPage} options={{ title: 'Setup' }} />
        <Stack.Screen name="OnboardingGoalContext" component={OnboardingGoalContextPage} options={{ title: 'Setup' }} />
        <Stack.Screen name="OnboardingAnchorSelection" component={OnboardingAnchorSelectionPage} options={{ title: 'Setup' }} />
        <Stack.Screen name="OnboardingAnchorTargets" component={OnboardingAnchorTargetPage} options={{ title: 'Setup' }} />
        <Stack.Screen name="OnboardingReminderTimes" component={OnboardingReminderTimesPage} options={{ title: 'Setup' }} />
        <Stack.Screen name="OnboardingTone" component={OnboardingTonePage} options={{ title: 'Setup' }} />
        <Stack.Screen name="OnboardingSummary" component={OnboardingSummaryPage} options={{ title: 'Setup' }} />
        <Stack.Screen name="OnboardingFirstAction" component={OnboardingFirstActionPage} options={{ title: 'Ready' }} />
        <Stack.Screen
          name="Home"
          component={HomePage}
          options={{ headerShown: false, headerBackVisible: false }}
        />
        <Stack.Screen
          name="StartFocusSession"
          component={StartFocusSessionPage}
          options={{ title: 'Start Focus Session' }}
        />
        <Stack.Screen
          name="StartMovementSession"
          component={StartMovementSessionPage}
          options={{ title: 'Start Movement Session' }}
        />
        <Stack.Screen
          name="ActiveSession"
          component={ActiveSessionPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="SessionComplete" component={SessionCompletePage} options={{ title: 'Session Complete' }} />
        <Stack.Screen
          name="MovementCheckIn"
          component={MovementCheckInPage}
          options={{ title: 'Movement Check-In' }}
        />
        <Stack.Screen name="DailyReview" component={DailyReviewPage} options={{ title: 'Daily Review' }} />
        <Stack.Screen name="WeeklyReview" component={WeeklyReviewPage} options={{ title: 'Weekly Review' }} />
        <Stack.Screen name="History" component={HistoryPage} options={{ title: 'History' }} />
        <Stack.Screen name="HowItWorks" component={HowItWorksPage} options={{ title: 'How It Works' }} />
        <Stack.Screen name="DebugTools" component={DebugToolsPage} options={{ title: 'Debug Tools' }} />
        <Stack.Screen
          name="AdjustmentSuggestion"
          component={AdjustmentSuggestionPage}
          options={{ title: 'Adjustment Suggestion' }}
        />
        <Stack.Screen name="Settings" component={SettingsPage} options={{ title: 'Settings' }} />
        <Stack.Screen name="Account" component={AccountPage} options={{ title: 'Account' }} />
      </Stack.Navigator>
    </AppProviders>
  );
}

function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <BootSplash />;
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <DebugTimeProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </DebugTimeProvider>
  );
}

const styles = StyleSheet.create({
  bootSplash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: 10,
  },
  bootText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
