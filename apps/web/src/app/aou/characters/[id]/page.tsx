'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { ArrowLeft, Users, Sparkles, Shield, Bookmark } from 'lucide-react';

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
    refetch,
  } = useQuery({
    queryKey: ['aou', 'character', characterId],
    queryFn: async () => {
      const res = await apiFetch<AOUCharacterDetail>(`/v1/vertical/characters/${characterId}`);
      return res.success && res.data ? res.data : null;
    },
  });

  if (error) {
    return (
      <PageShell activeNav="Vertical">
        <ErrorState
          title="Character Lore Unavailable"
          description="Failed to load this character dossier. Please try again."
          buttonText="Retry"
          onButtonPress={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="Vertical" glowColor="rgba(245, 158, 11, 0.2)">
      <div className="mb-6">
        <Link
          href="/aou"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/60 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agbalá Olódùmarè Hub
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton height="320px" borderRadius="24px" />
          <Skeleton height="160px" borderRadius="16px" />
          <Skeleton height="200px" borderRadius="16px" />
        </div>
      ) : character ? (
        <div className="space-y-10">
          {/* Hero Dossier Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="az-glass rounded-3xl overflow-hidden relative p-6 sm:p-10"
            style={{
              background:
                'linear-gradient(135deg, rgba(30, 20, 10, 0.8) 0%, rgba(18, 15, 25, 0.95) 100%)',
              borderColor: 'rgba(245, 158, 11, 0.25)',
            }}
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              {character.image ? (
                <div className="w-36 h-48 sm:w-48 sm:h-64 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-amber-500/30">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-36 h-48 sm:w-48 sm:h-64 rounded-2xl bg-gradient-to-br from-amber-600/30 to-purple-900/40 border border-amber-500/25 flex items-center justify-center text-6xl font-extrabold text-amber-400/90 shadow-2xl shrink-0">
                  {character.name[0]}
                </div>
              )}

              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="tracking-wider uppercase">{character.role}</span>
                </div>
                <h1 className="az-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
                  {character.name}
                </h1>
                <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-3xl">
                  {character.description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Relationships Grid */}
          {character.relationships && character.relationships.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="az-headline text-xl sm:text-2xl font-bold text-white">
                  Known Relationships & Affiliations
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {character.relationships.map((rel) => (
                  <Link key={rel.id} href={`/aou/characters/${rel.id}`} className="group">
                    <div className="az-glass p-4 rounded-2xl hover:border-amber-500/40 transition-all hover:scale-[1.02]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
                        {rel.type}
                      </span>
                      <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors">
                        {rel.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Mythological Artefacts */}
          {character.artefacts && character.artefacts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="az-headline text-xl sm:text-2xl font-bold text-white">
                  Sacred Artefacts & Relics
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {character.artefacts.map((art) => (
                  <div
                    key={art.id}
                    className="az-glass p-5 rounded-2xl border border-white/10 hover:border-amber-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-white text-lg">{art.name}</h3>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{art.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : null}
    </PageShell>
  );
}
