/**
 * TibbyTalk - Auth Module Exports
 */

export {
  registerUser,
  loginUser,
  logoutUser,
  sendPasswordReset,
  getCurrentUser,
  onAuthStateChanged,
  getUserById,
  updateFcmToken,
  searchUsersByEmail,
} from './authService';

export {
  validatePassword,
  getPasswordRequirementsText,
  PASSWORD_REQUIREMENTS,
} from './passwordValidation';
