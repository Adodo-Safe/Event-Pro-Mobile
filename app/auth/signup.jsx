import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/input';
import Button from '../../components/button';
import { saveToken, signUp } from '../../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getSignupErrorMessage = (error) => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message) && message.length > 0) {
    return String(message[0]);
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return 'Unable to create account right now. Please try again.';
};

const SignUp = () => {
  const router = useRouter();
  const scrollViewRef = useRef(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [firstNameState, setFirstNameState] = useState('empty');
  const [lastNameState, setLastNameState] = useState('empty');
  const [emailState, setEmailState] = useState('empty');
  const [passwordState, setPasswordState] = useState('empty');
  const [confirmPasswordState, setConfirmPasswordState] = useState('empty');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToFocusedInput = (target) => {
    if (!target) return;
    setTimeout(() => {
      const responder = scrollViewRef.current?.getScrollResponder?.();
      responder?.scrollResponderScrollNativeHandleToKeyboard?.(target, 80, true);
    }, 120);
  };

  const validateFirstName = (value) => {
    if (!value.trim()) {
      setFirstNameState('error');
      setFirstNameError('First name is required');
      return false;
    }
    setFirstNameState('success');
    setFirstNameError('');
    return true;
  };

  const validateLastName = (value) => {
    if (!value.trim()) {
      setLastNameState('error');
      setLastNameError('Last name is required');
      return false;
    }
    setLastNameState('success');
    setLastNameError('');
    return true;
  };

  const validateEmail = (value) => {
    if (!value.trim()) {
      setEmailState('error');
      setEmailError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(value.trim())) {
      setEmailState('error');
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailState('success');
    setEmailError('');
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordState('error');
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordState('error');
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordState('success');
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value, activePassword = password) => {
    if (!value) {
      setConfirmPasswordState('error');
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (value !== activePassword) {
      setConfirmPasswordState('error');
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordState('success');
    setConfirmPasswordError('');
    return true;
  };

  const handleFirstNameChange = (value) => {
    setFirstName(value);
    if (!value.trim()) {
      setFirstNameState('empty');
      setFirstNameError('');
      return;
    }
    validateFirstName(value);
  };

  const handleLastNameChange = (value) => {
    setLastName(value);
    if (!value.trim()) {
      setLastNameState('empty');
      setLastNameError('');
      return;
    }
    validateLastName(value);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (!value.trim()) {
      setEmailState('empty');
      setEmailError('');
      return;
    }
    validateEmail(value);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (!value) {
      setPasswordState('empty');
      setPasswordError('');
      return;
    }
    validatePassword(value);
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword, value);
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (!value) {
      setConfirmPasswordState('empty');
      setConfirmPasswordError('');
      return;
    }
    validateConfirmPassword(value, password);
  };

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setSubmitError('');

    const firstNameValid = validateFirstName(firstName);
    const lastNameValid = validateLastName(lastName);
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);
    const confirmValid = validateConfirmPassword(confirmPassword, password);

    if (!firstNameValid || !lastNameValid || !emailValid || !passwordValid || !confirmValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signUp(
        firstName.trim(),
        lastName.trim(),
        email.trim().toLowerCase(),
        password
      );

      const token =
        response?.data?.token ||
        response?.data?.accessToken ||
        response?.data?.data?.token ||
        response?.data?.data?.accessToken;

      if (token) {
        await saveToken(token);
        await AsyncStorage.setItem('firstName', firstName.trim());
        await AsyncStorage.setItem('email', email.trim().toLowerCase());
      }

      router.push({
        pathname: '/auth/role-selection',
        params: {
          token: token,
          firstName: firstName.trim(),
        },
      });
    } catch (error) {
      setSubmitError(getSignupErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {/* Logo */}
        <Image
          source={require('../../assets/images/signUpImage.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Heading */}
        <View style={styles.headingBlock}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join EventPro and start discovering or hosting events.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>

          {/* First Name */}
          <Input
            label="First Name"
            placeholder="Enter first name"
            value={firstName}
            onChangeText={handleFirstNameChange}
            onFocus={() => setFirstNameState('focused')}
            onBlur={() => validateFirstName(firstName)}
            validationState={firstNameState}
            errorMessage={firstNameError}
            successMessage={firstNameState === 'success' ? 'Looks good' : ''}
            leftIcon={<Ionicons name="person-outline" size={18} color="#9CA3AF" />}
          />

          {/* Last Name */}
          <Input
            label="Last Name"
            placeholder="Enter last name"
            value={lastName}
            onChangeText={handleLastNameChange}
            onFocus={() => setLastNameState('focused')}
            onBlur={() => validateLastName(lastName)}
            validationState={lastNameState}
            errorMessage={lastNameError}
            successMessage={lastNameState === 'success' ? 'Looks good' : ''}
            leftIcon={<Ionicons name="person-outline" size={18} color="#9CA3AF" />}
          />

          {/* Email */}
          <Input
            label="Email Address"
            placeholder="Enter email address"
            value={email}
            onChangeText={handleEmailChange}
            onFocus={() => setEmailState('focused')}
            onBlur={() => validateEmail(email)}
            validationState={emailState}
            errorMessage={emailError}
            successMessage={emailState === 'success' ? 'Email looks good' : ''}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Ionicons name="mail-outline" size={18} color="#9CA3AF" />}
          />

          {/* Password */}
          <Input
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={handlePasswordChange}
            onFocus={(event) => {
              setPasswordState('focused');
              scrollToFocusedInput(event?.target);
            }}
            onBlur={() => validatePassword(password)}
            validationState={passwordState}
            errorMessage={passwordError}
            successMessage={passwordState === 'success' ? 'Password strength is okay' : ''}
            secureTextEntry={!showPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            }
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            onFocus={(event) => {
              setConfirmPasswordState('focused');
              scrollToFocusedInput(event?.target);
            }}
            onBlur={() => validateConfirmPassword(confirmPassword, password)}
            validationState={confirmPasswordState}
            errorMessage={confirmPasswordError}
            successMessage={confirmPasswordState === 'success' ? 'Passwords match' : ''}
            secureTextEntry={!showConfirmPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            }
          />

          {/* Submit Error */}
          {submitError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorBoxText}>{submitError}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <Button
            title={isSubmitting ? 'Creating Account...' : 'Create Account'}
            onPress={handleSignUp}
            disabled={isSubmitting}
            loading={isSubmitting}
            size="large"
            style={styles.signUpButton}
            textStyle={{ fontSize: 16 }}
          />

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text
              style={styles.loginLink}
              onPress={() => router.push('/auth/login')}
            >
              Sign In
            </Text>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By creating an account, you agree to EventPro's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },

  logo: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginBottom: 8,
  },

  headingBlock: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  formContainer: {
    width: '100%',
    gap: 4,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBoxText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },

  signUpButton: {
    marginTop: 20,
    marginBottom: 16,
    width: '100%',
    backgroundColor: '#6F00FF',
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#6F00FF',
    fontWeight: '700',
  },

  terms: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#6F00FF',
    fontWeight: '600',
  },
});

export default SignUp;