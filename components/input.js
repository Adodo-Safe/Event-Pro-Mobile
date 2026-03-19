import React from 'react';
import { View, TextInput, Text, StyleSheet, Image } from 'react-native';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  validationState,
  errorMessage,
  successMessage,
  icon,
  leftIcon,
  rightIcon,
  leftIconStyle,
  rightIconStyle,
  leftIconContainerStyle,
  rightIconContainerStyle,
  placeholderTextColor,
  inputStyle,
  ...props
}) => {
  const leftIconValue = leftIcon || icon;

  const isImageSource = (iconValue) =>
    typeof iconValue === 'number' ||
    typeof iconValue === 'string' ||
    (!!iconValue &&
      typeof iconValue === 'object' &&
      !React.isValidElement(iconValue));

  const getInputBorderColor = () => {
    switch (validationState) {
      case 'focused':
        return '#9333EA'; 
      case 'error':
        return '#DC2626'; 
      case 'success':
        return '#16A34A'; 
      default:
        return '#E5E7EB'; 
    }
  };

  const getMessageColor = () => {
    switch (validationState) {
      case 'error':
        return '#DC2626'; // Red
      case 'success':
        return '#16A34A'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  const displayMessage = validationState === 'error' ? errorMessage : successMessage;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, { borderColor: getInputBorderColor() }]}>
        {leftIconValue && 
          <View style={[styles.icon, leftIconContainerStyle]}>
            {isImageSource(leftIconValue) ? (
              <Image source={leftIconValue} style={[styles.iconImage, leftIconStyle]} />
            ) : (
              leftIconValue
            )}
          </View>
        }
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || "#9CA3AF"}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
        {rightIcon && 
          <View style={[styles.rightIcon, rightIconContainerStyle]}>
            {isImageSource(rightIcon) ? (
              <Image source={rightIcon} style={[styles.iconImage, rightIconStyle]} />
            ) : (
              rightIcon
            )}
          </View>
        }
      </View>
      {displayMessage && (
        <Text style={[styles.message, { color: getMessageColor() }]}>
          {displayMessage}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 2,
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'semibold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    borderRadius: 15,
    borderColor: '#D5D8DC',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 42,
    width: 335,
  },
  iconImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 12,
    fontFamily: 'regular',
  },
  icon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  message: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    fontFamily: 'regular',
  },
});

export default Input;
