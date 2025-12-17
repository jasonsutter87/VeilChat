/**
 * TibbyTalk - Disappearing Message Service
 * Handles TTL-based message expiration
 */

import {deleteMessage} from './messageService';
import type {Message} from '../types';

// Track active timers
const activeTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Start a timer for a disappearing message
 */
export function startMessageTimer(
  message: Message,
  onExpire: () => void,
): void {
  if (!message.expiresAt || activeTimers.has(message.id)) {
    return;
  }

  const msUntilExpiry = message.expiresAt - Date.now();

  if (msUntilExpiry <= 0) {
    // Already expired
    onExpire();
    return;
  }

  const timer = setTimeout(() => {
    onExpire();
    activeTimers.delete(message.id);
  }, msUntilExpiry);

  activeTimers.set(message.id, timer);
}

/**
 * Cancel a message timer
 */
export function cancelMessageTimer(messageId: string): void {
  const timer = activeTimers.get(messageId);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(messageId);
  }
}

/**
 * Clear all active timers
 */
export function clearAllTimers(): void {
  activeTimers.forEach(timer => clearTimeout(timer));
  activeTimers.clear();
}

/**
 * Check if any messages have expired and clean them up
 */
export function cleanupExpiredMessages(
  messages: Message[],
  conversationId: string,
): Message[] {
  const now = Date.now();
  const validMessages: Message[] = [];

  for (const message of messages) {
    if (message.expiresAt && message.expiresAt <= now) {
      // Message has expired, delete from Firestore
      deleteMessage(conversationId, message.id).catch(err => {
        console.error('Failed to delete expired message:', err);
      });
    } else {
      validMessages.push(message);
    }
  }

  return validMessages;
}

/**
 * Get time remaining until message expires
 */
export function getTimeRemaining(message: Message): number | null {
  if (!message.expiresAt) {
    return null;
  }

  const remaining = message.expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(ms: number | null): string {
  if (ms === null) {
    return '';
  }

  if (ms <= 0) {
    return 'Expiring...';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Initialize timers for a list of messages
 */
export function initializeTimers(
  messages: Message[],
  onMessageExpire: (messageId: string) => void,
): void {
  for (const message of messages) {
    if (message.expiresAt && message.expiresAt > Date.now()) {
      startMessageTimer(message, () => onMessageExpire(message.id));
    }
  }
}

/**
 * Get the number of active timers
 */
export function getActiveTimerCount(): number {
  return activeTimers.size;
}
