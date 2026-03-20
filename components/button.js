import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

const SIZE_STYLES = {
  small: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  medium: {
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  large: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
};

const VARIANT_STYLES = {
  primary: {
    backgroundColor: '#6F00FF',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6F00FF',
  },
  danger: {
    backgroundColor: '#EF4444',
    borderWidth: 0,
    borderColor: 'transparent',
  },
};

const VARIANT_TEXT_STYLES = {
  primary: { color: '#FFFFFF' },
  secondary: { color: '#6F00FF' },
  danger: { color: '#FFFFFF' },
};

function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  disabled = false,
  loading = false,
}) {
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.medium;
  const buttonVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const textVariant = VARIANT_TEXT_STYLES[variant] || VARIANT_TEXT_STYLES.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyle,
        buttonVariant,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textVariant.color} />
      ) : (
        <Text style={[styles.text, textVariant, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function ActionButton(props) {
  return <Button {...props} variant={props.variant || 'primary'} />;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Button;