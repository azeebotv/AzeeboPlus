import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/contexts/AuthContext';
import { userApi } from '../../../src/api';
import { LoadingState, EmptyState, ErrorState } from '../../../src/components/StateContainers';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || '');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string }>({});

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await userApi.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || undefined,
      });

      await refreshUser();

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert('Change Avatar', 'Choose an option', [
      { text: 'Take Photo', onPress: () => {} },
      { text: 'Choose from Library', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarContainer} onPress={handleChangeAvatar}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {displayName.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Text style={styles.editBadgeText}>Edit</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={[styles.input, errors.displayName && styles.inputError]}
                placeholder="Enter your display name"
                placeholderTextColor="#666"
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (errors.displayName) {
                    setErrors((prev) => ({ ...prev, displayName: undefined }));
                  }
                }}
                autoCapitalize="words"
              />
              {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{user?.email || ''}</Text>
              </View>
              <Text style={styles.hintText}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#666"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  form: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#F3F4F6',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  readOnlyInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});
