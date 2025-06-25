import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LoadingSpinner = ({ 
  size = 'large', 
  color = '#2196F3', 
  text = 'Loading...', 
  type = 'spinner',
  style = {} 
}) => {
  const renderLoadingContent = () => {
    switch (type) {
      case 'dots':
        return (
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dot1, { backgroundColor: color }]} />
            <View style={[styles.dot, styles.dot2, { backgroundColor: color }]} />
            <View style={[styles.dot, styles.dot3, { backgroundColor: color }]} />
          </View>
        );
      case 'pulse':
        return (
          <View style={[styles.pulseContainer, { borderColor: color }]}>
            <Ionicons name="car" size={32} color={color} />
          </View>
        );
      case 'skeleton':
        return (
          <View style={styles.skeletonContainer}>
            <View style={[styles.skeletonLine, { backgroundColor: color + '20' }]} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort, { backgroundColor: color + '20' }]} />
            <View style={[styles.skeletonLine, { backgroundColor: color + '20' }]} />
          </View>
        );
      default:
        return <ActivityIndicator size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderLoadingContent()}
      {text && <Text style={[styles.text, { color }]}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  dot1: {
    animationName: 'bounce',
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationDelay: '0s',
  },
  dot2: {
    animationName: 'bounce',
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationDelay: '0.2s',
  },
  dot3: {
    animationName: 'bounce',
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationDelay: '0.4s',
  },
  pulseContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    animationName: 'pulse',
    animationDuration: '2s',
    animationIterationCount: 'infinite',
  },
  skeletonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  skeletonLine: {
    height: 20,
    borderRadius: 4,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  skeletonLineShort: {
    width: '60%',
  },
});

export default LoadingSpinner; 