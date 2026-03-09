import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native";
import { useRouter } from "expo-router";

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleLogin = async () => {
        setEmailError("");
        setPasswordError("");
        setSuccess(false);

        if (!email) {
            setEmailError("Email is required");
            return;
        }

        if (!password) {
            setPasswordError("Password is required");
            return;
        }

        try {
            // BACKEND LOGIN

            //Testing login
            if (email !== "safe@yahoo.com") {
                setEmailError("Invalid email");
            }

            if (password !== "123456") {
                setPasswordError("Incorrect password");
            }

            if (email === "safe@yahoo.com" && password === "123456") {
                setSuccess(true);
                router.push("/(tabs)/home");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getBorderColor = (focused, error) => {
        if (success) return "green";
        if (error) return "red";
        if (focused) return "purple";
        return "gray";
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.container}>
                {/* LOGO */}
                <Image
                    source={require("../../assets/images/signInLogo.jpg")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.title}>Sign In</Text>

                {/* Email */}
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={text => {
                        setEmail(text);
                        setEmailError("");
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={[
                        styles.input,
                        {
                            borderColor: getBorderColor(
                                emailFocused,
                                emailError
                            )
                        }
                    ]}
                />

                {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                ) : null}

                {/* Password */}
                <Text style={styles.label}>Enter Password</Text>
                <TextInput
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={text => {
                        setPassword(text);
                        setPasswordError("");
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={[
                        styles.input,
                        {
                            borderColor: getBorderColor(
                                passwordFocused,
                                passwordError
                            )
                        }
                    ]}
                />

                {passwordError ? (
                    <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}

                {/* Login button */}
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        flexGrow: 1,
        justifyContent: "center",
        padding: 20
    },

    logo: {
        width: 200,
        height: 200,
        alignSelf: "center",
        marginBottom: 20
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
        textAlign: "center"
    },

    input: {
        borderWidth: 2,
        borderRadius: 10,
        padding: 12,
        marginBottom: 5
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 5,
        marginTop: 10
    },

    errorText: {
        color: "red",
        fontSize: 12,
        marginBottom: 10
    },

    button: {
        backgroundColor: "#6F00FF",
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        borderColor: "#8c3a45",
borderWidth: 2,
    },

    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 16
    }
});
