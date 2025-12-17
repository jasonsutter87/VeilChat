/**
 * TibbyTalk - Authentication Service
 * Wraps Firebase Auth for email/password authentication
 */

import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {validatePassword} from './passwordValidation';
import {generateUserKeyPair} from '../crypto';
import {storePrivateKey} from '../storage/keyStorage';
import type {User, KeyPair} from '../../types';

/**
 * Register a new user with email and password
 * Also generates encryption keys and publishes public key to Firestore
 *
 * @param email - User's email address
 * @param password - User's password (must meet requirements)
 * @param displayName - User's display name
 * @returns The created user
 */
export async function registerUser(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  // Validate password strength
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Create Firebase user
  const userCredential = await auth().createUserWithEmailAndPassword(
    email,
    password,
  );

  const firebaseUser = userCredential.user;

  // Update display name
  await firebaseUser.updateProfile({displayName});

  // Generate encryption key pair
  const keyPair = await generateUserKeyPair();

  // Store private key securely on device
  await storePrivateKey(firebaseUser.uid, keyPair.privateKey);

  // Create user document in Firestore with public key
  const userData: Omit<User, 'id'> = {
    email: email.toLowerCase(),
    displayName,
    publicKey: keyPair.publicKey,
    publicKeyId: keyPair.keyId,
    createdAt: Date.now(),
    lastSeen: Date.now(),
  };

  await firestore().collection('users').doc(firebaseUser.uid).set(userData);

  return {
    id: firebaseUser.uid,
    ...userData,
  };
}

/**
 * Login with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns The authenticated user
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
  const userCredential = await auth().signInWithEmailAndPassword(
    email,
    password,
  );

  const firebaseUser = userCredential.user;

  // Update last seen
  await firestore().collection('users').doc(firebaseUser.uid).update({
    lastSeen: Date.now(),
  });

  // Get user data from Firestore
  const userDoc = await firestore()
    .collection('users')
    .doc(firebaseUser.uid)
    .get();

  if (!userDoc.exists) {
    throw new Error('User data not found');
  }

  const userData = userDoc.data() as Omit<User, 'id'>;

  return {
    id: firebaseUser.uid,
    ...userData,
  };
}

/**
 * Logout the current user
 */
export async function logoutUser(): Promise<void> {
  await auth().signOut();
}

/**
 * Send password reset email
 *
 * @param email - User's email address
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await auth().sendPasswordResetEmail(email);
}

/**
 * Get the currently authenticated user
 *
 * @returns Current user or null if not authenticated
 */
export function getCurrentUser(): FirebaseAuthTypes.User | null {
  return auth().currentUser;
}

/**
 * Subscribe to auth state changes
 *
 * @param callback - Function called when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChanged(
  callback: (user: FirebaseAuthTypes.User | null) => void,
): () => void {
  return auth().onAuthStateChanged(callback);
}

/**
 * Get user data from Firestore
 *
 * @param userId - User ID to fetch
 * @returns User data or null if not found
 */
export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = await firestore().collection('users').doc(userId).get();

  if (!userDoc.exists) {
    return null;
  }

  return {
    id: userDoc.id,
    ...(userDoc.data() as Omit<User, 'id'>),
  };
}

/**
 * Update user's FCM token for push notifications
 *
 * @param userId - User ID
 * @param fcmToken - FCM token
 */
export async function updateFcmToken(
  userId: string,
  fcmToken: string,
): Promise<void> {
  await firestore().collection('users').doc(userId).update({fcmToken});
}

/**
 * Search for users by email (for starting new chats)
 *
 * @param email - Email to search for
 * @returns Matching users
 */
export async function searchUsersByEmail(email: string): Promise<User[]> {
  const snapshot = await firestore()
    .collection('users')
    .where('email', '==', email.toLowerCase())
    .limit(10)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<User, 'id'>),
  }));
}
