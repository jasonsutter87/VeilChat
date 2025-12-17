/**
 * TibbyTalk - Settings Screen
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {COLORS} from '../../config/constants';
import {useAuthStore} from '../../store';
import {logoutUser} from '../../core/auth';
import type {MainStackParamList} from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

export default function SettingsScreen({navigation}: Props) {
  const {user} = useAuthStore();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Make sure you have backed up your encryption keys.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logoutUser();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Display Name</Text>
          <Text style={styles.value}>{user?.displayName}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('SecuritySettings')}>
          <Text style={styles.menuText}>Security Settings</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('KeyBackup')}>
          <Text style={styles.menuText}>Backup Encryption Keys</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>TibbyTalk v1.0.0</Text>
        <Text style={styles.footerText}>End-to-End Encrypted Messaging</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  section: {padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase'},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  label: {fontSize: 16, color: COLORS.text},
  value: {fontSize: 16, color: COLORS.textSecondary},
  menuItem: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12},
  menuText: {fontSize: 16, color: COLORS.text},
  arrow: {fontSize: 20, color: COLORS.textSecondary},
  logoutButton: {backgroundColor: '#FFF0F0', padding: 16, borderRadius: 8, alignItems: 'center'},
  logoutText: {color: COLORS.error, fontSize: 16, fontWeight: '600'},
  footer: {padding: 32, alignItems: 'center'},
  footerText: {fontSize: 14, color: COLORS.textSecondary, marginBottom: 4},
});
