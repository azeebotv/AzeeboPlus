'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients, universeColors } from '@azeebo/design-tokens';
import Link from 'next/link';

const mockEvents = [
  {
    id: '1',
    title: 'Lagos Fashion Week',
    description: 'Experience the vibrant fashion scene of Lagos with top African designers',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fashion%20runway%20show%20with%20african%20designers%20colorful%20outfits&image_size=landscape_16_9',
    date: 'Dec 15-20, 2026',
    location: 'Lagos, Nigeria',
    attendees: 5000,
    category: 'Fashion',
  },
  {
    id: '2',
    title: 'Abuja Food Festival',
    description: 'Taste the best culinary creations from across Africa',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=food%20festival%20with%20variety%20of%20african%20dishes%20colorful&image_size=landscape_16_9',
    date: 'Jan 5-8, 2027',
    location: 'Abuja, Nigeria',
    attendees: 3200,
    category: 'Food',
  },
  {
    id: '3',
    title: 'Nairobi Music Festival',
    description: 'Live performances from top African artists',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=music%20concert%20festival%20with%20crowd%20and%20stage%20lights&image_size=landscape_16_9',
    date: 'Feb 10-14, 2027',
    location: 'Nairobi, Kenya',
    attendees: 8000,
    category: 'Music',
  },
];

const mockCityGuides = [
  {
    id: '1',
    city: 'Lagos',
    country: 'Nigeria',
    description: 'The commercial capital of Nigeria',
    attractions: 45,
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=lagos%20nigeria%20skyline%20modern%20cityscape%20vibrant&image_size=landscape_16_9',
  },
  {
    id: '2',
    city: 'Johannesburg',
    country: 'South Africa',
    description: 'The city of gold',
    attractions: 38,
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=johannesburg%20south%20africa%20city%20skyline%20modern%20buildings&image_size=landscape_16_9',
  },
  {
    id: '3',
    city: 'Accra',
    country: 'Ghana',
    description: 'The capital city of Ghana',
    attractions: 28,
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=accra%20ghana%20cityscape%20coastal%20modern%20buildings&image_size=landscape_16_9',
  },
];

export default function LifestylePage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState(mockEvents);
  const [cityGuides, setCityGuides] = useState(mockCityGuides);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: universeColors.lifestyle.primary }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Azeebo+</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Lifestyle'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Lifestyle' ? '/lifestyle' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Lifestyle' ? universeColors.lifestyle.primary : colors.text.secondary }}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar size="medium" fallback={user?.name?.charAt(0) || 'U'} />
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{user?.name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="500px" className="w-full" />
        ) : (
          <div className="relative h-[500px]">
            <img
              src={events[0].thumbnail}
              alt={events[0].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: `${universeColors.lifestyle.primary}30`, color: universeColors.lifestyle.primary }}>
                Lifestyle
              </span>
              <h2 className="text-4xl font-bold text-white mb-2">{events[0].title}</h2>
              <p className="text-gray-300 text-lg mb-6 max-w-2xl">{events[0].description}</p>
              <div className="flex items-center gap-4">
                <Button size="lg" style={{ backgroundColor: universeColors.lifestyle.primary }}>
                  <span>🎟️</span> Get Tickets
                </Button>
                <Button size="lg" variant="secondary">
                  <span>📍</span> View Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Upcoming Events
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              Discover exciting lifestyle events across Africa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} padding="none" className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
              <div className="relative">
                <img src={event.thumbnail} alt={event.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge variant="outline" className="mb-2">{event.category}</Badge>
                  <h3 className="text-xl font-bold text-white">{event.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-3">{event.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>📅</span>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>👥</span>
                    <span>{event.attendees.toLocaleString()} attending</span>
                  </div>
                </div>
                <Button variant="primary" className="w-full" style={{ backgroundColor: universeColors.lifestyle.primary }}>
                  Get Tickets
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* City Guides */}
      <section className="py-12" style={{ backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
                City Guides
              </h2>
              <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
                Explore the best of African cities
              </p>
            </div>
            <Button variant="ghost">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cityGuides.map((city) => (
              <Card key={city.id} padding="none" className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img src={city.thumbnail} alt={city.city} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{city.city}</h3>
                    <p className="text-sm text-gray-300">{city.country}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-400 mb-3">{city.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <span>🏛️</span>
                    <span>{city.attractions} attractions</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Explore City
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Azeebo+</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['About', 'Careers', 'Press'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Help</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Support', 'FAQ', 'Contact'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Legal</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Terms', 'Privacy', 'Cookies'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Connect</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Twitter', 'Instagram', 'Facebook'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm" style={{ borderColor: colors.border.light, color: colors.text.tertiary }}>
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
