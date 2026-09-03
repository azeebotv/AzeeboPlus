/**
 * Seed script for creator content
 * Generates 100 creator posts and profiles
 */

interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  category: string;
  verified: boolean;
  followerCount: number;
  contentCount: number;
  totalEarnings: number;
  joinedAt: Date;
}

interface CreatorPost {
  id: string;
  creatorId: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'live';
  title: string;
  description: string;
  mediaUrl: string;
  thumbnailUrl: string;
  duration?: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  monetized: boolean;
  price?: number;
  publishedAt: Date;
}

const CREATOR_NAMES = [
  'DJ Spinall', 'Burna Boy', 'Tiwa Savage', 'Wizkid', 'Davido',
  'Naira Marley', 'Rema', 'Fireboy DML', 'Tems', 'Ayra Starr',
  'Oxlade', 'Joeboy', 'BNXN', 'Victony', 'Asake',
  'Don Jazzy', 'Olamide', 'Phyno', 'Flavour', '2Baba',
  'Lil Kesh', 'Zlatan', 'Niniola', 'Yemi Alade', 'Seyi Shay',
  'Tekno', 'Mr Eazi', 'Sarkodie', 'Shatta Wale', 'Stonebwoy',
];

const CATEGORIES = ['music', 'comedy', 'lifestyle', 'education', 'entertainment', 'gaming', 'cooking', 'fitness'];

function generateCreator(index: number): CreatorProfile {
  const name = CREATOR_NAMES[index % CREATOR_NAMES.length];
  return {
    id: `cre${String(index + 1).padStart(4, '0')}`,
    userId: `usr${String(index + 1).padStart(4, '0')}`,
    displayName: name,
    bio: `Content creator specializing in ${CATEGORIES[index % CATEGORIES.length]}. Follow for amazing content!`,
    avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + index}?w=200&h=200&fit=crop`,
    bannerUrl: `https://images.unsplash.com/photo-${1500000000000 + index}?w=1200&h=400&fit=crop`,
    category: CATEGORIES[index % CATEGORIES.length],
    verified: Math.random() > 0.7,
    followerCount: Math.floor(1000 + Math.random() * 500000),
    contentCount: Math.floor(5 + Math.random() * 100),
    totalEarnings: Math.floor(10000 + Math.random() * 5000000),
    joinedAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)),
  };
}

function generatePost(index: number, creatorId: string): CreatorPost {
  const type = (['video', 'audio', 'image', 'text', 'live'] as const)[Math.floor(Math.random() * 5)];
  const daysAgo = Math.floor(Math.random() * 180);
  const publishedAt = new Date();
  publishedAt.setDate(publishedAt.getDate() - daysAgo);

  return {
    id: `post${String(index + 1).padStart(6, '0')}`,
    creatorId,
    type,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} post #${index + 1}`,
    description: `Amazing ${type} content from our creators. Check it out!`,
    mediaUrl: `https://storage.azeebo.com/media/${type}/${index + 1}`,
    thumbnailUrl: `https://storage.azeebo.com/thumbnails/${index + 1}.jpg`,
    duration: type === 'video' || type === 'audio' ? Math.floor(60 + Math.random() * 3600) : undefined,
    views: Math.floor(100 + Math.random() * 50000),
    likes: Math.floor(10 + Math.random() * 5000),
    comments: Math.floor(5 + Math.random() * 500),
    shares: Math.floor(1 + Math.random() * 200),
    monetized: Math.random() > 0.6,
    price: Math.random() > 0.6 ? Math.floor(100 + Math.random() * 2000) : undefined,
    publishedAt,
  };
}

const creators = Array.from({ length: 30 }, (_, i) => generateCreator(i));
const posts = Array.from({ length: 100 }, (_, i) => {
  const creator = creators[i % creators.length];
  return generatePost(i, creator.id);
});

console.log(`Generated ${creators.length} creators`);
console.log(`Generated ${posts.length} posts`);
console.log('Total views:', posts.reduce((sum, p) => sum + p.views, 0).toLocaleString());
console.log('Monetized posts:', posts.filter(p => p.monetized).length);

export { creators, posts };
export default { creators, posts };
