/**
 * TibbyTalk - Create Group Screen
 */

import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {COLORS} from '../../config/constants';
import type {MainStackParamList} from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'CreateGroup'>;

export default function CreateGroupScreen({navigation}: Props) {
  const [groupName, setGroupName] = useState('');

  const handleCreate = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    // TODO: Create group and navigate
    Alert.alert('Coming Soon', 'Group creation will be implemented soon');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter group name..."
        placeholderTextColor={COLORS.textSecondary}
        value={groupName}
        onChangeText={setGroupName}
        maxLength={50}
      />
      <Text style={styles.hint}>
        You'll be able to add members after creating the group.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: 16},
  label: {fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8},
  input: {backgroundColor: '#F5F5F5', borderRadius: 8, padding: 16, fontSize: 16, marginBottom: 8},
  hint: {fontSize: 14, color: COLORS.textSecondary, marginBottom: 24},
  button: {backgroundColor: COLORS.primary, borderRadius: 8, padding: 16, alignItems: 'center'},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
