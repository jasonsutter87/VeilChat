// TibbyTalk Web - Type Definitions
// Matches mobile app types for cross-platform compatibility

// ==================== Crypto Types ====================

export interface KeyPair {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
  keyId: string;
  createdAt: number;
}

export interface EncryptedMessage {
  encrypted: true;
  version: 'tt-e1';
  data: string;
  key: string;
  iv: string;
}

export interface GroupEncryptedMessage {
  encrypted: true;
  version: 'tt-e1';
  data: string;
  iv: string;
  keyId: string;
}

export interface EncryptedKeyBundle {
  version: string;
  algorithm: string;
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  exportedAt: string;
}

// ==================== User Types ====================

export interface User {
  id: string;
  email: string;
  displayName: string;
  publicKey: JsonWebKey;
  publicKeyId: string;
  fcmToken?: string;
  createdAt: number;
  lastSeen: number;
}

// ==================== Conversation Types ====================

export type ConversationType = 'direct' | 'group';

export interface ParticipantKey {
  publicKey: JsonWebKey;
  keyId: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  participants: string[];
  participantKeys: Record<string, ParticipantKey>;
  createdAt: number;
  updatedAt: number;
  lastMessage?: {
    senderId: string;
    timestamp: number;
    preview: string;
  };
  name?: string;
  adminIds?: string[];
  groupKeyId?: string;
  groupKeyDistribution?: Record<string, string>;
}

// ==================== Message Types ====================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  timestamp: number;
  type: ConversationType;
  encryptedContent: EncryptedMessage | GroupEncryptedMessage;
  ttl: number | null;
  expiresAt: number | null;
  readBy: Record<string, number>;
}

export interface DecryptedMessage extends Omit<Message, 'encryptedContent'> {
  content: string;
  decryptedAt: number;
}

// ==================== TTL Options ====================

export const TTL_OPTIONS = {
  OFF: null,
  FIVE_SECONDS: 5,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
} as const;

export type TTLOption = (typeof TTL_OPTIONS)[keyof typeof TTL_OPTIONS];

// ==================== Password Validation ====================

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}
