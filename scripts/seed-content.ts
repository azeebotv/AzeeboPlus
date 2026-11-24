/**
 * Seed Content Script
 * Generates 200 content items across all universes
 *
 * Run: npx tsx scripts/seed-content.ts
 */

import { PrismaClient } from '@prisma/client';
import { seedImages, themedArt } from './seeders/seed-image-hosts.js';

const prisma = new PrismaClient();

const movies = [
  { title: 'Lionheart', genre: 'Drama', year: 2018, rating: 7.2 },
  { title: 'The Wedding Party', genre: 'Comedy', year: 2016, rating: 6.8 },
  { title: 'King of Boys', genre: 'Drama', year: 2018, rating: 7.5 },
  { title: 'October 1', genre: 'Drama', year: 2014, rating: 7.0 },
  { title: 'Living in Bondage', genre: 'Thriller', year: 1992, rating: 6.5 },
  { title: 'Figure 8', genre: 'Action', year: 2020, rating: 6.9 },
  { title: 'Bad Boys', genre: 'Comedy', year: 2011, rating: 6.7 },
  { title: 'The Mirror Boy', genre: 'Drama', year: 2011, rating: 6.3 },
  { title: 'Ije', genre: 'Drama', year: 2010, rating: 7.1 },
  { title: 'Helen', genre: 'Drama', year: 2020, rating: 7.3 },
  { title: 'Rattlesnake', genre: 'Thriller', year: 2020, rating: 7.0 },
  { title: 'The Bling Lagosians', genre: 'Comedy', year: 2019, rating: 6.4 },
  { title: 'Your Excellency', genre: 'Comedy', year: 2019, rating: 6.2 },
  { title: 'Love Is Yellow', genre: 'Romance', year: 2019, rating: 6.1 },
  { title: 'Cold Feet', genre: 'Romance', year: 2019, rating: 6.6 },
  { title: 'Elevator Baby', genre: 'Comedy', year: 2019, rating: 6.8 },
  { title: 'Son of Shaft', genre: 'Action', year: 2019, rating: 6.5 },
  { title: 'Knockout', genre: 'Action', year: 2011, rating: 6.3 },
  { title: 'Wives on Strike', genre: 'Comedy', year: 2016, rating: 6.7 },
  { title: "Okafor's Law", genre: 'Romance', year: 2017, rating: 6.4 },
];

const musicTracks = [
  { title: 'Ye', artist: 'Burna Boy', genre: 'Afrobeats', year: 2018 },
  { title: 'Essence', artist: 'Wizkid', genre: 'Afrobeats', year: 2020 },
  { title: 'Last Last', artist: 'Burna Boy', genre: 'Afrobeats', year: 2022 },
  { title: 'Peru', artist: 'Fireboy DML', genre: 'Afrobeats', year: 2021 },
  { title: 'Love Nwantiti', artist: 'CKay', genre: 'Afrobeats', year: 2021 },
  { title: 'Buga', artist: 'Kizz Daniel', genre: 'Afrobeats', year: 2022 },
  { title: 'Calm Down', artist: 'Rema', genre: 'Afrobeats', year: 2022 },
  { title: 'Starboy', artist: 'Wizkid', genre: 'Afrobeats', year: 2016 },
  { title: 'African Queen', artist: '2Face', genre: 'R&B', year: 2004 },
  { title: 'Ojuelegba', artist: 'Wizkid', genre: 'Afrobeats', year: 2014 },
  { title: 'Soke', artist: 'Burna Boy', genre: 'Afrobeats', year: 2018 },
  { title: 'Mad Over You', artist: 'Runtown', genre: 'Afrobeats', year: 2017 },
  { title: 'Jo', artist: 'P-Square', genre: 'Afrobeats', year: 2011 },
  { title: 'Chioma', artist: 'Rema', genre: 'Afrobeats', year: 2022 },
  { title: 'Demon', artist: 'Rema', genre: 'Afrobeats', year: 2022 },
  { title: 'Cough', artist: 'Oxlade', genre: 'Afrobeats', year: 2022 },
  { title: 'Arise', artist: 'Oxlade', genre: 'Afrobeats', year: 2020 },
  { title: 'Kilometre', artist: 'Burna Boy', genre: 'Afrobeats', year: 2021 },
  { title: 'Monalisa', artist: 'Lojay', genre: 'Afrobeats', year: 2021 },
  { title: 'Sungba', artist: 'Asake', genre: 'Afrobeats', year: 2022 },
];

const comedySpecials = [
  { title: 'African Comedy Hour', comedian: 'Basketmouth', year: 2020 },
  { title: 'Live in Lagos', comedian: 'Bovi', year: 2019 },
  { title: 'The Adekunle Show', comedian: 'Adekunle Kosoko', year: 2021 },
  { title: 'Uncle Koke', comedian: 'Kenny Blaq', year: 2020 },
  { title: 'Omo Trench', comedian: 'Broda Shaggi', year: 2021 },
  { title: 'Lagos Party', comedian: 'Gordons', year: 2019 },
  { title: 'Naija Jokes', comedian: 'Okey Bakassi', year: 2018 },
  { title: 'Stand Up Nigeria', comedian: 'Ali Baba', year: 2020 },
  { title: 'Comedy Night Live', comedian: 'MC Honest', year: 2021 },
  { title: 'Laughs & Likes', comedian: 'Josh2Funny', year: 2022 },
];

const realityShows = [
  { title: 'Big Brother Naija', season: 7, year: 2022 },
  { title: 'The Voice Nigeria', season: 4, year: 2021 },
  { title: 'Nigerian Idol', season: 7, year: 2022 },
  { title: 'Project Fame West Africa', season: 8, year: 2018 },
  { title: 'The Next Movie Star', season: 3, year: 2019 },
  { title: 'Gulder Ultimate Search', season: 12, year: 2021 },
  { title: 'Nigerian Chiefs', season: 1, year: 2022 },
  { title: 'Lagos Housewives', season: 2, year: 2022 },
  { title: 'Date Rush Nigeria', season: 3, year: 2021 },
  { title: 'Room 404', season: 1, year: 2022 },
];

const games = [
  { title: 'Naija Trivia', type: 'trivia', players: '2-4' },
  { title: 'Lagos Hustle', type: 'simulation', players: '1' },
  { title: 'Market Master', type: 'strategy', players: '2-6' },
  { title: 'Super Eagles Quiz', type: 'trivia', players: '2-8' },
  { title: 'Nollywood Legends', type: 'trivia', players: '2-4' },
  { title: 'Afrobeats Challenge', type: 'music', players: '2-8' },
  { title: 'Naija Words', type: 'word', players: '2-4' },
  { title: 'Lagos Traffic', type: 'puzzle', players: '1' },
  { title: 'Jollof Wars', type: 'cooking', players: '2-4' },
  { title: 'Nollywood Chess', type: 'board', players: '2' },
];

const lifestyleContent = [
  { title: 'Best Beaches in Lagos', category: 'travel', type: 'article' },
  { title: 'Top 10 Restaurants in Abuja', category: 'food', type: 'list' },
  { title: 'Fashion Week Lagos 2022', category: 'fashion', type: 'video' },
  { title: 'Nigerian Street Food Guide', category: 'food', type: 'article' },
  { title: 'Lagos Nightlife Guide', category: 'nightlife', type: 'article' },
  { title: 'Nollywood Fashion Trends', category: 'fashion', type: 'gallery' },
  { title: 'Best Gyms in Lagos', category: 'fitness', type: 'list' },
  { title: 'Nigerian Recipes', category: 'food', type: 'video' },
  { title: 'Lagos Events This Weekend', category: 'events', type: 'calendar' },
  { title: 'Nigerian Celebrities Home Tours', category: 'lifestyle', type: 'video' },
];

async function seedContent() {
  console.log('Seeding content...');

  let count = 0;

  // Seed movies
  for (const movie of movies) {
    await prisma.contentItem.create({
      data: {
        title: movie.title,
        type: 'movie',
        genre: movie.genre,
        description: `${movie.title} - A ${movie.genre.toLowerCase()} movie released in ${movie.year}`,
        year: movie.year,
        rating: movie.rating,
        thumbnailUrl: themedArt.poster('movie', movie.title),
        videoUrl: seedImages.storageMedia('video', 'sample.mp4'),
      },
    });
    count++;
  }
  console.log(`Seeded ${movies.length} movies`);

  // Seed music tracks
  for (const track of musicTracks) {
    await prisma.contentItem.create({
      data: {
        title: track.title,
        type: 'music',
        genre: track.genre,
        description: `${track.title} by ${track.artist}`,
        year: track.year,
        thumbnailUrl: themedArt.cover('music', track.title),
        audioUrl: seedImages.storageMedia('audio', 'sample.mp3'),
      },
    });
    count++;
  }
  console.log(`Seeded ${musicTracks.length} music tracks`);

  // Seed comedy specials
  for (const comedy of comedySpecials) {
    await prisma.contentItem.create({
      data: {
        title: comedy.title,
        type: 'comedy',
        genre: 'Comedy',
        description: `${comedy.title} by ${comedian}`,
        year: comedy.year,
        thumbnailUrl: themedArt.poster('comedy', comedy.title),
        videoUrl: seedImages.storageMedia('video', 'sample.mp4'),
      },
    });
    count++;
  }
  console.log(`Seeded ${comedySpecials.length} comedy specials`);

  // Seed reality shows
  for (const show of realityShows) {
    await prisma.contentItem.create({
      data: {
        title: `${show.title} Season ${show.season}`,
        type: 'reality',
        genre: 'Reality',
        description: `${show.title} Season ${show.season}`,
        year: show.year,
        thumbnailUrl: themedArt.poster('reality', show.title),
        videoUrl: seedImages.storageMedia('video', 'sample.mp4'),
      },
    });
    count++;
  }
  console.log(`Seeded ${realityShows.length} reality shows`);

  // Seed games
  for (const game of games) {
    await prisma.contentItem.create({
      data: {
        title: game.title,
        type: 'game',
        genre: 'Game',
        description: `${game.title} - A ${game.type} game for ${game.players} players`,
        thumbnailUrl: themedArt.cover('games', game.title),
      },
    });
    count++;
  }
  console.log(`Seeded ${games.length} games`);

  // Seed lifestyle content
  for (const item of lifestyleContent) {
    await prisma.contentItem.create({
      data: {
        title: item.title,
        type: 'lifestyle',
        genre: item.category,
        description: `${item.title} - ${item.category} content`,
        year: 2022,
        thumbnailUrl: themedArt.wide('lifestyle', item.title),
      },
    });
    count++;
  }
  console.log(`Seeded ${lifestyleContent.length} lifestyle items`);

  console.log(`Total content seeded: ${count}`);
}

async function main() {
  try {
    await seedContent();
    console.log('Content seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
