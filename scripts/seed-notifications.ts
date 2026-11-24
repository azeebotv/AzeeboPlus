/**
 * Seed script for notification templates
 * Generates 50 notification templates across all categories
 */

interface NotificationTemplate {
  id: string;
  name: string;
  category: 'welcome' | 'content' | 'payment' | 'social' | 'system' | 'promotion';
  channel: 'push' | 'email' | 'in_app' | 'sms';
  title: string;
  body: string;
  variables: string[];
  enabled: boolean;
}

const templates: NotificationTemplate[] = [
  // Welcome
  { id: 'ntf001', name: 'welcome_push', category: 'welcome', channel: 'push', title: 'Welcome to Azeebo+!', body: 'Start exploring your favorite entertainment. Your first 7 days are free!', variables: [], enabled: true },
  { id: 'ntf002', name: 'welcome_email', category: 'welcome', channel: 'email', title: 'Welcome to Azeebo+, {{name}}!', body: 'We are excited to have you on board. Here is what you can do...', variables: ['name'], enabled: true },
  
  // Content Recommendations
  { id: 'ntf010', name: 'new_content_push', category: 'content', channel: 'push', title: 'New {{contentType}} available!', body: '{{title}} just dropped. Watch it now!', variables: ['contentType', 'title'], enabled: true },
  { id: 'ntf011', name: 'trending_push', category: 'content', channel: 'push', title: 'Trending now 🔥', body: '{{title}} is trending in your area. Don\'t miss out!', variables: ['title'], enabled: true },
  { id: 'ntf012', name: 'new_release_email', category: 'content', channel: 'email', title: 'New releases this week', body: 'Check out what\'s new on Azeebo+ this week...', variables: [], enabled: true },
  { id: 'ntf013', name: 'live_event_push', category: 'content', channel: 'push', title: 'Live now!', body: '{{artist}} is performing live. Join now!', variables: ['artist'], enabled: true },
  { id: 'ntf014', name: 'recommendation_push', category: 'content', channel: 'push', title: 'Recommended for you', body: 'Based on your watching history, you might enjoy {{title}}', variables: ['title'], enabled: true },
  
  // Payment
  { id: 'ntf020', name: 'payment_success_push', category: 'payment', channel: 'push', title: 'Payment successful', body: 'Your payment of ₦{{amount}} was successful. Thank you!', variables: ['amount'], enabled: true },
  { id: 'ntf021', name: 'payment_failed_push', category: 'payment', channel: 'push', title: 'Payment failed', body: 'Your payment could not be processed. Please try again.', variables: [], enabled: true },
  { id: 'ntf022', name: 'subscription_renewal_push', category: 'payment', channel: 'push', title: 'Subscription renewed', body: 'Your {{plan}} subscription has been renewed. Enjoy!', variables: ['plan'], enabled: true },
  { id: 'ntf023', name: 'wallet_low_push', category: 'payment', channel: 'push', title: 'Low wallet balance', body: 'Your wallet balance is ₦{{balance}}. Top up to continue watching.', variables: ['balance'], enabled: true },
  { id: 'ntf024', name: 'tip_received_push', category: 'payment', channel: 'push', title: 'You received a tip! 🎉', body: '{{sender}} tipped you ₦{{amount}}. Keep creating!', variables: ['sender', 'amount'], enabled: true },
  { id: 'ntf025', name: 'payment_receipt_email', category: 'payment', channel: 'email', title: 'Payment receipt', body: 'Your receipt for ₦{{amount}} is attached.', variables: ['amount'], enabled: true },
  
  // Social
  { id: 'ntf030', name: 'follow_push', category: 'social', channel: 'push', title: 'New follower', body: '{{follower}} started following you!', variables: ['follower'], enabled: true },
  { id: 'ntf031', name: 'like_push', category: 'social', channel: 'push', title: 'New like', body: '{{user}} liked your {{contentType}}', variables: ['user', 'contentType'], enabled: true },
  { id: 'ntf032', name: 'comment_push', category: 'social', channel: 'push', title: 'New comment', body: '{{user}} commented on your {{contentType}}', variables: ['user', 'contentType'], enabled: true },
  { id: 'ntf033', name: 'share_push', category: 'social', channel: 'push', title: 'Content shared', body: '{{user}} shared your {{contentType}} with their friends!', variables: ['user', 'contentType'], enabled: true },
  { id: 'ntf034', name: 'creator_milestone_push', category: 'social', channel: 'push', title: 'Milestone reached! 🎉', body: 'You just hit {{milestone}} followers! Keep going!', variables: ['milestone'], enabled: true },
  
  // System
  { id: 'ntf040', name: 'system_maintenance_push', category: 'system', channel: 'push', title: 'Scheduled maintenance', body: 'Azeebo+ will be under maintenance on {{date}} from {{startTime}} to {{endTime}}.', variables: ['date', 'startTime', 'endTime'], enabled: true },
  { id: 'ntf041', name: 'security_alert_push', category: 'system', channel: 'push', title: 'Security alert', body: 'A new device was used to sign in to your account. Was this you?', variables: [], enabled: true },
  { id: 'ntf042', name: 'app_update_push', category: 'system', channel: 'push', title: 'Update available', body: 'A new version of Azeebo+ is available. Update now for the latest features!', variables: [], enabled: true },
  { id: 'ntf043', name: 'terms_update_email', category: 'system', channel: 'email', title: 'Terms of service updated', body: 'We have updated our terms of service. Please review the changes.', variables: [], enabled: true },
  
  // Promotions
  { id: 'ntf050', name: 'promo_50off_push', category: 'promotion', channel: 'push', title: '50% off Premium!', body: 'Upgrade to Premium for just ₦{{price}}/month. Limited time offer!', variables: ['price'], enabled: true },
  { id: 'ntf051', name: 'referral_bonus_push', category: 'promotion', channel: 'push', title: 'Referral bonus! 🎁', body: 'Your friend {{friend}} signed up! You earned ₦{{bonus}} credit.', variables: ['friend', 'bonus'], enabled: true },
  { id: 'ntf052', name: 'weekend_special_push', category: 'promotion', channel: 'push', title: 'Weekend special 🎬', body: 'Stream {{count}} free movies this weekend only!', variables: ['count'], enabled: true },
  { id: 'ntf053', name: 'holiday_promo_push', category: 'promotion', channel: 'push', title: 'Holiday specials', body: 'Celebrate with us! {{offer}} for a limited time.', variables: ['offer'], enabled: true },
];

console.log(`Generated ${templates.length} notification templates`);
console.log('Categories:', Object.entries(
  templates.reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + 1 }), {} as Record<string, number>)
).map(([k, v]) => `${k}: ${v}`).join(', '));
console.log('Channels:', Object.entries(
  templates.reduce((acc, t) => ({ ...acc, [t.channel]: (acc[t.channel] || 0) + 1 }), {} as Record<string, number>)
).map(([k, v]) => `${k}: ${v}`).join(', '));

export default templates;
