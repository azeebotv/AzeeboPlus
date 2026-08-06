import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useUpdateProfile } from '../../src/hooks/useProfileQuery';
import { PageTransition, ScrollReveal, StaggerGrid, GlowCard } from '../../src/components/motion';

const MENU_ITEMS = [
  { id: 'subscriptions', label: 'Subscriptions', icon: '📺', action: 'navigate' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', action: 'navigate' },
  { id: 'privacy', label: 'Privacy & Security', icon: '🔒', action: 'navigate' },
  { id: 'parental', label: 'Parental Controls', icon: '👨‍👩‍👧', action: 'navigate' },
  { id: 'help', label: 'Help & Support', icon: '❓', action: 'navigate' },
  { id: 'about', label: 'About', icon: 'ℹ️', action: 'navigate' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || user.displayName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSaveProfile = () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    updateProfileMutation.mutate(
      {
        displayName: editForm.name.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Profile updated successfully');
          setShowEditModal(false);
        },
        onError: (error: Error) => {
          Alert.alert('Error', error.message || 'Failed to update profile');
        },
      }
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleMenuPress = (item: (typeof MENU_ITEMS)[0]) => {
    if (item.id === 'subscriptions') {
      router.push('/subscription/current');
    } else if (item.id === 'notifications') {
      Alert.alert('Coming Soon', 'Notification settings will be available soon');
    } else if (item.id === 'privacy') {
      Alert.alert('Coming Soon', 'Privacy settings will be available soon');
    } else {
      Alert.alert(item.label, 'This feature is coming soon');
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' }]}
        edges={['top']}
      >
        <View style={styles.unauthenticatedContainer}>
          <ActivityIndicator size="large" color="#E8420A" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' }]}
        edges={['top']}
      >
        <View style={styles.unauthenticatedContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={[styles.lockText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Please log in to view your profile
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
            accessibilityLabel="Log In"
            accessibilityRole="button"
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = user?.name || user?.displayName || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' }]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageTransition>
          <ScrollReveal direction="up">
            <View style={styles.header}>
              <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                Profile
              </Text>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={60}>
            <View style={styles.profileSection}>
              <GlowCard variant="strong" padding={0} style={styles.avatar}>
                <View style={[styles.avatarInner, { backgroundColor: '#E8420A' }]}>
                  {user?.avatar ? (
                    <Text style={styles.avatarImage}>👤</Text>
                  ) : (
                    <Text style={styles.avatarText}>{avatarInitial}</Text>
                  )}
                </View>
              </GlowCard>
              <View style={styles.profileInfo}>
                <Text
                  style={[styles.displayName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                >
                  {displayName}
                </Text>
                <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
                {user?.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ Verified</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.editButton} onPress={() => setShowEditModal(true)}>
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={120}>
            <View
              style={[
                styles.statsContainer,
                { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
              ]}
            >
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                >
                  {(user as unknown as Record<string, number>)?.watchHistoryCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>Watched</Text>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' },
                ]}
              />
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                >
                  {(user as unknown as Record<string, number>)?.savedListsCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>Lists</Text>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' },
                ]}
              />
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                >
                  {(user as unknown as Record<string, number>)?.reviewsCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={180}>
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}
              >
                Preferences
              </Text>
              <GlowCard variant="subtle" padding={0}>
                <View
                  style={[
                    styles.preferenceItem,
                    { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
                  ]}
                >
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceIcon}>🔔</Text>
                    <View>
                      <Text
                        style={[
                          styles.preferenceLabel,
                          { color: colorScheme === 'dark' ? '#fff' : '#000' },
                        ]}
                      >
                        Push Notifications
                      </Text>
                      <Text style={styles.preferenceSubtitle}>Receive alerts on your device</Text>
                    </View>
                  </View>
                  <Switch
                    value={pushEnabled}
                    onValueChange={setPushEnabled}
                    trackColor={{ false: '#333', true: '#E8420A' }}
                    thumbColor="#fff"
                  />
                </View>
                <View
                  style={[
                    styles.preferenceItem,
                    { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
                  ]}
                >
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceIcon}>📧</Text>
                    <View>
                      <Text
                        style={[
                          styles.preferenceLabel,
                          { color: colorScheme === 'dark' ? '#fff' : '#000' },
                        ]}
                      >
                        Email Notifications
                      </Text>
                      <Text style={styles.preferenceSubtitle}>Receive updates via email</Text>
                    </View>
                  </View>
                  <Switch
                    value={emailEnabled}
                    onValueChange={setEmailEnabled}
                    trackColor={{ false: '#333', true: '#E8420A' }}
                    thumbColor="#fff"
                  />
                </View>
              </GlowCard>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={240}>
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}
              >
                Account
              </Text>
              <StaggerGrid staggerDelay={40}>
                {MENU_ITEMS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
                    ]}
                    onPress={() => handleMenuPress(item)}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.menuLabel,
                        { color: colorScheme === 'dark' ? '#fff' : '#000' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.menuArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </StaggerGrid>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              accessibilityLabel="Logout"
              accessibilityRole="button"
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>

            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollReveal>
        </PageTransition>
      </ScrollView>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                accessibilityLabel="Close edit profile"
                accessibilityRole="button"
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor="#666"
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                  },
                ]}
                placeholder="Enter your phone number"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' },
                ]}
                onPress={() => setShowEditModal(false)}
                disabled={updateProfileMutation.isPending}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colorScheme === 'dark' ? '#fff' : '#000' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockText: {
    fontSize: 16,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  avatarImage: {
    fontSize: 40,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8420A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  preferenceLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  preferenceSubtitle: {
    color: '#666',
    fontSize: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
  },
  menuArrow: {
    color: '#666',
    fontSize: 24,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  logoutButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  versionText: {
    color: '#666',
    fontSize: 12,
  },
  bottomPadding: {
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#E8420A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
