'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface AOUCharacterDetail {
  id: string;
  name: string;
  role: string;
  description: string;
  image?: string;
  relationships: { id: string; name: string; type: string }[];
  artefacts: { id: string; name: string; description: string }[];
}

export default function AOUCharacterDetailPage(): React.JSX.Element {
  const params = useParams();
  const characterId = params.id as string;

  const {
    data: character,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['aou', 'character', characterId],
    queryFn: async () => {
      const res = await apiFetch<AOUCharacterDetail>(`/v1/knowledge/characters/${characterId}`);
      return res.success ? res.data : null;
    },
  });

  if (error) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load character. Please try again." />
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
            <Skeleton className="h-40 w-full" />
          </div>
        ) : character ? (
          <>
            <div className="relative h-[50vh] bg-gradient-to-b from-amber-900/40 to-gray-950 flex items-end">
              <div className="max-w-4xl mx-auto px-4 pb-12 w-full">
                <Link
                  href="/aou"
                  className="text-amber-400 hover:underline text-sm mb-4 inline-block"
                >
                  ← AOU Hub
                </Link>
                <h1 className="text-4xl font-bold mb-2">{character.name}</h1>
                <p className="text-lg text-amber-400">{character.role}</p>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
              <section>
                <h2 className="text-xl font-bold mb-4">About</h2>
                <p className="text-gray-300 leading-relaxed">{character.description}</p>
              </section>
              {character.relationships.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Relationships</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {character.relationships.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/aou/characters/${rel.id}`}
                        className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition"
                      >
                        <p className="font-bold">{rel.name}</p>
                        <p className="text-sm text-gray-400">{rel.type}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {character.artefacts.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Artefacts</h2>
                  <div className="space-y-3">
                    {character.artefacts.map((art) => (
                      <div key={art.id} className="bg-gray-900 rounded-lg p-4">
                        <h3 className="font-bold">{art.name}</h3>
                        <p className="text-sm text-gray-400">{art.description}</p>
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
