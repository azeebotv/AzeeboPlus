'use client';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../src/api';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { useAuth } from '../src/contexts/AuthContext';

interface ProfileData {
  avatar?: string;
  displayName?: string;
  bio?: string;
  email?: string;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const res = await apiClient.get<ProfileData>('/api/v1/users/me');
      return res;
    },
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { displayName: string; bio: string }) =>
      apiClient.patch('/api/v1/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading profile..." />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState title="Not Authenticated" description="Please log in to view your profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Text style={styles.editAvatarText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={profile?.displayName || ''}
              onChangeText={(text) =>
                updateMutation.mutate({ displayName: text, bio: profile?.bio || '' })
              }
              placeholder="Enter your display name"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={profile?.bio || ''}
              onChangeText={(text) =>
                updateMutation.mutate({ displayName: profile?.displayName || '', bio: text })
              }
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
            />
          </View>

          {saved && (
            <View style={styles.savedBanner}>
              <Text style={styles.savedText}>Profile updated successfully!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0A0A' },
  content: { flex: 1 },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileSection: { padding: 16 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8420A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  editAvatarButton: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#E8420A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1A0A0A',
  },
  editAvatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  inputSection: { marginBottom: 16 },
  fieldLabel: { color: '#F5F0EB', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#140808',
    borderColor: '#2A1A1A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  savedBanner: {
    backgroundColor: 'rgba(10,165,232,0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5F9',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  savedText: { color: '#0EA5F9', fontSize: 14 },
});
