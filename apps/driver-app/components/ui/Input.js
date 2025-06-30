import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius, Shadows } from '../../constants/Spacing';

const Input = forwardRef(({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  required = false,
  error,
  success,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  returnKeyType,
  blurOnSubmit,
  onSubmitEditing,
  autoFocus,
  ...otherProps
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getContainerStyle = () => {
    const baseStyle = [styles.container];
    
    if (isFocused) {
      baseStyle.push(styles.containerFocused);
    }
    
    if (error) {
      baseStyle.push(styles.containerError);
    } else if (success) {
      baseStyle.push(styles.containerSuccess);
    }
    
    if (!editable) {
      baseStyle.push(styles.containerDisabled);
    }
    
    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];
    
    if (multiline) {
      baseStyle.push(styles.inputMultiline);
    }
    
    if (!editable) {
      baseStyle.push(styles.inputDisabled);
    }
    
    return baseStyle;
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChangeText = (text) => {
    console.log('Input component handleChangeText called:', text, 'placeholder:', placeholder);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderLeftIcon = () => {
    if (leftIcon) {
      return (
        <Ionicons
          name={leftIcon}
          size={20}
          color={error ? Colors.light.error : success ? Colors.light.success : Colors.light.icon}
          style={styles.leftIcon}
        />
      );
    }
    return null;
  };

  const renderRightIcon = () => {
    if (secureTextEntry) {
      return (
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.rightIconContainer}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={Colors.light.icon}
          />
        </TouchableOpacity>
      );
    }
    
    if (rightIcon) {
      return (
        <TouchableOpacity 
          onPress={onRightIconPress} 
          style={styles.rightIconContainer}
          disabled={!onRightIconPress}
        >
          <Ionicons
            name={rightIcon}
            size={20}
            color={error ? Colors.light.error : success ? Colors.light.success : Colors.light.icon}
          />
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {renderLeftIcon()}
        
        <TextInput
          ref={ref}
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.textTertiary}
          value={value}
          onChangeText={handleChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType={returnKeyType || 'default'}
          blurOnSubmit={blurOnSubmit !== undefined ? blurOnSubmit : false}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          {...otherProps}
        />
        
        {renderRightIcon()}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={Colors.light.error} />
          <Text style={[styles.errorText, errorStyle]}>{error}</Text>
        </View>
      )}
      
      {success && !error && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
          <Text style={styles.successText}>Valid input</Text>
        </View>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  
  labelContainer: {
    marginBottom: Spacing.sm,
  },
  
  label: {
    ...Typography.label,
    color: Colors.light.text,
  },
  
  required: {
    color: Colors.light.error,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    ...Shadows.sm,
  },
  
  containerFocused: {
    borderColor: Colors.light.primary,
    ...Shadows.base,
  },
  
  containerError: {
    borderColor: Colors.light.error,
  },
  
  containerSuccess: {
    borderColor: Colors.light.success,
  },
  
  containerDisabled: {
    backgroundColor: Colors.light.surfaceSecondary,
    opacity: 0.6,
  },
  
  input: {
    flex: 1,
    ...Typography.body1,
    color: Colors.light.text,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  inputDisabled: {
    color: Colors.light.textTertiary,
  },
  
  leftIcon: {
    marginRight: Spacing.sm,
  },
  
  rightIconContainer: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  
  errorText: {
    ...Typography.caption,
    color: Colors.light.error,
    marginLeft: Spacing.xs,
  },
  
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  
  successText: {
    ...Typography.caption,
    color: Colors.light.success,
    marginLeft: Spacing.xs,
  },
});

export default Input; 