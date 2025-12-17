/**
 * TibbyTalk Web - Firebase Configuration
 *
 * SETUP: Replace the firebaseConfig values with your Firebase project config.
 * Get these from: Firebase Console > Project Settings > Your apps > Web app
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Collection names (same as mobile app)
export const COLLECTIONS = {
  USERS: 'users',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  GROUP_KEYS: 'groupKeys',
} as const;

// Field names
export const FIELDS = {
  EMAIL: 'email',
  DISPLAY_NAME: 'displayName',
  PUBLIC_KEY: 'publicKey',
  PUBLIC_KEY_ID: 'publicKeyId',
  CREATED_AT: 'createdAt',
  LAST_SEEN: 'lastSeen',
  TYPE: 'type',
  PARTICIPANTS: 'participants',
  PARTICIPANT_KEYS: 'participantKeys',
  UPDATED_AT: 'updatedAt',
  LAST_MESSAGE: 'lastMessage',
  NAME: 'name',
  ADMIN_IDS: 'adminIds',
  GROUP_KEY_ID: 'groupKeyId',
  GROUP_KEY_DISTRIBUTION: 'groupKeyDistribution',
  SENDER_ID: 'senderId',
  TIMESTAMP: 'timestamp',
  ENCRYPTED: 'encrypted',
  VERSION: 'version',
  ENCRYPTED_CONTENT: 'encryptedContent',
  TTL: 'ttl',
  EXPIRES_AT: 'expiresAt',
  READ_BY: 'readBy',
} as const;

export default app;
