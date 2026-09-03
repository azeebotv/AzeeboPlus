'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface AOUCharacter {
  id: string;
  name: string;
  role: string;
  image?: string;
}

interface AOUTimeline {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface AOUKnowledge {
  totalUnits: number;
  unlockedUnits: number;
  progress: number;
}

export default function AOUHubPage(): React.JSX.Element {
  const {
    data: characters,
    isLoading: loadingCharacters,
    error: errorCharacters,
  } = useQuery({
    queryKey: ['aou', 'characters'],
    queryFn: async () => {
      const res = await apiFetch<AOUCharacter[]>('/v1/knowledge/characters');
      return res.success ? res.data : null;
    },
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['aou', 'timeline'],
    queryFn: async () => {
      const res = await apiFetch<AOUTimeline[]>('/v1/knowledge/timeline');
      return res.success ? res.data : null;
    },
  });

  const { data: knowledge, isLoading: loadingKnowledge } = useQuery({
    queryKey: ['aou', 'knowledge'],
    queryFn: async () => {
      const res = await apiFetch<AOUKnowledge>('/v1/knowledge/summary');
      return res.success ? res.data : null;
    },
  });

  if (errorCharacters) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load AOU content. Please try again." />
        </main>
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white">
        {/* Hero */}
        <section className="relative h-[60vh] bg-gradient-to-b from-amber-900/40 to-gray-950 flex items-end">
          <div className="max-w-7xl mx-auto px-4 pb-12 w-full">
            <h1 className="text-5xl font-bold mb-3">Agbalá Olódùmarè</h1>
            <p className="text-xl text-gray-300 max-w-2xl">
              Something to care about. Enter the storyworld, discover characters, and track what you
              know.
            </p>
            <div className="flex gap-3 mt-6">
              <Link
                href="/aou/what-you-know"
                className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition"
              >
                What You Know
              </Link>
              <Link
                href="/aou/timeline"
                className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition"
              >
                Timeline
              </Link>
            </div>
          </div>
        </section>

        {/* Knowledge Progress */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Your Knowledge</h2>
          {loadingKnowledge ? (
            <Skeleton className="h-20 w-full" />
          ) : knowledge ? (
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Knowledge Unlocked</span>
                <span className="text-amber-400 font-bold">
                  {knowledge.unlockedUnits}/{knowledge.totalUnits}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className="bg-amber-500 h-3 rounded-full transition-all"
                  style={{ width: `${knowledge.progress}%` }}
                />
              </div>
            </div>
          ) : null}
        </section>

        {/* Characters */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Characters</h2>
          {loadingCharacters ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : characters && characters.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {characters.map((char) => (
                <Link key={char.id} href={`/aou/characters/${char.id}`} className="group">
                  <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-amber-500 transition">
                    {char.image ? (
                      <img src={char.image} alt={char.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-amber-900/50 to-gray-800 flex items-center justify-center text-4xl">
                        {char.name[0]}
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold group-hover:text-amber-400 transition">
                        {char.name}
                      </h3>
                      <p className="text-sm text-gray-400">{char.role}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No characters available yet.</p>
          )}
        </section>

        {/* Timeline Preview */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Timeline</h2>
          {loadingTimeline ? (
            <Skeleton className="h-40 w-full" />
          ) : timeline && timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.slice(0, 5).map((event) => (
                <div key={event.id} className="bg-gray-900 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-3 h-3 bg-amber-500 rounded-full mt-2 shrink-0" />
                  <div>
                    <h3 className="font-bold">{event.title}</h3>
                    <p className="text-sm text-amber-400">{event.date}</p>
                    <p className="text-gray-400 mt-1">{event.description}</p>
                  </div>
                </div>
              ))}
              <Link href="/aou/timeline" className="text-amber-400 hover:underline text-sm">
                View full timeline →
              </Link>
            </div>
          ) : null}
        </section>
      </main>
      <AppFooter />
    </>
  );
}
