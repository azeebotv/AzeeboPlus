'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface Place {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  rating: number;
  distance: string;
  isOpen: boolean;
  priceRange: string;
}

export default function TonightPage(): React.JSX.Element {
  const {
    data: places,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['9tlife', 'tonight'],
    queryFn: async () => {
      const res = await apiFetch<Place[]>('/v1/lifestyle/tonight');
      return res.success ? res.data : null;
    },
  });

  if (error) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load tonight's picks. Please try again." />
        </main>
        <AppFooter />
      </>
    );
  }

  const categories =
    places?.reduce(
      (acc, place) => {
        if (!acc[place.category]) acc[place.category] = [];
        acc[place.category].push(place);
        return acc;
      },
      {} as Record<string, Place[]>
    ) ?? {};

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Tonight</h1>
              <p className="text-gray-400 mt-1">What&apos;s happening tonight near you</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/lifestyle/tonight"
                className="bg-emerald-600 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Tonight
              </Link>
              <Link
                href="/lifestyle/weekend"
                className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                Weekend
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : Object.keys(categories).length > 0 ? (
            Object.entries(categories).map(([category, items]) => (
              <section key={category} className="mb-10">
                <h2 className="text-xl font-bold mb-4">{category}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map((place) => (
                    <Link key={place.id} href={`/lifestyle/places/${place.id}`} className="group">
                      <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-500 transition">
                        {place.imageUrl ? (
                          <img
                            src={place.imageUrl}
                            alt={place.name}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-emerald-900/50 to-gray-800" />
                        )}
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold group-hover:text-emerald-400 transition">
                              {place.name}
                            </h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${place.isOpen ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}
                            >
                              {place.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {place.distance} · {place.priceRange}
                          </p>
                          <p className="text-sm text-yellow-400 mt-1">{place.rating}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">No places available for tonight. Check back later!</p>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
