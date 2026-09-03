'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface KnowledgeUnit {
  id: string;
  title: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  description?: string;
}

export default function AOUWhatYouKnowPage(): React.JSX.Element {
  const {
    data: knowledge,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['aou', 'what-you-know'],
    queryFn: async () => {
      const res = await apiFetch<{
        units: KnowledgeUnit[];
        totalUnlocked: number;
        totalUnits: number;
      }>('/v1/knowledge/what-you-know');
      return res.success ? res.data : null;
    },
  });

  if (error) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load knowledge state. Please try again." />
        </main>
        <AppFooter />
      </>
    );
  }

  const categories =
    knowledge?.units.reduce(
      (acc, unit) => {
        if (!acc[unit.category]) acc[unit.category] = [];
        acc[unit.category].push(unit);
        return acc;
      },
      {} as Record<string, KnowledgeUnit[]>
    ) ?? {};

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/aou" className="text-amber-400 hover:underline text-sm mb-6 inline-block">
            ← AOU Hub
          </Link>
          <h1 className="text-3xl font-bold mb-2">What You Know</h1>
          <p className="text-gray-400 mb-8">Your knowledge of the Agbalá Olódùmarè storyworld.</p>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : knowledge ? (
            <>
              <div className="bg-gray-900 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400">Knowledge Progress</span>
                  <span className="text-amber-400 font-bold">
                    {knowledge.totalUnlocked}/{knowledge.totalUnits}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className="bg-amber-500 h-3 rounded-full transition-all"
                    style={{ width: `${(knowledge.totalUnlocked / knowledge.totalUnits) * 100}%` }}
                  />
                </div>
              </div>

              {Object.entries(categories).map(([category, units]) => (
                <section key={category} className="mb-8">
                  <h2 className="text-xl font-bold mb-4">{category}</h2>
                  <div className="space-y-2">
                    {units.map((unit) => (
                      <div
                        key={unit.id}
                        className={`rounded-lg p-4 flex items-center justify-between ${unit.unlocked ? 'bg-gray-900' : 'bg-gray-900/50 border border-gray-800'}`}
                      >
                        <div>
                          <h3
                            className={`font-bold ${unit.unlocked ? 'text-white' : 'text-gray-500'}`}
                          >
                            {unit.title}
                          </h3>
                          {unit.description && (
                            <p className="text-sm text-gray-400 mt-1">{unit.description}</p>
                          )}
                        </div>
                        <div>
                          {unit.unlocked ? (
                            <span className="text-amber-400 text-sm">CheckUnlocked</span>
                          ) : (
                            <span className="text-gray-600 text-sm">LockLocked</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </>
          ) : null}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
