import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    Image
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = "#6F00FF";
const DARK = "#0F0F14";
const GRAY = "#6B7280";
const ERROR = "#EF4444";

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [generalError, setGeneralError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const getBorderColor = (focused, error) => {
        if (error) return ERROR;
        if (focused) return PURPLE;
        return "#E5E7EB";
    };

    const handleLogin = async () => {
        setEmailError("");
        setPasswordError("");
        setGeneralError("");

        if (!email) {
            setEmailError("Email is required");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError("Enter a valid email address");
            return;
        }
        if (!password) {
            setPasswordError("Password is required");
            return;
        }
        if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post(
                "https://eventpro-fxfv.onrender.com/api/auth/login",
                { email, password },
                { headers: { "Content-Type": "application/json" } }
            );

            if (data.token) {
                await AsyncStorage.multiSet([
                    ["token", data.token],
                    ["firstName", data.user?.firstName || ""],
                    ["role", data.user?.role || "user"]
                ]);

                const role = data.user?.role;
                if (role === "organizer") {
                    router.replace("/(tabs)/dashboard");
                } else {
                    router.replace("/(tabs)/home");
                }
            } else {
                setGeneralError(
                    data.message || "Login failed. Please try again."
                );
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                "Something went wrong. Please try again.";
            setGeneralError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <Image
                    source={require("../../assets/images/signInLogo.jpg")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Heading */}
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>
                    Sign in to manage your events and attendees.
                </Text>

                {/* General Error */}
                {generalError ? (
                    <View style={styles.generalError}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={16}
                            color={ERROR}
                        />
                        <Text style={styles.generalErrorText}>
                            {generalError}
                        </Text>
                    </View>
                ) : null}

                {/* Email */}
                <Text style={styles.label}>Email Address</Text>
                <View
                    style={[
                        styles.inputWrapper,
                        {
                            borderColor: getBorderColor(
                                emailFocused,
                                emailError
                            )
                        }
                    ]}
                >
                    <Ionicons
                        name="mail-outline"
                        size={18}
                        color={emailFocused ? PURPLE : GRAY}
                        style={styles.inputIcon}
                    />
                    <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={text => {
                            setEmail(text);
                            setEmailError("");
                            setGeneralError("");
                        }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>
                {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                ) : null}

                {/* Password */}
                <Text style={styles.label}>Password</Text>
                <View
                    style={[
                        styles.inputWrapper,
                        {
                            borderColor: getBorderColor(
                                passwordFocused,
                                passwordError
                            )
                        }
                    ]}
                >
                    <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={passwordFocused ? PURPLE : GRAY}
                        style={styles.inputIcon}
                    />
                    <TextInput
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={text => {
                            setPassword(text);
                            setPasswordError("");
                            setGeneralError("");
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        style={styles.input}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(v => !v)}
                        style={styles.eyeBtn}
                    >
                        <Ionicons
                            name={
                                showPassword ? "eye-outline" : "eye-off-outline"
                            }
                            size={18}
                            color={GRAY}
                        />
                    </TouchableOpacity>
                </View>
                {passwordError ? (
                    <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}

                {/* Forgot Password */}
                <TouchableOpacity
                    style={styles.forgotBtn}
                    onPress={() => router.push("/auth/reset-password")}
                >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Sign Up Link */}
                <View style={styles.signupRow}>
                    <Text style={styles.signupText}>
                        Don't have an account?{" "}
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push("/auth/signup")}
                    >
                        <Text style={styles.signupLink}>Create account</Text>
                    </TouchableOpacity>
                </View>

                {/* Terms */}
                <Text style={styles.terms}>
                    By signing in, you agree to EventPro's{" "}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40
    },

    logo: {
        width: 180,
        height: 180,
        alignSelf: "center",
        marginBottom: 28
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: DARK,
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: GRAY,
        marginBottom: 28,
        lineHeight: 20
    },

    generalError: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FEF2F2",
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#FECACA"
    },
    generalErrorText: {
        color: ERROR,
        fontSize: 13,
        flex: 1
    },

    label: {
        fontSize: 13,
        fontWeight: "600",
        color: DARK,
        marginBottom: 6,
        marginTop: 16
    },

    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderRadius: 12,
        backgroundColor: "#FAFAFA",
        paddingHorizontal: 12,
        height: 52
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        fontSize: 14,
        color: DARK,
        height: "100%"
    },
    eyeBtn: { padding: 4 },

    errorText: {
        color: ERROR,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4
    },

    forgotBtn: {
        alignSelf: "flex-end",
        marginTop: 10,
        marginBottom: 4
    },
    forgotText: {
        color: PURPLE,
        fontSize: 13,
        fontWeight: "600"
    },

    button: {
        backgroundColor: PURPLE,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20
    },
    buttonDisabled: { backgroundColor: "#C4B5FD" },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16
    },

    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
        gap: 12
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E7EB"
    },
    dividerText: {
        color: GRAY,
        fontSize: 13
    },

    signupRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24
    },
    signupText: { fontSize: 14, color: GRAY },
    signupLink: {
        fontSize: 14,
        color: PURPLE,
        fontWeight: "700"
    },

    terms: {
        fontSize: 12,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 18
    },
    termsLink: {
        color: PURPLE,
        fontWeight: "600"
    }
});
