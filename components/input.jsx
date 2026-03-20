import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  validationState,
  errorMessage,
  successMessage,
  leftIcon,
  rightIcon,
  leftIconStyle,
  rightIconStyle,
  placeholderTextColor,
  inputStyle,
  ...props
}) => {
  const getInputBorderColor = () => {
    switch (validationState) {
      case 'focused': return '#9333EA';
      case 'error': return '#DC2626';
      case 'success': return '#16A34A';
      default: return '#E5E7EB';
    }
  };

  const getMessageColor = () => {
    switch (validationState) {
      case 'error': return '#DC2626';
      case 'success': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const displayMessage = validationState === 'error' ? errorMessage : successMessage;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, { borderColor: getInputBorderColor() }]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || '#9CA3AF'}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      {displayMessage ? (
        <Text style={[styles.message, { color: getMessageColor() }]}>
          {displayMessage}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 52,
  },
  leftIconContainer: {
    marginRight: 10,
  },
  rightIconContainer: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    paddingVertical: 12,
  },
  message: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default Input;