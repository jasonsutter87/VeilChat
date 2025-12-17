/**
 * TibbyTalk - Crypto Module Exports
 */

// Encryption functions
export {
  encryptMessage,
  decryptMessage,
  encryptWithSymmetricKey,
  decryptWithSymmetricKey,
  hashField,
  deriveKeyFromPassword,
  exportPrivateKeys,
  importPrivateKeys,
} from './encryption';

// Key generation
export {
  generateUserKeyPair,
  generateGroupSymmetricKey,
  exportSymmetricKey,
  importSymmetricKey,
  importPublicKey,
  importPrivateKey,
} from './keyGeneration';

// Group key management
export {
  createGroupKeyBundle,
  decryptGroupKey,
  encryptGroupMessage,
  decryptGroupMessage,
  rotateGroupKey,
  addMemberToGroup,
} from './groupKeys';
export type {GroupKeyBundle} from './groupKeys';

// Utilities
export {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateUUID,
  generateKeyId,
} from './utils';
