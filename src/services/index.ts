/**
 * TibbyTalk - Services Exports
 */

// Conversation Service
export {
  createDirectConversation,
  createGroupConversation,
  findDirectConversation,
  getConversation,
  getUserConversations,
  subscribeToConversations,
  updateLastMessage,
  addGroupMember,
  removeGroupMember,
} from './conversationService';

// Message Service
export {
  sendDirectMessage,
  sendGroupMessage,
  decryptDirectMessageContent,
  decryptGroupMessageContent,
  getGroupKeyForConversation,
  getMessages,
  subscribeToMessages,
  markMessageAsRead,
  deleteMessage,
} from './messageService';

// Group Service
export {
  createGroup,
  getGroupKey,
  addMember,
  removeMember,
  makeAdmin,
  removeAdmin,
  updateGroupName,
  leaveGroup,
} from './groupService';

// Disappearing Message Service
export {
  startMessageTimer,
  cancelMessageTimer,
  clearAllTimers,
  cleanupExpiredMessages,
  getTimeRemaining,
  formatTimeRemaining,
  initializeTimers,
  getActiveTimerCount,
} from './disappearingMessageService';
