import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export default function CustomSplash({ onFinish }) {
  useEffect(() => {
    async function prepare() {
      // Keep splash screen visible while we prepare
      await SplashScreen.preventAutoHideAsync();
      
      // Simulate loading time (remove in production)
      setTimeout(async () => {
        await SplashScreen.hideAsync();
        if (onFinish) onFinish();
      }, 2000);
    }
    
    prepare();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/eventProLogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#800080', // Purple background
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200, // Set your desired width
    height: undefined,
    aspectRatio: 1, // Adjust based on your logo's aspect ratio
  },
});