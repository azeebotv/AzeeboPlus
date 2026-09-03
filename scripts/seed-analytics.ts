/**
 * Seed script for usage analytics
 * Generates 30 days of realistic platform usage data
 */

interface DailyMetrics {
  date: string;
  dau: number;
  newUsers: number;
  sessions: number;
  avgSessionDuration: number;
  pageViews: number;
  contentViews: number;
  streams: number;
  downloads: number;
  transactions: number;
  revenue: number;
  topContent: { id: string; views: number }[];
  topUniverses: { universe: string; views: number }[];
  deviceBreakdown: { web: number; ios: number; android: number };
  geoBreakdown: { nigeria: number; ghana: number; uk: number; us: number; other: number };
}

function generateDailyMetrics(daysAgo: number): DailyMetrics {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  // Weekend patterns
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendMultiplier = isWeekend ? 1.3 : 1.0;
  
  // Growth trend
  const growthFactor = 1 + (30 - daysAgo) * 0.008;
  
  const baseDAU = Math.floor(12000 * weekendMultiplier * growthFactor);
  const dau = baseDAU + Math.floor(Math.random() * 2000 - 1000);

  return {
    date: date.toISOString().split('T')[0],
    dau,
    newUsers: Math.floor(dau * 0.08 * (0.8 + Math.random() * 0.4)),
    sessions: Math.floor(dau * (1.5 + Math.random() * 0.5)),
    avgSessionDuration: Math.floor(8 + Math.random() * 15) * 60, // seconds
    pageViews: Math.floor(dau * (4 + Math.random() * 3)),
    contentViews: Math.floor(dau * (2 + Math.random() * 2)),
    streams: Math.floor(dau * (1.2 + Math.random() * 0.8)),
    downloads: Math.floor(dau * 0.05),
    transactions: Math.floor(dau * 0.12 * (0.7 + Math.random() * 0.6)),
    revenue: Math.floor(dau * 0.12 * (150 + Math.random() * 200)),
    topContent: [
      { id: 'cnt0001', views: Math.floor(500 + Math.random() * 1000) },
      { id: 'cnt0015', views: Math.floor(400 + Math.random() * 800) },
      { id: 'cnt0042', views: Math.floor(300 + Math.random() * 600) },
    ],
    topUniverses: [
      { universe: 'music', views: Math.floor(dau * 0.4) },
      { universe: 'movies', views: Math.floor(dau * 0.3) },
      { universe: 'comedy', views: Math.floor(dau * 0.15) },
      { universe: 'reality', views: Math.floor(dau * 0.1) },
      { universe: 'games', views: Math.floor(dau * 0.05) },
    ],
    deviceBreakdown: {
      web: Math.floor(dau * 0.35),
      ios: Math.floor(dau * 0.35),
      android: Math.floor(dau * 0.30),
    },
    geoBreakdown: {
      nigeria: Math.floor(dau * 0.65),
      ghana: Math.floor(dau * 0.12),
      uk: Math.floor(dau * 0.08),
      us: Math.floor(dau * 0.07),
      other: Math.floor(dau * 0.08),
    },
  };
}

const analytics = Array.from({ length: 30 }, (_, i) => generateDailyMetrics(i));

const totalDAU = analytics.reduce((sum, d) => sum + d.dau, 0);
const avgDAU = Math.floor(totalDAU / analytics.length);
const totalRevenue = analytics.reduce((sum, d) => sum + d.revenue, 0);
const totalStreams = analytics.reduce((sum, d) => sum + d.streams, 0);

console.log(`Generated ${analytics.length} days of analytics`);
console.log(`Average DAU: ${avgDAU.toLocaleString()}`);
console.log(`Total revenue: ₦${totalRevenue.toLocaleString()}`);
console.log(`Total streams: ${totalStreams.toLocaleString()}`);

export default analytics;
