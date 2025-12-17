/**
 * TibbyTalk - Main Navigator
 * Handles authenticated user flows
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {MainStackParamList} from '../types';
import {COLORS} from '../config/constants';

import ConversationListScreen from '../screens/chat/ConversationListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import NewChatScreen from '../screens/chat/NewChatScreen';
import CreateGroupScreen from '../screens/group/CreateGroupScreen';
import GroupInfoScreen from '../screens/group/GroupInfoScreen';
import AddMembersScreen from '../screens/group/AddMembersScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SecuritySettingsScreen from '../screens/settings/SecuritySettingsScreen';
import KeyBackupScreen from '../screens/settings/KeyBackupScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name="ConversationList"
        component={ConversationListScreen}
        options={{
          title: 'TibbyTalk',
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Chat',
        }}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{
          title: 'New Chat',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          title: 'Create Group',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="GroupInfo"
        component={GroupInfoScreen}
        options={{
          title: 'Group Info',
        }}
      />
      <Stack.Screen
        name="AddMembers"
        component={AddMembersScreen}
        options={{
          title: 'Add Members',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="SecuritySettings"
        component={SecuritySettingsScreen}
        options={{
          title: 'Security',
        }}
      />
      <Stack.Screen
        name="KeyBackup"
        component={KeyBackupScreen}
        options={{
          title: 'Key Backup',
        }}
      />
    </Stack.Navigator>
  );
}
