/**
 * TibbyTalk - Key Backup Screen
 */

import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {COLORS} from '../../config/constants';
import {useAuthStore} from '../../store';
import {getPrivateKey} from '../../core/storage';
import {exportPrivateKeys} from '../../core/crypto';
import {getPasswordRequirementsText} from '../../core/auth';

export default function KeyBackupScreen() {
  const {user} = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const passwordRequirements = getPasswordRequirementsText();

  const handleExport = async () => {
    if (!password || password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    setIsExporting(true);
    try {
      const privateKey = await getPrivateKey(user.id);
      if (!privateKey) {
        Alert.alert('Error', 'Could not retrieve private key');
        return;
      }

      const bundle = await exportPrivateKeys({[user.id]: privateKey}, password);

      // TODO: Share/save the bundle file
      Alert.alert(
        'Backup Created',
        'Your encrypted key backup has been created. In a full implementation, you would be able to save or share this file.',
        [{text: 'OK'}],
      );

      console.log('Key bundle created:', bundle);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export keys');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Backup?</Text>
        <Text style={styles.description}>
          Your encryption keys are stored only on this device. If you lose your phone or
          reinstall the app, you'll need this backup to read your old messages.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create Backup</Text>
        <Text style={styles.label}>Backup Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a strong password..."
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isExporting}
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm password..."
          placeholderTextColor={COLORS.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!isExporting}
        />

        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          {passwordRequirements.map((req, index) => (
            <Text key={index} style={styles.requirementItem}>• {req}</Text>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isExporting && styles.buttonDisabled]}
          onPress={handleExport}
          disabled={isExporting}>
          <Text style={styles.buttonText}>
            {isExporting ? 'Creating Backup...' : 'Create Encrypted Backup'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>Important</Text>
        <Text style={styles.warningText}>
          Store your backup password separately from your backup file.
          If you forget this password, your backup cannot be recovered.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  section: {padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase'},
  description: {fontSize: 14, color: COLORS.textSecondary, lineHeight: 20},
  label: {fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 8, marginTop: 12},
  input: {backgroundColor: '#F5F5F5', borderRadius: 8, padding: 16, fontSize: 16, marginBottom: 8},
  requirements: {backgroundColor: '#F0F8FF', borderRadius: 8, padding: 12, marginVertical: 16},
  requirementsTitle: {fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4},
  requirementItem: {fontSize: 13, color: COLORS.textSecondary, marginLeft: 4},
  button: {backgroundColor: COLORS.primary, borderRadius: 8, padding: 16, alignItems: 'center'},
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  warning: {margin: 16, backgroundColor: '#FFF3CD', borderRadius: 8, padding: 16},
  warningTitle: {fontSize: 14, fontWeight: '600', color: '#856404', marginBottom: 4},
  warningText: {fontSize: 13, color: '#856404', lineHeight: 18},
});
