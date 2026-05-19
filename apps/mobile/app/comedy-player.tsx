import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const PLACEHOLDER_IMAGE = '';

const clipData = {
  id: '1',
  title: 'When your village people find you online',
  comedian: '@apatroot',
  views: '850K',
  likes: '45K',
  thumbnail: PLACEHOLDER_IMAGE,
  duration: '02:34',
  uploadedAt: '2 days ago',
};

const comments = [
  { id: '1', user: '@user1', avatar: '👤', comment: 'This is too funny 😂', time: '2h ago', likes: '1.2K' },
  { id: '2', user: '@user2', avatar: '👤', comment: 'Village people no dey play 😂😂', time: '1h ago', likes: '856' },
  { id: '3', user: '@user3', avatar: '👤', comment: 'Apatroot never disappoints', time: '30m ago', likes: '423' },
];

export default function ComedyPlayerScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.videoSection}>
        <Image source={{ uri: clipData.thumbnail }} style={styles.videoPlayer} />
        <View style={styles.videoOverlay}>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.videoControls}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.timeDisplay}>
            <Text style={styles.currentTime}>{currentTime}</Text>
            <Text style={styles.totalTime}>{clipData.duration}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.clipInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.clipTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
              {clipData.title}
            </Text>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>👁️ {clipData.views}</Text>
            <Text style={styles.statText}>❤️ {isLiked ? (parseInt(clipData.likes) + 1) + 'K' : clipData.likes}</Text>
            <Text style={styles.statText}>💬 Comments</Text>
          </View>
        </View>

        <View style={styles.comedianSection}>
          <View style={styles.comedianInfo}>
            <View style={styles.comedianAvatar}>
              <Text style={styles.comedianAvatarText}>😂</Text>
            </View>
            <View style={styles.comedianDetails}>
              <Text style={[styles.comedianName, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                {clipData.comedian}
              </Text>
              <Text style={styles.comedianFollowers}>1.2M followers</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.followButton, isFollowed && styles.followButtonActive]}
            onPress={() => setIsFollowed(!isFollowed)}
          >
            <Text style={[styles.followButtonText, isFollowed && styles.followButtonTextActive]}>
              {isFollowed ? 'Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, isLiked && styles.actionButtonActive]}
            onPress={() => setIsLiked(!isLiked)}
          >
            <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
            <Text style={styles.actionLabel}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>↗️</Text>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💾</Text>
            <Text style={styles.actionLabel}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
            Comments
          </Text>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={[styles.commentInput, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              value={commentInput}
              onChangeText={setCommentInput}
            />
            <TouchableOpacity style={styles.sendButton}>
              <Text style={styles.sendIcon}>➡️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{comment.avatar}</Text>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentUser, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                      {comment.user}
                    </Text>
                    <Text style={styles.commentTime}>{comment.time}</Text>
                  </View>
                  <Text style={[styles.commentText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                    {comment.comment}
                  </Text>
                  <TouchableOpacity style={styles.commentLike}>
                    <Text style={styles.commentLikeText}>❤️ {comment.likes}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoSection: {
    position: 'relative',
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 28,
    marginLeft: 4,
  },
  videoControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    width: '45%',
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  totalTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 12,
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
  content: {
    flex: 1,
  },
  clipInfo: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clipTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    fontSize: 20,
    color: '#888',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: '#888',
  },
  comedianSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  comedianInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  comedianAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F39C12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comedianAvatarText: {
    fontSize: 24,
  },
  comedianDetails: {},
  comedianName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  comedianFollowers: {
    fontSize: 12,
    color: '#888',
  },
  followButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followButtonActive: {
    backgroundColor: '#333',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonTextActive: {},
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionButtonActive: {},
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    color: '#888',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 18,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6,
  },
  commentLike: {},
  commentLikeText: {
    fontSize: 12,
    color: '#888',
  },
  bottomPadding: {
    height: 32,
  },
});
