/**
 * TibbyTalk Web - Chat Page
 */

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { logoutUser, searchUsersByEmail, getUserById } from '../core/auth/authService';
import {
  subscribeToConversations,
  createDirectConversation,
  getConversation,
} from '../services/conversationService';
import {
  subscribeToMessages,
  sendDirectMessage,
  decryptDirectMessageContent,
} from '../services/messageService';
import { hasPrivateKey } from '../core/storage/keyStorage';
import type { Conversation, Message, DecryptedMessage, User, EncryptedMessage } from '../types';
import styles from './Chat.module.css';

export default function Chat() {
  const { user, logout } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.id, (convs) => {
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const unsubscribe = subscribeToMessages(selectedConversation.id, async (msgs) => {
      // Decrypt messages
      const decrypted: DecryptedMessage[] = [];

      for (const msg of msgs) {
        try {
          // Only decrypt direct messages for now
          if (msg.type === 'direct') {
            const content = await decryptDirectMessageContent(
              msg.encryptedContent as EncryptedMessage,
              user.id
            );
            decrypted.push({
              ...msg,
              content,
              decryptedAt: Date.now(),
            });
          }
        } catch (err) {
          console.error('Failed to decrypt message:', err);
          decrypted.push({
            ...msg,
            content: '[Unable to decrypt]',
            decryptedAt: Date.now(),
          });
        }
      }

      setMessages(decrypted.reverse());
    });

    return () => unsubscribe();
  }, [selectedConversation, user]);

  // Load participant names
  useEffect(() => {
    const loadNames = async () => {
      const names: Record<string, string> = {};
      const idsToLoad = new Set<string>();

      conversations.forEach(conv => {
        conv.participants.forEach(id => {
          if (id !== user?.id && !participantNames[id]) {
            idsToLoad.add(id);
          }
        });
      });

      for (const id of idsToLoad) {
        const u = await getUserById(id);
        if (u) names[id] = u.displayName;
      }

      if (Object.keys(names).length > 0) {
        setParticipantNames(prev => ({ ...prev, ...names }));
      }
    };

    if (conversations.length > 0) loadNames();
  }, [conversations, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = async () => {
    await logoutUser();
    logout();
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchUsersByEmail(searchEmail.trim());
      setSearchResults(results.filter(u => u.id !== user?.id));
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (otherUser: User) => {
    if (!user) return;
    try {
      const conv = await createDirectConversation(user.id, otherUser.id);
      setSelectedConversation(conv);
      setShowNewChat(false);
      setSearchEmail('');
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || isSending) return;

    setIsSending(true);
    try {
      await sendDirectMessage(selectedConversation.id, user.id, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const getConversationName = (conv: Conversation): string => {
    if (conv.name) return conv.name;
    const otherId = conv.participants.find(id => id !== user?.id);
    return otherId ? participantNames[otherId] || 'Loading...' : 'Unknown';
  };

  const hasKey = user ? hasPrivateKey(user.id) : false;

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>TibbyTalk</h2>
          <button onClick={() => setShowNewChat(true)} className={styles.newChatBtn}>
            + New
          </button>
        </div>

        <div className={styles.userInfo}>
          <span>{user?.displayName}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>

        {!hasKey && (
          <div className={styles.keyWarning}>
            No encryption key found. Please import your keys or create a new account.
          </div>
        )}

        <div className={styles.conversationList}>
          {conversations.length === 0 ? (
            <div className={styles.emptyList}>
              No conversations yet. Start a new chat!
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`${styles.conversationItem} ${
                  selectedConversation?.id === conv.id ? styles.selected : ''
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className={styles.conversationName}>
                  {getConversationName(conv)}
                </div>
                <div className={styles.conversationPreview}>
                  {conv.lastMessage?.preview || 'No messages'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {showNewChat ? (
          <div className={styles.newChatPanel}>
            <h3>Start New Chat</h3>
            <div className={styles.searchBox}>
              <input
                type="email"
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? '...' : 'Search'}
              </button>
            </div>
            <div className={styles.searchResults}>
              {searchResults.map(u => (
                <div
                  key={u.id}
                  className={styles.searchResultItem}
                  onClick={() => handleStartChat(u)}
                >
                  <div className={styles.avatar}>
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.resultName}>{u.displayName}</div>
                    <div className={styles.resultEmail}>{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowNewChat(false)} className={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        ) : selectedConversation ? (
          <>
            <div className={styles.chatHeader}>
              <h3>{getConversationName(selectedConversation)}</h3>
              <div className={styles.encryptionBadge}>🔒 End-to-End Encrypted</div>
            </div>

            <div className={styles.messageList}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${
                    msg.senderId === user?.id ? styles.sent : styles.received
                  }`}
                >
                  <div className={styles.messageContent}>{msg.content}</div>
                  <div className={styles.messageTime}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isSending}
              />
              <button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
                {isSending ? '...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noChat}>
            <h3>Welcome to TibbyTalk</h3>
            <p>Select a conversation or start a new chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
