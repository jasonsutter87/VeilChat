// TibbyTalk Type Definitions

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
  data: string; // Base64 AES-encrypted content
  key: string; // Base64 RSA-encrypted AES key
  iv: string; // Base64 IV
}

export interface GroupEncryptedMessage {
  encrypted: true;
  version: 'tt-e1';
  data: string; // Base64 AES-encrypted content
  iv: string; // Base64 IV
  keyId: string; // Which group key version was used
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

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
    preview: string; // "Encrypted message" placeholder
  };
  // Group-specific fields
  name?: string;
  adminIds?: string[];
  groupKeyId?: string;
  groupKeyDistribution?: Record<string, string>; // userId -> encrypted group key
}

// ==================== Message Types ====================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  timestamp: number;
  type: ConversationType;
  encryptedContent: EncryptedMessage | GroupEncryptedMessage;
  // Disappearing message fields
  ttl: number | null; // Seconds until expiry (null = permanent)
  expiresAt: number | null; // Timestamp when message expires
  readBy: Record<string, number>; // userId -> read timestamp
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

// ==================== Navigation Types ====================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string };
  NewChat: undefined;
  CreateGroup: undefined;
  GroupInfo: { groupId: string };
  AddMembers: { groupId: string };
  Settings: undefined;
  SecuritySettings: undefined;
  KeyBackup: undefined;
};
