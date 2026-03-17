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
import axios from "axios";

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
            const { data } = await axios.post(
                "https://eventpro-fxfv.onrender.com/api/auth/login",
                { email, password },
                { headers: { "Content-Type": "application/json" } }
            );
            console.log("login response: ", data);

            if (data.token) {
                setSuccess(true);
                router.push("../(tabs)/home");
            } else {
                setEmailError(
                    data.message?.include("email") ? data.message : ""
                );
                setPasswordError(
                    data.message?.include("password") ? data.message : ""
                );
            }
        } catch (err) {
            setEmailError(err.response?.data?.message || "");
            setPasswordError(err.response?.data?.message || "");
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
                <Text style={{ fontSize: 17 }}>
                    New user?{" "}
                    <TouchableOpacity>
                        <Text
                            style={{ fontWeight: "bold", fontSize: 17 }}
                            onPress={router.push("")}
                        >
                            Create an account
                        </Text>
                    </TouchableOpacity>
                </Text>

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
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <Text>
                    By signing in with an account, you agree to EventPro's {""}
                    <Text style={{ fontWeight: "bold" }}>
                        Terms of service {""}
                    </Text>
                    and
                    <Text style={{ fontWeight: "bold" }}>
                        {""} Privacy Policy
                    </Text>
                </Text>
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
        marginBottom: 30,
        textAlign: " center",
        borderColor: "#8c3a45",
        borderWidth: 2
    },

    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 16
    }
});
