import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius, Shadows } from '../../constants/Spacing';

const Card = ({
  title,
  subtitle,
  children,
  onPress,
  variant = 'default',
  size = 'medium',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.base];
    
    // Size variants
    switch (size) {
      case 'small':
        baseStyle.push(styles.small);
        break;
      case 'large':
        baseStyle.push(styles.large);
        break;
      default:
        baseStyle.push(styles.medium);
    }
    
    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.elevated);
        break;
      case 'outlined':
        baseStyle.push(styles.outlined);
        break;
      case 'flat':
        baseStyle.push(styles.flat);
        break;
      default:
        baseStyle.push(styles.default);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };

  const renderHeader = () => {
    if (!title && !subtitle && !leftIcon && !rightIcon) {
      return null;
    }

    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={24}
              color={Colors.light.icon}
              style={styles.leftIcon}
            />
          )}
          <View style={styles.headerContent}>
            {title && (
              <Text style={[styles.title, titleStyle]}>{title}</Text>
            )}
            {subtitle && (
              <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
            )}
          </View>
        </View>
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={Colors.light.icon}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[getCardStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderHeader()}
      
      {children && (
        <View style={[styles.content, contentStyle]}>
          {children}
        </View>
      )}
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <Ionicons name="refresh" size={24} color={Colors.light.icon} />
        </View>
      )}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  
  // Size variants
  small: {
    padding: Spacing.sm,
  },
  medium: {
    padding: Spacing.base,
  },
  large: {
    padding: Spacing.xl,
  },
  
  // Variant styles
  default: {
    ...Shadows.base,
  },
  elevated: {
    ...Shadows.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.none,
  },
  flat: {
    ...Shadows.none,
  },
  disabled: {
    opacity: 0.6,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  leftIcon: {
    marginRight: Spacing.sm,
  },
  
  headerContent: {
    flex: 1,
  },
  
  title: {
    ...Typography.h4,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  
  subtitle: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
  },
  
  rightIconContainer: {
    padding: Spacing.xs,
  },
  
  // Content styles
  content: {
    // Content styling will be handled by children
  },
  
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.surface,
    opacity: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Card; 