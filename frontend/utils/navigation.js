export function goBackOrNavigateHome(navigation) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  navigation.navigate('Home');
}
