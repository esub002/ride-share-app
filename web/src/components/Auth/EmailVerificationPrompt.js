import React from 'react';

export default function EmailVerificationPrompt({ email }) {
  return (
    <div style={{color:'orange'}}>
      Your email ({email}) is not verified. Please check your inbox for a verification link.
    </div>
  );
}
