/**
 * TibbyTalk Web - Authentication Service
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { auth, db, COLLECTIONS, FIELDS } from '../../config/firebase';
import { generateKeyPair } from '../crypto';
import { storePrivateKey, clearAllKeys } from '../storage/keyStorage';
import type { User, PasswordValidationResult } from '../../types';

// Password requirements (same as mobile)
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
};

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get password requirements text
 */
export function getPasswordRequirementsText(): string[] {
  return [
    `At least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
  ];
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  // Validate password
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Create Firebase user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Update display name
  await updateProfile(firebaseUser, { displayName });

  // Generate encryption key pair
  const keyPair = await generateKeyPair();

  // Store private key locally
  storePrivateKey(firebaseUser.uid, keyPair.privateKey);

  // Create user document in Firestore
  const userData = {
    [FIELDS.EMAIL]: email.toLowerCase(),
    [FIELDS.DISPLAY_NAME]: displayName,
    [FIELDS.PUBLIC_KEY]: keyPair.publicKey,
    [FIELDS.PUBLIC_KEY_ID]: keyPair.keyId,
    [FIELDS.CREATED_AT]: Date.now(),
    [FIELDS.LAST_SEEN]: Date.now(),
  };

  await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), userData);

  return {
    id: firebaseUser.uid,
    email: email.toLowerCase(),
    displayName,
    publicKey: keyPair.publicKey,
    publicKeyId: keyPair.keyId,
    createdAt: userData[FIELDS.CREATED_AT],
    lastSeen: userData[FIELDS.LAST_SEEN],
  };
}

/**
 * Login with email and password
 */
export async function loginUser(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Update last seen
  await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
    [FIELDS.LAST_SEEN]: Date.now(),
  });

  // Get user data
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
  if (!userDoc.exists()) {
    throw new Error('User data not found');
  }

  const data = userDoc.data();
  return {
    id: firebaseUser.uid,
    email: data[FIELDS.EMAIL],
    displayName: data[FIELDS.DISPLAY_NAME],
    publicKey: data[FIELDS.PUBLIC_KEY],
    publicKeyId: data[FIELDS.PUBLIC_KEY_ID],
    createdAt: data[FIELDS.CREATED_AT],
    lastSeen: data[FIELDS.LAST_SEEN],
  };
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
  clearAllKeys();
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Get current Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return {
    id: userDoc.id,
    email: data[FIELDS.EMAIL],
    displayName: data[FIELDS.DISPLAY_NAME],
    publicKey: data[FIELDS.PUBLIC_KEY],
    publicKeyId: data[FIELDS.PUBLIC_KEY_ID],
    createdAt: data[FIELDS.CREATED_AT],
    lastSeen: data[FIELDS.LAST_SEEN],
  };
}

/**
 * Search users by email
 */
export async function searchUsersByEmail(email: string): Promise<User[]> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where(FIELDS.EMAIL, '==', email.toLowerCase()),
    limit(10)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: data[FIELDS.EMAIL],
      displayName: data[FIELDS.DISPLAY_NAME],
      publicKey: data[FIELDS.PUBLIC_KEY],
      publicKeyId: data[FIELDS.PUBLIC_KEY_ID],
      createdAt: data[FIELDS.CREATED_AT],
      lastSeen: data[FIELDS.LAST_SEEN],
    };
  });
}
