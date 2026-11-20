/**
 * Lifestyle Guides Seeder (itineraries, neighborhoods, partners, offers)
 *
 * Seeds the four 9TLIFE guide catalogs so the guide pages render real content:
 *   - GET /api/v1/lifestyle/itineraries        (web /lifestyle/itineraries)
 *   - GET /api/v1/lifestyle/itineraries/:id    (web /lifestyle/itineraries/[id])
 *   - GET /api/v1/lifestyle/neighborhoods(+:id)(web /lifestyle/neighborhoods*)
 *   - GET /api/v1/lifestyle/partners(+:id)     (web /lifestyle/partners*)
 *   - GET /api/v1/lifestyle/offers(+:id)       (web /lifestyle/offers*)
 *
 * Design notes:
 *  - All cities are Lagos with realistic places, addresses, and offers; offer
 *    validity is computed relative to "now" so the expiring-soon window
 *    (≤ 30 days, as used by the offers pages) stays meaningful on every re-run.
 *  - One draft itinerary, one draft neighborhood, one draft partner, and one
 *    expired offer exercise the published-only / active-unexpired filters.
 *  - Catalog entries upsert by unique slug; stops, places, and offers have no
 *    natural unique key, so they upsert by deterministic fixed ids.
 *  - Idempotent: safe to re-run.
 */

import { printCount } from './utils.js';
import { seedImages } from './seed-image-hosts.js';

const SEED_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'seed@azeebo.test',
  displayName: 'Seed Curator',
  role: 'user',
} as const;

/** Deterministic ids (uuid v4 shape) so child rows upsert safely on re-run. */
const ID = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

// ─── Itineraries ─────────────────────────────────────────────────────────────

interface SeedStop {
  id: number;
  name: string;
  description: string;
  duration: string;
  order: number;
}

interface SeedItinerary {
  id: number;
  title: string;
  slug: string;
  description: string;
  city: string;
  duration: string;
  rating: number;
  status?: 'draft';
  stops: SeedStop[];
}

const ITINERARIES: SeedItinerary[] = [
  {
    id: 1101,
    title: 'Lagos Island Heritage Walk',
    slug: 'lagos-island-heritage-walk',
    description:
      'A one-day walk through the colonial and cultural heart of Lagos Island — ' +
      'from the Brazilian-quarter shophouses to the museum\'s bronze heads and the ' +
      'energy of the markets that made Eko a trading city.',
    city: 'Lagos',
    duration: '1 day',
    rating: 4.7,
    stops: [
      {
        id: 1102,
        name: 'Freedom Park, Broad Street',
        description:
          'Former Broad Street Prison turned arts and heritage park. Start with ' +
          'coffee under the trees and catch the morning memorial wall.',
        duration: '1 hr',
        order: 1,
      },
      {
        id: 1103,
        name: 'Nigerian National Museum, Onikan',
        description:
          'Home of the Ife bronze heads and the Jemaa head. The gallery of ' +
          'traditional Nigerian craft alone justifies the walk.',
        duration: '2 hrs',
        order: 2,
      },
      {
        id: 1104,
        name: 'Tafawa Balewa Square',
        description:
          'The parade ground where independence was declared in 1960. The gate ' +
          'sculptures of white horses are a favourite photo stop.',
        duration: '45 mins',
        order: 3,
      },
      {
        id: 1105,
        name: 'Brazilian Quarter, Campos',
        description:
          'Whitewashed shophouses built by returning Afro-Brazilian families in ' +
          'the 1880s. End the walk with coconut water from a street vendor.',
        duration: '1.5 hrs',
        order: 4,
      },
    ],
  },
  {
    id: 1111,
    title: 'Lekki Leisure Weekend',
    slug: 'lekki-leisure-weekend',
    description:
      'A slow two-day loop of Lekki\'s best: the canopy walkway, West Africa\'s ' +
      'largest art gallery, and a sunset beach evening — with Sunday reserved ' +
      'for brunch and the craft market.',
    city: 'Lagos',
    duration: '2 days',
    rating: 4.8,
    stops: [
      {
        id: 1112,
        name: 'Lekki Conservation Centre Canopy Walk',
        description:
          'Africa\'s longest canopy walkway (401 m) over rainforest just minutes ' +
          'from the expressway. Go early — the monkeys keep business hours.',
        duration: '3 hrs',
        order: 1,
      },
      {
        id: 1113,
        name: 'Nike Art Gallery, Ikate',
        description:
          'Five floors of Nigerian art across every medium. Chief Nike Davies-Okundaye\'s ' +
          'gallery is free to enter and impossible to leave quickly.',
        duration: '2 hrs',
        order: 2,
      },
      {
        id: 1114,
        name: 'Elegushi Beach Sunset',
        description:
          'Private royal beach with horse rides, suya stands, and the best sunset ' +
          'in Lekki. Weekday evenings are calm; weekends are a carnival.',
        duration: '3 hrs',
        order: 3,
      },
      {
        id: 1115,
        name: 'Lekki Arts & Crafts Market',
        description:
          'Carvers, beadworkers, and fabric sellers from across West Africa. ' +
          'Haggling is expected — start at half the asking price.',
        duration: '2 hrs',
        order: 4,
      },
    ],
  },
  {
    id: 1121,
    title: 'Mainland Food Crawl',
    slug: 'mainland-food-crawl',
    description:
      'Eat the mainland the way Lagosians do: amala and ewedu in Surulere, ' +
      'peppered snail in Yaba, and the immortal combination of agege bread ' +
      'and akara to finish.',
    city: 'Lagos',
    duration: '1 day',
    rating: 4.6,
    stops: [
      {
        id: 1122,
        name: 'Mama Oyo Amala Joint, Surulere',
        description:
          'The classic amala, ewedu, and gbegiri plate. Order "ororo" (oil) on ' +
          'the side if you know what is good for you.',
        duration: '1.5 hrs',
        order: 1,
      },
      {
        id: 1123,
        name: 'Tejuosho Market Spice Run',
        description:
          'Stock up on dry pepper blends, smoked crayfish, and locust beans. ' +
          'Bring your own container — the traders appreciate it.',
        duration: '1 hr',
        order: 2,
      },
      {
        id: 1124,
        name: 'Peppered Snail Street, Yaba',
        description:
          'Evening snail vendors with the good scotch bonnet. Cash only, ' +
          'queues are a compliment.',
        duration: '45 mins',
        order: 3,
      },
      {
        id: 1125,
        name: 'Agege Bread & Akara Finale',
        description:
          'The sacred pairing, bought hot at a roadside stand as the crawl ' +
          'winds down. No substitutions accepted.',
        duration: '30 mins',
        order: 4,
      },
    ],
  },
  {
    id: 1131,
    title: 'Badagry Slave-Route Expedition',
    slug: 'badagry-slave-route-expedition',
    description:
      'DRAFT — full-day expedition to Badagry\'s heritage sites: the Mobee ' +
      'baracoon, the memory well, and the boat ride to the Point of No Return. ' +
      'Pending guide-partner confirmation before publish.',
    city: 'Lagos',
    duration: '1 day',
    rating: 0,
    status: 'draft',
    stops: [
      {
        id: 1132,
        name: 'Mobee Royal Family Baracoon',
        description: 'Original slave-holding cell with descendants as guides.',
        duration: '2 hrs',
        order: 1,
      },
    ],
  },
];

// ─── Neighborhoods ───────────────────────────────────────────────────────────

interface SeedPlace {
  id: number;
  name: string;
  category: string;
  rating: number;
  address?: string;
}

interface SeedNeighborhood {
  id: number;
  name: string;
  slug: string;
  city: string;
  description: string;
  status?: 'draft';
  places: SeedPlace[];
}

const NEIGHBORHOODS: SeedNeighborhood[] = [
  {
    id: 1201,
    name: 'Victoria Island',
    slug: 'victoria-island',
    city: 'Lagos',
    description:
      'The business capital of Lagos by day and its lounge-and-lagoon playground ' +
      'by night. Art centres, private beaches, and the highest density of good ' +
      'restaurants in the city.',
    places: [
      {
        id: 1202,
        name: 'Terra Kulture',
        category: 'Arts Centre',
        rating: 4.5,
        address: 'Tiamiyu Savage St, Victoria Island',
      },
      {
        id: 1203,
        name: 'Landmark Beach',
        category: 'Beach',
        rating: 4.4,
        address: 'Water Corporation Dr, Victoria Island',
      },
      {
        id: 1204,
        name: 'Lagoon Front Café',
        category: 'Café',
        rating: 4.2,
        address: 'Akin Adesola St, Victoria Island',
      },
    ],
  },
  {
    id: 1211,
    name: 'Lekki',
    slug: 'lekki',
    city: 'Lagos',
    description:
      'Lagos\'s long peninsula of estates, art, and coastline. Home to the ' +
      'conservation centre, the biggest art gallery in West Africa, and a beach ' +
      'scene for every budget.',
    places: [
      {
        id: 1212,
        name: 'Lekki Conservation Centre',
        category: 'Nature Reserve',
        rating: 4.6,
        address: 'Lekki-Epe Expressway, Lekki',
      },
      {
        id: 1213,
        name: 'Nike Art Gallery',
        category: 'Gallery',
        rating: 4.7,
        address: 'Elegushi Beach Rd, Ikate, Lekki',
      },
      {
        id: 1214,
        name: 'Elegushi Beach',
        category: 'Beach',
        rating: 4.2,
        address: 'Lekki Phase 1, Lekki',
      },
      {
        id: 1215,
        name: 'Lekki Arts & Crafts Market',
        category: 'Market',
        rating: 4.0,
        address: 'Jakande First Gate, Lekki',
      },
    ],
  },
  {
    id: 1221,
    name: 'Yaba',
    slug: 'yaba',
    city: 'Lagos',
    description:
      'The tech-and-campus heart of the mainland — Lagos\'s own Silicon Lagoon. ' +
      'Street food, maker markets, and the floating community of Makoko next door.',
    places: [
      {
        id: 1222,
        name: 'Makoko Floating Community',
        category: 'Landmark',
        rating: 4.4,
        address: 'Makoko, Yaba',
      },
      {
        id: 1223,
        name: 'Tejuosho Market',
        category: 'Market',
        rating: 3.9,
        address: 'Tejuosho Rd, Yaba',
      },
      {
        id: 1224,
        name: 'Spice Route Yaba',
        category: 'Restaurant',
        rating: 4.1,
        address: 'Herbert Macaulay Way, Yaba',
      },
      {
        id: 1225,
        name: 'Yaba Record Den',
        category: 'Record Store',
        rating: 4.5,
        address: 'Alagomeji, Yaba',
      },
    ],
  },
  {
    id: 1231,
    name: 'Ikoyi',
    slug: 'ikoyi',
    city: 'Lagos',
    description:
      'Old-money Ikoyi: leafy senior-barracks streets turned gallery district, ' +
      'with the city\'s best bookshop-café and the park Lagos runner goes to.',
    places: [
      {
        id: 1232,
        name: 'Jazzhole',
        category: 'Bookstore & Café',
        rating: 4.5,
        address: 'Awolowo Rd, Ikoyi',
      },
      {
        id: 1233,
        name: 'Ikoyi Park',
        category: 'Park',
        rating: 4.3,
        address: 'Bourdillon Rd, Ikoyi',
      },
      {
        id: 1234,
        name: 'Falomo Shopping Complex',
        category: 'Market',
        rating: 3.8,
        address: 'Awolowo Rd, Falomo, Ikoyi',
      },
    ],
  },
  {
    id: 1241,
    name: 'Badagry',
    slug: 'badagry',
    city: 'Lagos',
    description:
      'DRAFT — coastal border town with Nigeria\'s most important (and least ' +
      'visited) heritage corridor. Awaiting editorial photos before publish.',
    status: 'draft',
    places: [
      {
        id: 1242,
        name: 'First Storey Building',
        category: 'Heritage Site',
        rating: 4.1,
        address: 'Marina Rd, Badagry',
      },
    ],
  },
];

// ─── Partners + Offers ───────────────────────────────────────────────────────

interface SeedOffer {
  id: number;
  title: string;
  description: string;
  discount: string;
  category: string;
  terms: string[];
  /** Days from "now" — computed at seed time so expiry windows stay live. */
  validInDays: number;
  status?: 'expired';
}

interface SeedPartner {
  id: number;
  name: string;
  slug: string;
  category: string;
  city: string;
  description: string;
  rating: number;
  address: string;
  phone: string;
  status?: 'draft';
  offers: SeedOffer[];
}

const COMMON_TERMS = ['Present your Azeebo profile at entry', 'Cannot be combined with other promos'];

const PARTNERS: SeedPartner[] = [
  {
    id: 1301,
    name: 'Nkoyo Wellness Spa',
    slug: 'nkoyo-wellness-spa',
    category: 'Wellness',
    city: 'Lagos',
    description:
      'Calabash-bar massage suites and shea-butter treatments in a quiet VI ' +
      'courtyard. The couples room books out a week ahead in December.',
    rating: 4.6,
    address: '14b Akin Adesola St, Victoria Island, Lagos',
    phone: '+234 801 234 5678',
    offers: [
      {
        id: 1302,
        title: '20% Off Couples Massage',
        description:
          'Ninety-minute deep-tissue or Swedish session for two, with zobo ' +
          'service in the private courtyard afterwards.',
        discount: '20% OFF',
        category: 'Wellness',
        terms: [...COMMON_TERMS, 'Book at least 48 hours ahead'],
        validInDays: 45,
      },
      {
        id: 1303,
        title: 'Midweek Shea Glow Facial',
        description: 'Monday–Wednesday facial special using unrefined Nigerian shea.',
        discount: '15% OFF',
        category: 'Wellness',
        terms: [...COMMON_TERMS, 'Valid Mon–Wed only'],
        validInDays: 10,
      },
    ],
  },
  {
    id: 1311,
    name: 'Sandy Hands Café',
    slug: 'sandy-hands-cafe',
    category: 'Dining',
    city: 'Lagos',
    description:
      'Beachfront brunch spot in Lekki known for plantain waffles, chilli ' +
      'tiger prawns, and cold zobo on tap.',
    rating: 4.4,
    address: 'Lekki Phase 1 Waterfront, Lagos',
    phone: '+234 802 345 6789',
    offers: [
      {
        id: 1312,
        title: 'Free Zobo With Any Brunch Platter',
        description: 'One complimentary carafe of house zobo per brunch table, all weekend.',
        discount: 'FREE DRINK',
        category: 'Dining',
        terms: [...COMMON_TERMS, 'Weekends only', 'One carafe per table'],
        validInDays: 30,
      },
    ],
  },
  {
    id: 1321,
    name: 'Lagos Ferry Co.',
    slug: 'lagos-ferry-co',
    category: 'Transport',
    city: 'Lagos',
    description:
      'Scheduled passenger ferries crossing the Five Cowrie Creek between Falomo, ' +
      'Victoria Island, and Ikoyi — the fastest view of the Lagos skyline.',
    rating: 4.2,
    address: 'Falomo Jetty, Awolowo Rd, Ikoyi, Lagos',
    phone: '+234 803 456 7890',
    offers: [
      {
        id: 1322,
        title: 'Half-Price Saturday Creek Crossings',
        description:
          'Every Saturday, all Falomo ↔ VI crossings run at half fare. Perfect ' +
          'for the skyline-photo loop.',
        discount: '50% OFF',
        category: 'Transport',
        terms: ['Saturdays only', 'Standard safety rules apply'],
        validInDays: 60,
      },
      {
        id: 1323,
        title: 'Detty December Early-Bird Pass',
        description: 'Ten-ride creek pass for the December season at last season\'s prices.',
        discount: 'BUNDLE SAVE',
        category: 'Transport',
        terms: ['Limited allotment', 'Pass activates on first ride'],
        validInDays: 2,
        status: 'expired',
      },
    ],
  },
  {
    id: 1331,
    name: 'Eko Art Mart',
    slug: 'eko-art-mart',
    category: 'Retail',
    city: 'Lagos',
    description:
      'Family-run framing and print shop in Ikoyi sourcing directly from Lagos ' +
    'studios. Custom framing while you wait on light pieces.',
    rating: 4.3,
    address: 'Awolowo Rd, SW Ikoyi, Lagos',
    phone: '+234 804 567 8901',
    offers: [
      {
        id: 1332,
        title: '10% Off Frame Bundles',
        description: 'Any three framed prints from the mart\'s gallery wall, ten percent off.',
        discount: '10% OFF',
        category: 'Retail',
        terms: [...COMMON_TERMS, 'Three items minimum'],
        validInDays: 20,
      },
    ],
  },
  {
    id: 1341,
    name: 'Gidi Cycle Tours',
    slug: 'gidi-cycle-tours',
    category: 'Experiences',
    city: 'Lagos',
    description:
      'DRAFT — guided dawn bicycle tours of the Eko Atlantic boardwalk. ' +
      'Insurance partner pending before publish.',
    rating: 0,
    address: 'Eko Atlantic Boardwalk Gate 2, Lagos',
    phone: '+234 805 678 9012',
    status: 'draft',
    offers: [
      {
        id: 1342,
        title: 'Founding-Rider Discount',
        description: 'First fifty riders ride their second tour free.',
        discount: '1 FREE RIDE',
        category: 'Experiences',
        terms: ['Launch offer', 'Helmet included'],
        validInDays: 90,
      },
    ],
  },
];

// ─── Client ──────────────────────────────────────────────────────────────────

let PrismaClient: new (args?: unknown) => unknown;

type GuideClient = {
  user: { upsert: (args: unknown) => Promise<{ id: string }> };
  itinerary: {
    upsert: (args: unknown) => Promise<{ id: string }>;
    count: (args?: unknown) => Promise<number>;
  };
  itineraryStop: { upsert: (args: unknown) => Promise<{ id: string }> };
  neighborhood: {
    upsert: (args: unknown) => Promise<{ id: string }>;
    count: (args?: unknown) => Promise<number>;
  };
  neighborhoodPlace: { upsert: (args: unknown) => Promise<{ id: string }> };
  partner: {
    upsert: (args: unknown) => Promise<{ id: string }>;
    count: (args?: unknown) => Promise<number>;
  };
  partnerOffer: { upsert: (args: unknown) => Promise<{ id: string }> };
  $disconnect: () => Promise<void>;
};

async function getClient(): Promise<GuideClient> {
  try {
    const mod = await import(
      '../../services/universes/lifestyle-service/src/prisma/client/index.js'
    );
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  const dbUrl =
    process.env.LIFESTYLE_DATABASE_URL ||
    'postgresql://azeebo:azeebo@localhost:5432/azeebo_lifestyle?schema=public';
  process.env.DATABASE_URL = dbUrl;
  return new (PrismaClient as new (opts?: unknown) => GuideClient)({
    datasources: { db: { url: dbUrl } },
  });
}

// ─── Seeder ──────────────────────────────────────────────────────────────────

export async function seedLifestyleGuidesService(dryRun = false): Promise<number> {
  const stopCount = ITINERARIES.reduce((n, i) => n + i.stops.length, 0);
  const placeCount = NEIGHBORHOODS.reduce((n, h) => n + h.places.length, 0);
  const offerCount = PARTNERS.reduce((n, p) => n + p.offers.length, 0);
  const total = ITINERARIES.length + stopCount + NEIGHBORHOODS.length + placeCount + PARTNERS.length + offerCount;

  if (dryRun) {
    console.log(
      `  [DRY RUN] Would upsert seed user + ` +
        `${ITINERARIES.length} itineraries (${stopCount} stops), ` +
        `${NEIGHBORHOODS.length} neighborhoods (${placeCount} places), ` +
        `${PARTNERS.length} partners (${offerCount} offers)`
    );
    return total;
  }

  const prisma = await getClient();
  try {
    await prisma.user.upsert({
      where: { id: SEED_USER.id },
      create: { ...SEED_USER },
      update: {},
    });

    // Itineraries + ordered stops
    printCount('Itineraries', ITINERARIES.length);
    for (const it of ITINERARIES) {
      await prisma.itinerary.upsert({
        where: { slug: it.slug },
        create: {
          title: it.title,
          slug: it.slug,
          description: it.description,
          city: it.city,
          duration: it.duration,
          rating: it.rating,
          status: it.status ?? 'published',
          createdById: SEED_USER.id,
        },
        update: {
          description: it.description,
          city: it.city,
          duration: it.duration,
          rating: it.rating,
          status: it.status ?? 'published',
        },
      });
    }
    printCount('Itinerary Stops', stopCount);
    for (const it of ITINERARIES) {
      const saved = (await prisma.itinerary.upsert({
        where: { slug: it.slug },
        create: { title: it.title, slug: it.slug, description: it.description, city: it.city, duration: it.duration, rating: it.rating, status: it.status ?? 'published', createdById: SEED_USER.id },
        update: {},
      })) as { id: string };
      for (const s of it.stops) {
        await prisma.itineraryStop.upsert({
          where: { id: ID(s.id) },
          create: {
            id: ID(s.id),
            itineraryId: saved.id,
            name: s.name,
            description: s.description,
            duration: s.duration,
            order: s.order,
          },
          update: {
            itineraryId: saved.id,
            name: s.name,
            description: s.description,
            duration: s.duration,
            order: s.order,
          },
        });
      }
    }

    // Neighborhoods + places
    printCount('Neighborhoods', NEIGHBORHOODS.length);
    for (const h of NEIGHBORHOODS) {
      await prisma.neighborhood.upsert({
        where: { slug: h.slug },
        create: {
          name: h.name,
          slug: h.slug,
          city: h.city,
          description: h.description,
          image: seedImages.picsum(h.slug, 800, 600),
          status: h.status ?? 'published',
          createdById: SEED_USER.id,
        },
        update: {
          description: h.description,
          city: h.city,
          image: seedImages.picsum(h.slug, 800, 600),
          status: h.status ?? 'published',
        },
      });
    }
    printCount('Neighborhood Places', placeCount);
    for (const h of NEIGHBORHOODS) {
      const saved = (await prisma.neighborhood.upsert({
        where: { slug: h.slug },
        create: {
          name: h.name, slug: h.slug, city: h.city, description: h.description,
          image: seedImages.picsum(h.slug, 800, 600), status: h.status ?? 'published',
          createdById: SEED_USER.id,
        },
        update: {},
      })) as { id: string };
      for (const p of h.places) {
        await prisma.neighborhoodPlace.upsert({
          where: { id: ID(p.id) },
          create: {
            id: ID(p.id),
            neighborhoodId: saved.id,
            name: p.name,
            category: p.category,
            rating: p.rating,
            address: p.address,
          },
          update: {
            neighborhoodId: saved.id,
            name: p.name,
            category: p.category,
            rating: p.rating,
            address: p.address,
          },
        });
      }
    }

    // Partners + offers (validUntil computed relative to now)
    printCount('Partners', PARTNERS.length);
    for (const p of PARTNERS) {
      await prisma.partner.upsert({
        where: { slug: p.slug },
        create: {
          name: p.name,
          slug: p.slug,
          category: p.category,
          city: p.city,
          description: p.description,
          rating: p.rating,
          address: p.address,
          phone: p.phone,
          status: p.status ?? 'published',
          createdById: SEED_USER.id,
        },
        update: {
          description: p.description,
          category: p.category,
          city: p.city,
          rating: p.rating,
          address: p.address,
          phone: p.phone,
          status: p.status ?? 'published',
        },
      });
    }
    printCount('Partner Offers', offerCount);
    for (const p of PARTNERS) {
      const saved = (await prisma.partner.upsert({
        where: { slug: p.slug },
        create: {
          name: p.name, slug: p.slug, category: p.category, city: p.city,
          description: p.description, rating: p.rating, address: p.address,
          phone: p.phone, status: p.status ?? 'published', createdById: SEED_USER.id,
        },
        update: {},
      })) as { id: string };
      for (const o of p.offers) {
        const validUntil = daysFromNow(o.validInDays);
        await prisma.partnerOffer.upsert({
          where: { id: ID(o.id) },
          create: {
            id: ID(o.id),
            partnerId: saved.id,
            title: o.title,
            description: o.description,
            discount: o.discount,
            category: o.category,
            terms: o.terms,
            validUntil,
            status: o.status ?? 'active',
          },
          update: {
            partnerId: saved.id,
            title: o.title,
            description: o.description,
            discount: o.discount,
            category: o.category,
            terms: o.terms,
            validUntil,
            status: o.status ?? 'active',
          },
        });
      }
    }

    console.log(
      `  → lifestyle guides: ` +
        `${ITINERARIES.length} itineraries / ${NEIGHBORHOODS.length} neighborhoods / ` +
        `${PARTNERS.length} partners seeded (incl. draft rows exercising the published-only filters)`
    );
    return total;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow standalone execution: pnpm tsx scripts/seeders/lifestyle-guides-seeder.ts
if (
  process.argv[1]?.endsWith('lifestyle-guides-seeder.ts') ||
  process.argv[1]?.endsWith('lifestyle-guides-seeder.js')
) {
  const dryRun = process.argv.includes('--dry-run');
  seedLifestyleGuidesService(dryRun)
    .then((count) => {
      console.log(`✓ lifestyle-guides seeder ${dryRun ? '(dry run)' : 'complete'}: ${count} rows`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ lifestyle-guides seeder failed:', error);
      process.exit(1);
    });
}
