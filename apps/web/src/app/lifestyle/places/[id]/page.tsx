'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface PlaceDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  address: string;
  phone?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  hours: string;
  priceRange: string;
  offers: { id: string; title: string; description: string; discount?: string }[];
  partnerVerified: boolean;
}

export default function PlaceDetailPage(): React.JSX.Element {
  const params = useParams();
  const placeId = params.id as string;

  const {
    data: place,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['9tlife', 'place', placeId],
    queryFn: async () => {
      const res = await apiFetch<PlaceDetail>(`/v1/lifestyle/places/${placeId}`);
      return res.success ? res.data : null;
    },
  });

  if (error) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load place details. Please try again." />
        </main>
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white">
        {isLoading ? (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : place ? (
          <>
            <div className="relative h-[40vh] bg-gradient-to-b from-emerald-900/40 to-gray-950">
              {place.imageUrl && (
                <img
                  src={place.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 pb-8">
                <Link
                  href="/lifestyle/tonight"
                  className="text-emerald-400 hover:underline text-sm mb-4 inline-block"
                >
                  ← Back
                </Link>
                <h1 className="text-3xl font-bold">{place.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-300">
                  <span>
                    {place.rating} ({place.reviewCount} reviews)
                  </span>
                  <span>·</span>
                  <span>{place.priceRange}</span>
                  <span>·</span>
                  <span className={place.isOpen ? 'text-green-400' : 'text-red-400'}>
                    {place.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                  {place.partnerVerified && (
                    <span className="bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full text-xs">
                      CheckVerified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
              <section>
                <p className="text-gray-300 leading-relaxed">{place.description}</p>
              </section>
              <section className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-xl p-5 space-y-3">
                  <h2 className="font-bold">Details</h2>
                  <p className="text-sm text-gray-400">{place.address}</p>
                  {place.phone && <p className="text-sm text-gray-400">Phone{place.phone}</p>}
                  {place.website && <p className="text-sm text-gray-400">{place.website}</p>}
                  <p className="text-sm text-gray-400">Clock{place.hours}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-5">
                  <h2 className="font-bold mb-3">Quick Actions</h2>
                  <div className="space-y-2">
                    <Link
                      href={`/lifestyle/itinerary?add=${place.id}`}
                      className="block bg-emerald-600 hover:bg-emerald-700 text-center px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Add to Itinerary
                    </Link>
                    {place.phone && (
                      <a
                        href={`tel:${place.phone}`}
                        className="block bg-gray-800 hover:bg-gray-700 text-center px-4 py-2 rounded-lg text-sm transition"
                      >
                        Call
                      </a>
                    )}
                  </div>
                </div>
              </section>
              {place.offers.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Offers</h2>
                  <div className="space-y-3">
                    {place.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="bg-gray-900 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-bold">{offer.title}</h3>
                          <p className="text-sm text-gray-400">{offer.description}</p>
                        </div>
                        {offer.discount && (
                          <span className="text-emerald-400 font-bold">{offer.discount}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        ) : null}
      </main>
      <AppFooter />
    </>
  );
}
