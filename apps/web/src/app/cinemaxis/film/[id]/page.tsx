'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface CinemaxisFilm {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  backdropUrl?: string;
  duration: number;
  rating: string;
  releaseDate: string;
  genres: string[];
  cast: string[];
  director: string;
  ticketPrice: number;
  currency: string;
  hasTicket: boolean;
  accessExpiry?: string;
  territory: string;
}

export default function CinemaxisFilmDetailPage(): React.JSX.Element {
  const params = useParams();
  const filmId = params.id as string;
  const { user } = useAuth();

  const {
    data: film,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cinemaxis', 'film', filmId],
    queryFn: async () => {
      const res = await apiFetch<CinemaxisFilm>(`/v1/movies/cinemaxis/${filmId}`);
      return res.success ? res.data : null;
    },
  });

  if (error) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load film. Please try again." />
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
          <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[50vh] w-full rounded-xl" />
          </div>
        ) : film ? (
          <>
            <div className="relative h-[60vh] bg-gradient-to-b from-purple-900/40 to-gray-950">
              {film.backdropUrl && (
                <img
                  src={film.backdropUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-4 pb-12">
                <Link
                  href="/cinemaxis"
                  className="text-purple-400 hover:underline text-sm mb-4 inline-block"
                >
                  ← Cinemaxis
                </Link>
                <h1 className="text-4xl font-bold mb-2">{film.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span>{film.rating}</span>
                  <span>
                    {Math.floor(film.duration / 60)}h {film.duration % 60}m
                  </span>
                  <span>{film.releaseDate}</span>
                  <span>{film.territory}</span>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 py-12">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <section>
                    <p className="text-gray-300 leading-relaxed text-lg">{film.description}</p>
                  </section>
                  <section>
                    <h2 className="text-xl font-bold mb-3">Details</h2>
                    <div className="space-y-2 text-gray-400">
                      <p>
                        <span className="text-gray-300">Director:</span> {film.director}
                      </p>
                      <p>
                        <span className="text-gray-300">Cast:</span> {film.cast.join(', ')}
                      </p>
                      <p>
                        <span className="text-gray-300">Genres:</span> {film.genres.join(', ')}
                      </p>
                    </div>
                  </section>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-xl p-6 sticky top-24">
                    {film.hasTicket ? (
                      <>
                        <p className="text-green-400 font-semibold mb-2">
                          CheckDigital Ticket Active
                        </p>
                        {film.accessExpiry && (
                          <p className="text-sm text-gray-400 mb-4">
                            Access expires: {new Date(film.accessExpiry).toLocaleDateString()}
                          </p>
                        )}
                        <Link
                          href={`/cinemaxis/watch/${film.id}`}
                          className="block w-full bg-purple-600 hover:bg-purple-700 text-center px-6 py-3 rounded-lg font-semibold transition"
                        >
                          Watch Now
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold mb-1">
                          ₦{film.ticketPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400 mb-4">Digital Ticket</p>
                        {user ? (
                          <Link
                            href={`/cinemaxis/ticket/${film.id}`}
                            className="block w-full bg-purple-600 hover:bg-purple-700 text-center px-6 py-3 rounded-lg font-semibold transition"
                          >
                            Buy Digital Ticket
                          </Link>
                        ) : (
                          <Link
                            href="/auth/login"
                            className="block w-full bg-purple-600 hover:bg-purple-700 text-center px-6 py-3 rounded-lg font-semibold transition"
                          >
                            Sign in to Purchase
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
      <AppFooter />
    </>
  );
}
