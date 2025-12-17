/**
 * TibbyTalk - Root Navigator
 * Switches between Auth and Main navigators based on auth state
 */

import React, {useEffect} from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {onAuthStateChanged, getUserById} from '../core/auth';
import {useAuthStore} from '../store';
import {COLORS} from '../config/constants';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function RootNavigator() {
  const {isAuthenticated, isLoading, isInitialized, setUser, setInitialized} =
    useAuthStore();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        // User is signed in, get full user data
        try {
          const userData = await getUserById(firebaseUser.uid);
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user data:', error);
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setInitialized(true);
    });

    return unsubscribe;
  }, [setUser, setInitialized]);

  // Show loading screen while checking auth state
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
