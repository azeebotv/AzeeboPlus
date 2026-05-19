import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

const CLIP_DATA = {
  id: '1',
  title: 'Bovi Live Special: Lagos Traffic Tales',
  creator: 'Bovi',
  creatorAvatar: '🧔',
  views: '2.4M',
  likes: '156K',
  comments: '8.9K',
  shares: '45K',
  duration: '12:30',
  createdAt: '2 days ago',
  description: 'Bovi shares hilarious stories about Lagos traffic. From danfo drivers to okada men, you won\'t stop laughing!',
  tags: ['Comedy', 'Nigerian', 'Lagos', 'Bovi', 'StandUp'],
};

const COMMENTS = [
  { id: '1', user: 'Lola', avatar: '👩🏾', text: 'This is absolutely hilarious! 😂😂', time: '1d ago', likes: '234' },
  { id: '2', user: 'Tunde', avatar: '👨🏾', text: 'Bovi is the GOAT of Nigerian comedy!', time: '1d ago', likes: '189' },
  { id: '3', user: 'Chichi', avatar: '👩🏾‍🦱', text: 'I can relate to the danfo story 😭', time: '2d ago', likes: '156' },
];

const RELATED_CLIPS = [
  { id: '1', title: 'Bovi: Banky W Wedding', duration: '8:45', emoji: '💒' },
  { id: '2', title: 'Nigerian Dad Stories', duration: '15:20', emoji: '👨' },
  { id: '3', title: 'Market Woman Comedy', duration: '10:15', emoji: '🏪' },
  { id: '4', title: 'Church Comedy', duration: '12:30', emoji: '⛪' },
];

export default function ComedyClipPlayer() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    Alert.alert('Success', isFollowing ? 'Unfollowed' : 'Now following Bovi!');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share this clip with friends!');
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoEmoji}>😂</Text>
          <View style={styles.videoControls}>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playIcon}>▶️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{CLIP_DATA.duration}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            {CLIP_DATA.title}
          </Text>

          <View style={styles.statsRow}>
            <Text style={styles.statText}>👁️ {CLIP_DATA.views}</Text>
            <Text style={styles.statText}>❤️ {isLiked ? parseInt(CLIP_DATA.likes.replace('K', '')) + 1 + 'K' : CLIP_DATA.likes}</Text>
            <Text style={styles.statText}>💬 {CLIP_DATA.comments}</Text>
            <Text style={styles.statText}>🔗 {CLIP_DATA.shares}</Text>
          </View>

          <View style={styles.creatorRow}>
            <View style={styles.creatorInfo}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarEmoji}>{CLIP_DATA.creatorAvatar}</Text>
              </View>
              <View>
                <Text style={[styles.creatorName, { color: isDark ? '#fff' : '#000' }]}>{CLIP_DATA.creator}</Text>
                <Text style={styles.creatorMeta}>{CLIP_DATA.createdAt}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followButtonActive]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: isDark ? '#ccc' : '#666' }]}>
            {CLIP_DATA.description}
          </Text>

          <View style={styles.tagsRow}>
            {CLIP_DATA.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
              <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>
                {isLiked ? 'Liked' : 'Like'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionIcon}>↗️</Text>
              <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🔖</Text>
              <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Save</Text>
            </TouchableOpacity>
          </View>

          {showComments && (
            <View style={styles.commentsSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Comments
              </Text>
              <View style={[styles.addCommentBar, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                <TextInput
                  style={[styles.commentInput, { color: isDark ? '#fff' : '#000' }]}
                  placeholder="Add a comment..."
                  placeholderTextColor="#888"
                />
                <TouchableOpacity style={styles.postButton}>
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
              {COMMENTS.map((comment) => (
                <View key={comment.id} style={[styles.commentCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarEmoji}>{comment.avatar}</Text>
                    </View>
                    <View style={styles.commentInfo}>
                      <View style={styles.commentMeta}>
                        <Text style={[styles.commentUser, { color: isDark ? '#fff' : '#000' }]}>{comment.user}</Text>
                        <Text style={styles.commentTime}>{comment.time}</Text>
                      </View>
                      <Text style={[styles.commentText, { color: isDark ? '#ccc' : '#666' }]}>{comment.text}</Text>
                      <View style={styles.commentActions}>
                        <TouchableOpacity style={styles.commentAction}>
                          <Text style={styles.commentActionIcon}>❤️</Text>
                          <Text style={styles.commentActionText}>{comment.likes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commentAction}>
                          <Text style={styles.commentActionIcon}>💬</Text>
                          <Text style={styles.commentActionText}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.relatedSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Related Clips
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedList}>
              {RELATED_CLIPS.map((clip) => (
                <TouchableOpacity key={clip.id} style={[styles.relatedCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                  <View style={styles.relatedThumbnail}>
                    <Text style={styles.relatedEmoji}>{clip.emoji}</Text>
                    <View style={styles.relatedDuration}>
                      <Text style={styles.relatedDurationText}>{clip.duration}</Text>
                    </View>
                  </View>
                  <Text style={[styles.relatedTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
                    {clip.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/watch')}>
          <Text style={styles.navIcon}>📺</Text>
          <Text style={[styles.navLabel, { color: '#F39C12' }]}>Watch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/create')}>
          <Text style={styles.navIcon}>✨</Text>
          <Text style={styles.navLabel}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.navIcon}>⭐</Text>
          <Text style={styles.navLabel}>Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    height: 260,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoEmoji: {
    fontSize: 80,
  },
  videoControls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 28,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statText: {
    color: '#888',
    fontSize: 13,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarEmoji: {
    fontSize: 24,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  creatorMeta: {
    color: '#888',
    fontSize: 12,
  },
  followButton: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followButtonActive: {
    backgroundColor: '#2a2a2a',
  },
  followButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonTextActive: {
    color: '#fff',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    color: '#F39C12',
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
  },
  commentsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  addCommentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
  },
  postButton: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  postButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  commentCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarEmoji: {
    fontSize: 18,
  },
  commentInfo: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    color: '#888',
    fontSize: 11,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionIcon: {
    fontSize: 14,
  },
  commentActionText: {
    color: '#888',
    fontSize: 12,
  },
  relatedSection: {
    marginBottom: 30,
  },
  relatedList: {
    gap: 12,
  },
  relatedCard: {
    width: 160,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  relatedThumbnail: {
    height: 100,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  relatedEmoji: {
    fontSize: 40,
  },
  relatedDuration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relatedDurationText: {
    color: '#fff',
    fontSize: 11,
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: '600',
    padding: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: '#888',
  },
});