import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import Input from '../../components/input';
import Button from '../../components/button';

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [firstNameState, setFirstNameState] = useState('empty'); // empty, focused, error, success
  const [emailState, setEmailState] = useState('empty');
  const [passwordState, setPasswordState] = useState('empty');
  const [confirmPasswordState, setConfirmPasswordState] = useState('empty');

  const [firstNameError, setFirstNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef(null);

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

  // Validation functions
  const validateFirstName = (value) => {
    if (!value.trim()) {
      setFirstNameState('empty');
      return;
    }

    const words = value.trim().split(/\s+/);
    if (words.length < 2) {
      setFirstNameState('error');
      setFirstNameError('The name must consist of two words');
    } else {
      setFirstNameState('success');
      setFirstNameError('');
    }
  };

  const validateEmail = (value) => {
    if (!value.trim()) {
      setEmailState('empty');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailState('error');
      setEmailError('Please enter a valid email address');
    } else {
      setEmailState('success');
      setEmailError('');
    }
  };

  const handleFirstNameChange = (value) => {
    setFirstName(value);
    if (value.length > 0) {
      validateFirstName(value);
    } else {
      setFirstNameState('empty');
      setFirstNameError('');
    }
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (value.length > 0) {
      validateEmail(value);
    } else {
      setEmailState('empty');
      setEmailError('');
    }
  };

  const handleFirstNameFocus = () => {
    if (firstName) {
      setFirstNameState('focused');
    }
  };

  const handleFirstNameBlur = () => {
    if (firstName) {
      validateFirstName(firstName);
    }
  };

  const handleEmailFocus = () => {
    if (email) {
      setEmailState('focused');
    }
  };

  const handleEmailBlur = () => {
    if (email) {
      validateEmail(email);
    }
  };

  const handleSignUp = () => {
    // Sign up logic here
    console.log('Sign Up pressed');
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
        showsVerticalScrollIndicator={true}
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
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            placeholder="Enter here..."
            value={firstName}
            onChangeText={handleFirstNameChange}
            onFocus={handleFirstNameFocus}
            onBlur={handleFirstNameBlur}
            validationState={firstNameState}
            errorMessage={firstNameError}
            successMessage={firstNameState === 'success' ? 'Name accepted' : ''}
          />

          <Input
            label="Email"
            placeholder="Enter email address"
            value={email}
            onChangeText={handleEmailChange}
            onFocus={handleEmailFocus}
            onBlur={handleEmailBlur}
            validationState={emailState}
            errorMessage={emailError}
            successMessage={emailState === 'success' ? 'Email looks good' : ''}
            keyboardType="email-address"
            leftIcon={require('../../assets/images/email-icon.png')}
            leftIconStyle={{ width: 20, height: 20 }}
          />

          <Input
            label="Password"
            placeholder="Enter Password"
            value={password}
            onChangeText={setPassword}
            onFocus={(event) => {
              setPasswordState('focused');
              scrollToFocusedInput(event?.target);
            }}
            onBlur={() => password && setPasswordState('empty')}
            validationState={passwordState}
            secureTextEntry
            leftIcon={require('../../assets/images/password-icon.png')}
            leftIconStyle={{ width: 20, height: 20}}
          />

          <Input
            label="Confirm Password"
            placeholder="Enter Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={(event) => {
              setConfirmPasswordState('focused');
              scrollToFocusedInput(event?.target);
            }}
            onBlur={() => confirmPassword && setConfirmPasswordState('empty')}
            validationState={confirmPasswordState}
            secureTextEntry
          />

          <Button
            title="Create Account"
            onPress={handleSignUp}
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
    marginBottom: 32,
  },
  title: {
    marginTop: 16,
    fontSize: 32,
    fontFamily: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: 40,
    gap: 9,
  },
  signUpButton: {
    marginTop: 39,
    marginBottom: 20,
    width: '75%',
    alignSelf: 'center',
    backgroundColor: '#6F00FF',
  },
});

export default SignUp;