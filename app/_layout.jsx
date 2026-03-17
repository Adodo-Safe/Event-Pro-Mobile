import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    regular: require('../assets/fonts/Poppins-Regular.ttf'),
    semibold: require('../assets/fonts/Poppins-SemiBold.ttf'),
    bold: require('../assets/fonts/Poppins-Bold.ttf'),
    light: require('../assets/fonts/Poppins-Light.ttf'),
    medium: require('../assets/fonts/Poppins-Medium.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return <Stack initialRouteName="index" screenOptions={{ headerShown: false }} />;
}
