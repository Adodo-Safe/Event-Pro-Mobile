import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
    if (!target) {
      return;
    }

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
      }

      Alert.alert('Account created', 'Your account has been created successfully.');
      router.replace('/');
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight + 32 }]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View>
          <Image
            source={require('../../assets/images/signup-image.png')}
            style={{ width: 313, height: 221, alignSelf: 'center' }}
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Sign Up</Text>
          <View style={styles.headerBackSpacer} />
        </View>

        <View style={styles.formContainer}>
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
          />

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
          />

          <Input
            label="Email"
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
            leftIcon={require('../../assets/images/email-icon.png')}
            leftIconStyle={{ width: 20, height: 20 }}
          />

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
            secureTextEntry
            leftIcon={require('../../assets/images/password-icon.png')}
            leftIconStyle={{ width: 20, height: 20 }}
          />

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
            secureTextEntry
          />

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <Button
            title={isSubmitting ? 'Creating...' : 'Create Account'}
            onPress={handleSignUp}
            disabled={isSubmitting}
            size="large"
            style={styles.signUpButton}
            textStyle={{ fontFamily: 'bold', fontSize: 18 }}
          />
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
    paddingTop: 32,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 27,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#1F2937',
  },
  headerBackSpacer: {
    width: 36,
  },
  title: {
    flex: 1,
    fontSize: 32,
    fontFamily: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginLeft: 36,
  },
  formContainer: {
    width: '100%',
    marginBottom: 40,
    gap: 9,
  },
  submitError: {
    marginTop: 4,
    color: '#DC2626',
    fontSize: 13,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  signUpButton: {
    marginTop: 20,
    marginBottom: 20,
    width: '75%',
    alignSelf: 'center',
    backgroundColor: '#6F00FF',
  },
});

export default SignUp;