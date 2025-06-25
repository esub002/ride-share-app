import React from 'react';
import { View, Text } from 'react-native';

export default function EmailVerificationPrompt({ email }) {
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: 'orange' }}>
        Your email ({email}) is not verified. Please check your inbox for a verification link.
      </Text>
    </View>
  );
}
