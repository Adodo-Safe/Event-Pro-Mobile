import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");

  const handleSendCode = () => {
    // Call backend to send verification code
    setMessage("Verification code sent!");
  };

  const handleSubmit = () => {
    if (!newPassword || !confirmPassword || !verificationCode) {
      setMessage("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setMessage("Password reset successful");
    // Call backend to reset password
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Reset Password</Text>

          <Text style={styles.label}>New Password</Text>
          <TextInput
            placeholder="Enter Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            placeholder="Enter Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />

          <Text style={styles.label}>Verification Code</Text>
          <View style={styles.codeRow}>
            <TextInput
              placeholder="Enter Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              style={[styles.input, { flex: 1, marginRight: 10 }]}
            />
            <TouchableOpacity style={styles.sendCodeBtn} onPress={handleSendCode}>
              <Text style={styles.sendCodeText}>Send Code</Text>
            </TouchableOpacity>
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 30 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" },
  input: {
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  codeRow: { flexDirection: "row", alignItems: "center" },
  sendCodeBtn: {
    backgroundColor: "#6f00ff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  sendCodeText: { color: "#fff", fontWeight: "bold" },
  message: { color: "red", fontSize: 12, marginVertical: 10, textAlign: "center" },
  submitBtn: {
    backgroundColor: "#6f00ff",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  submitText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
});