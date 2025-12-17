/**
 * TibbyTalk - Firebase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication (Email/Password)
 * 3. Enable Cloud Firestore
 * 4. Enable Cloud Messaging (FCM)
 * 5. Add Android app and download google-services.json to android/app/
 * 6. Add iOS app and download GoogleService-Info.plist to ios/
 *
 * The @react-native-firebase packages read config from these files automatically.
 */

import firebase from '@react-native-firebase/app';

// Firebase is auto-initialized from google-services.json / GoogleService-Info.plist
// This file exports utilities and constants

export const isFirebaseInitialized = (): boolean => {
  return firebase.apps.length > 0;
};

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  GROUP_KEYS: 'groupKeys',
  PUSH_TOKENS: 'pushTokens',
} as const;

// Firestore field names for consistency
export const FIELDS = {
  // User fields
  EMAIL: 'email',
  DISPLAY_NAME: 'displayName',
  PUBLIC_KEY: 'publicKey',
  PUBLIC_KEY_ID: 'publicKeyId',
  FCM_TOKEN: 'fcmToken',
  CREATED_AT: 'createdAt',
  LAST_SEEN: 'lastSeen',

  // Conversation fields
  TYPE: 'type',
  PARTICIPANTS: 'participants',
  PARTICIPANT_KEYS: 'participantKeys',
  UPDATED_AT: 'updatedAt',
  LAST_MESSAGE: 'lastMessage',
  NAME: 'name',
  ADMIN_IDS: 'adminIds',
  GROUP_KEY_ID: 'groupKeyId',
  GROUP_KEY_DISTRIBUTION: 'groupKeyDistribution',

  // Message fields
  SENDER_ID: 'senderId',
  TIMESTAMP: 'timestamp',
  ENCRYPTED: 'encrypted',
  VERSION: 'version',
  ENCRYPTED_CONTENT: 'encryptedContent',
  TTL: 'ttl',
  EXPIRES_AT: 'expiresAt',
  READ_BY: 'readBy',
} as const;

export default firebase;
