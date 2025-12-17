/**
 * TibbyTalk - Conversation List Screen
 * Shows all conversations (1:1 and groups)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS} from '../../config/constants';
import {useAuthStore} from '../../store';
import {logoutUser} from '../../core/auth';
import type {MainStackParamList} from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'ConversationList'>;
};

export default function ConversationListScreen({navigation}: Props) {
  const {user} = useAuthStore();

  // TODO: Implement conversation fetching from Firestore
  const conversations: any[] = [];

  const handleNewChat = () => {
    navigation.navigate('NewChat');
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Conversations</Text>
      <Text style={styles.emptyText}>
        Start a new chat or create a group to begin messaging securely.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleNewChat}>
        <Text style={styles.emptyButtonText}>Start New Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.displayName || 'User'}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleSettings}>
            <Text style={styles.iconText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Text style={styles.iconText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {conversations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => navigation.navigate('Chat', {conversationId: item.id})}>
              <Text style={styles.conversationName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={handleNewChat}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    paddingVertical: 4,
  },
  iconText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  conversationName: {
    fontSize: 16,
    color: COLORS.text,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
});
