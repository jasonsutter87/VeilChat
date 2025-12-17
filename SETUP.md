# TibbyTalk Setup Guide

## Prerequisites

- Node.js 18+
- React Native development environment set up
- Firebase account

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it "TibbyTalk" (or your preferred name)
4. Enable Google Analytics (optional)

### 2. Enable Services

In your Firebase project, enable:

1. **Authentication**
   - Go to Build > Authentication
   - Click "Get started"
   - Enable "Email/Password" provider

2. **Cloud Firestore**
   - Go to Build > Firestore Database
   - Click "Create database"
   - Start in "test mode" for development
   - Choose a location close to your users

3. **Cloud Messaging (FCM)**
   - Go to Project Settings > Cloud Messaging
   - Note your Server Key for push notifications

### 3. Add Android App

1. In Firebase Console, click "Add app" > Android
2. Package name: `com.tibbytalk` (or check your `android/app/build.gradle`)
3. Download `google-services.json`
4. Place it in `android/app/google-services.json`

### 4. Add iOS App (if building for iOS)

1. In Firebase Console, click "Add app" > iOS
2. Bundle ID: Check your `ios/TibbyTalkApp.xcodeproj` settings
3. Download `GoogleService-Info.plist`
4. Place it in `ios/GoogleService-Info.plist`
5. Add it to your Xcode project

### 5. Firestore Security Rules

Deploy these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read any public key, but only update their own
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Conversations: only participants can read/write
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null
        && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;

      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        allow create: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants
          && request.resource.data.senderId == request.auth.uid;
        allow delete: if request.auth != null
          && request.auth.uid == resource.data.senderId;
      }
    }

    // Group keys: only group members
    match /groupKeys/{groupId}/keys/{keyId} {
      allow read: if request.auth != null
        && request.auth.uid in get(/databases/$(database)/documents/conversations/$(groupId)).data.participants;
      allow write: if request.auth != null
        && request.auth.uid in get(/databases/$(database)/documents/conversations/$(groupId)).data.adminIds;
    }
  }
}
```

## Running the App

### Android

```bash
# Start Metro bundler
npm start

# In another terminal, run on Android
npm run android
```

### iOS

```bash
# Install pods first
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# In another terminal, run on iOS
npm run ios
```

## Project Structure

```
src/
├── config/          # Firebase and app configuration
├── core/
│   ├── crypto/      # Encryption (ported from VeilForms)
│   ├── auth/        # Authentication service
│   └── storage/     # Secure key storage
├── services/        # Business logic services
├── screens/         # UI screens
├── navigation/      # React Navigation setup
├── store/           # Zustand state management
├── types/           # TypeScript types
└── hooks/           # Custom React hooks
```

## Encryption

TibbyTalk uses:
- **RSA-2048-OAEP** for asymmetric key exchange
- **AES-256-GCM** for message encryption
- **PBKDF2** (100k iterations) for key derivation

All encryption is performed client-side. The server never sees unencrypted messages.

## Troubleshooting

### "Crypto not available"
Make sure `react-native-quick-crypto` is properly linked. Try:
```bash
cd ios && pod install && cd ..
```

### Firebase not connecting
1. Check that `google-services.json` / `GoogleService-Info.plist` are in the right locations
2. Verify package name / bundle ID matches Firebase configuration

### Key storage issues
On Android, make sure your device/emulator has a secure lock screen set up for Keystore to work.
