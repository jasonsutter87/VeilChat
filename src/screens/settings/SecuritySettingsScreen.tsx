/**
 * TibbyTalk - Security Settings Screen
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS} from '../../config/constants';
import {hasSecureHardware} from '../../core/storage';

export default function SecuritySettingsScreen() {
  const [hasHardwareSecurity, setHasHardwareSecurity] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    hasSecureHardware().then(setHasHardwareSecurity);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Encryption Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>End-to-End Encryption</Text>
          <Text style={[styles.status, styles.statusActive]}>Active</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Encryption Algorithm</Text>
          <Text style={styles.value}>RSA-2048 + AES-256-GCM</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Hardware Security</Text>
          <Text style={[styles.status, hasHardwareSecurity ? styles.statusActive : styles.statusInactive]}>
            {hasHardwareSecurity === null ? 'Checking...' : hasHardwareSecurity ? 'Available' : 'Software Only'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Your Keys</Text>
        <Text style={styles.description}>
          Your private encryption key is stored securely on this device and never leaves your phone.
          Only you can decrypt messages sent to you.
        </Text>
        <Text style={styles.description}>
          If you lose access to this device without backing up your keys, you will not be able to
          read your old messages on a new device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  section: {padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase'},
  statusRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  label: {fontSize: 16, color: COLORS.text},
  value: {fontSize: 14, color: COLORS.textSecondary},
  status: {fontSize: 14, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4},
  statusActive: {backgroundColor: '#E8F5E9', color: '#2E7D32'},
  statusInactive: {backgroundColor: '#FFF3E0', color: '#E65100'},
  description: {fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12},
});
