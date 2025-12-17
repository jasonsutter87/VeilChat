/**
 * TibbyTalk - Add Members Screen
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {COLORS} from '../../config/constants';
import type {MainStackParamList} from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'AddMembers'>;

export default function AddMembersScreen({route}: Props) {
  const {groupId} = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Members</Text>
      <Text style={styles.text}>Adding members to group: {groupId}</Text>
      <Text style={styles.placeholder}>Member search and add functionality coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: 16},
  title: {fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 16},
  text: {fontSize: 16, color: COLORS.text, marginBottom: 8},
  placeholder: {fontSize: 16, color: COLORS.textSecondary, marginTop: 16},
});
