/**
 * TibbyTalk - App Constants
 */

// App info
export const APP_NAME = 'TibbyTalk';
export const APP_VERSION = '1.0.0';

// Encryption
export const ENCRYPTION_VERSION = 'tt-e1';

// TTL options for disappearing messages (in seconds)
export const TTL_OPTIONS = {
  OFF: null,
  FIVE_SECONDS: 5,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
} as const;

// TTL display labels
export const TTL_LABELS: Record<string, string> = {
  OFF: 'Off',
  FIVE_SECONDS: '5 seconds',
  ONE_MINUTE: '1 minute',
  FIVE_MINUTES: '5 minutes',
  ONE_HOUR: '1 hour',
  ONE_DAY: '1 day',
  ONE_WEEK: '1 week',
};

// Message limits
export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_GROUP_MEMBERS = 100;
export const MAX_GROUP_NAME_LENGTH = 50;

// UI
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#FFFFFF',
  backgroundDark: '#1C1C1E',
  text: '#000000',
  textDark: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  messageSent: '#007AFF',
  messageReceived: '#E5E5EA',
} as const;
