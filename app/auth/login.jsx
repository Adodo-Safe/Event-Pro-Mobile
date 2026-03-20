import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/input";
import Button from "../../components/button";

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
        const userEmail = data.user?.email || email;

        // Save token and email
        await AsyncStorage.multiSet([
          ["token", data.token],
          ["firstName", data.user?.firstName || ""],
          ["email", userEmail],
        ]);

        // Read role tied to this specific email
        const existingRole = await AsyncStorage.getItem(`role_${userEmail}`);

        if (!existingRole) {
          // No role for this email — go to role selection
          router.push({
            pathname: "/auth/role-selection",
            params: {
              token: data.token,
              firstName: data.user?.firstName || "",
            },
          });
        } else if (existingRole === "organizer") {
          await AsyncStorage.setItem("role", "organizer");
          router.replace("/(tabs)/dashboard");
        } else {
          await AsyncStorage.setItem("role", "user");
          router.replace("/(tabs)/home");
        }
      } else {
        setGeneralError(data.message || "Login failed. Please try again.");
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
            <Ionicons name="alert-circle-outline" size={16} color={ERROR} />
            <Text style={styles.generalErrorText}>{generalError}</Text>
          </View>
        ) : null}

        {/* Email */}
        <Input
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError("");
            setGeneralError("");
          }}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          validationState={
            emailError ? "error" : emailFocused ? "focused" : "empty"
          }
          errorMessage={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={
            <Ionicons
              name="mail-outline"
              size={18}
              color={emailFocused ? PURPLE : GRAY}
            />
          }
        />

        {/* Password */}
        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError("");
            setGeneralError("");
          }}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          validationState={
            passwordError ? "error" : passwordFocused ? "focused" : "empty"
          }
          errorMessage={passwordError}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          leftIcon={
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={passwordFocused ? PURPLE : GRAY}
            />
          }
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={18}
                color={GRAY}
              />
            </TouchableOpacity>
          }
        />

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => router.push("/auth/reset-password")}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <Button
          title={loading ? "Signing In..." : "Sign In"}
          onPress={handleLogin}
          disabled={loading}
          loading={loading}
          size="large"
          style={styles.button}
          textStyle={{ fontSize: 16 }}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/signup")}>
            <Text style={styles.signupLink}>Create account</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By signing in, you agree to EventPro's{" "}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {" "}and{" "}
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
    paddingBottom: 40,
  },

  logo: {
    width: 180,
    height: 180,
    alignSelf: "center",
    marginBottom: 28,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: GRAY,
    marginBottom: 28,
    lineHeight: 20,
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
    borderColor: "#FECACA",
  },
  generalErrorText: {
    color: ERROR,
    fontSize: 13,
    flex: 1,
  },

  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 4,
  },
  forgotText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: "600",
  },

  button: {
    marginTop: 20,
    backgroundColor: PURPLE,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    color: GRAY,
    fontSize: 13,
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  signupText: { fontSize: 14, color: GRAY },
  signupLink: {
    fontSize: 14,
    color: PURPLE,
    fontWeight: "700",
  },

  terms: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: PURPLE,
    fontWeight: "600",
  },
});