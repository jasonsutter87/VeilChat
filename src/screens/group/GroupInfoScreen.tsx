/**
 * TibbyTalk - Group Info Screen
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {COLORS} from '../../config/constants';
import type {MainStackParamList} from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'GroupInfo'>;

export default function GroupInfoScreen({route}: Props) {
  const {groupId} = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Info</Text>
      <Text style={styles.text}>Group ID: {groupId}</Text>
      <Text style={styles.placeholder}>Group details and member management coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background, padding: 16},
  title: {fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 16},
  text: {fontSize: 16, color: COLORS.text, marginBottom: 8},
  placeholder: {fontSize: 16, color: COLORS.textSecondary, marginTop: 16},
});
