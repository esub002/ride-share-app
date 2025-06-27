import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';

const LoadingSpinner = ({
  type = 'spinner',
  text,
  color = Colors.light.primary,
  size = 'medium',
  style,
  textStyle,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation;

    switch (type) {
      case 'spinner':
        animation = Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        break;
      
      case 'pulse':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseValue, {
              toValue: 1.2,
              duration: 600,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(pulseValue, {
              toValue: 1,
              duration: 600,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        );
        break;
      
      case 'bounce':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(bounceValue, {
              toValue: 1,
              duration: 600,
              easing: Easing.bounce,
              useNativeDriver: true,
            }),
            Animated.timing(bounceValue, {
              toValue: 0,
              duration: 600,
              easing: Easing.bounce,
              useNativeDriver: true,
            }),
          ])
        );
        break;
      
      default:
        animation = Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
    }

    animation.start();

    return () => {
      animation.stop();
    };
  }, [type, spinValue, pulseValue, bounceValue]);

  const getSizeValue = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 48;
      default: return 32;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 32;
      default: return 24;
    }
  };

  const renderSpinner = () => {
    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const scale = pulseValue;
    const translateY = bounceValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -20],
    });

    const iconSize = getIconSize();
    const containerSize = getSizeValue();

    switch (type) {
      case 'spinner':
        return (
          <Animated.View
            style={[
              styles.spinnerContainer,
              {
                width: containerSize,
                height: containerSize,
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={[styles.spinner, { borderColor: color }]} />
          </Animated.View>
        );
      
      case 'pulse':
        return (
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale }],
              },
            ]}
          >
            <Ionicons name="car" size={iconSize} color={color} />
          </Animated.View>
        );
      
      case 'bounce':
        return (
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            <Ionicons name="car" size={iconSize} color={color} />
          </Animated.View>
        );
      
      case 'dots':
        return (
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: color,
                    transform: [
                      {
                        scale: pulseValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.3],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        );
      
      default:
        return (
          <Animated.View
            style={[
              styles.spinnerContainer,
              {
                width: containerSize,
                height: containerSize,
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={[styles.spinner, { borderColor: color }]} />
          </Animated.View>
        );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderSpinner()}
      {text && (
        <Text style={[styles.text, textStyle]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  spinner: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderTopColor: 'transparent',
  },
  
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  
  text: {
    ...Typography.body2,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.base,
  },
});

export default LoadingSpinner; 