import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
                setTimeout(async () => {
                    await SplashScreen.hideAsync();
                    setAppIsReady(true);
                }, 2000);
            } catch (e) {
                console.warn(e);
            }
        }
        prepare();
    }, []);

    if (!appIsReady) {
        return (
            <View style={styles.container}>
                <Image
                    source={require("../assets/images/eventProLogo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
        );
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#6F00FF",
        alignItems: "center",
        justifyContent: "center"
    },
    logo: {
        width: 200,
        height: 200
    }
});
