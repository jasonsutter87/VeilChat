/**
 * TibbyTalk - Crypto Polyfill Setup
 *
 * This file must be imported at the very top of index.js
 * before any other imports that use crypto.
 *
 * react-native-quick-crypto provides a native implementation
 * of the Web Crypto API for React Native.
 */

import 'react-native-quick-crypto';

// Verify crypto is available
if (typeof crypto === 'undefined' || typeof crypto.subtle === 'undefined') {
  console.error(
    'TibbyTalk: Crypto API not available. Make sure react-native-quick-crypto is properly installed.',
  );
}

export {};
