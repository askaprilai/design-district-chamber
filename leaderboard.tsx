'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon, 
  FireIcon, 
  UserGroupIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface LeaderboardEntry {
  rank: number;
  display_name: string | null;
  total_impact_score: number;
  level: number;
  persona: string | null;
  user_id?: string;
  avatar_url?: string | null;
}

interface LeaderboardProps {
  currentUserId?: string;
  itemsPerPage?: number;
}

const PERSONA_CONFIGS = {
  eco_warrior: { name: 'Eco Warrior', icon: '🌱', color: 'emerald' },
  community_builder: { name: 'Community Builder', icon: '🤝', color: 'blue' },
  health_focused: { name: 'Health Advocate', icon: '❤️', color: 'red' },
  tech_innovator: { name: 'Tech Innovator', icon: '💻', color: 'purple' },
  social_impact: { name: 'Social Impact Leader', icon: '✊', color: 'orange' },
  lifestyle_optimizer: { name: 'Lifestyle Optimizer', icon: '⚡', color: 'indigo' }
};

export default function Leaderboard({ 
  currentUserId, 
  itemsPerPage = 10 
}: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrent
] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'global' | 'persona'>('global');
  const [userRank, setUserRank] = useState<number | null>(null);

  // Cursor pagination state
  const [cursors, setCursors] = useState<{
    first?: string;
    last?: string;
    hasPrev: boolean;
    hasNext: boolean;
  }>({
    hasPrev: false,
    hasNext: false
  });

  const fetchLeaderboard = useCallback(async (
    direction: 'first' | 'next' | 'prev' = 'first',
    cursor?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('profiles')
        .select('user_id, display_name, total_impact_score, level, persona, avatar_url')
        .gt('total_impact_score', 0)
        .order('total_impact_score', { ascending: false });

      // Apply persona filter
      if (selectedPersona && viewType === 'persona') {
        query = query.eq('persona', selectedPersona);
      }

      // Apply cursor pagination
      if (direction === 'next' && cursor) {
        query = query.lt('total_impact_score', cursor);
      } else if (direction === 'prev' && cursor) {
        query = query.gt('total_impact_score', cursor);
      }

      // Fetch one extra item to determine if there are more pages
      const { data, error: fetchError } = await query.limit(itemsPerPage + 1);

      if (fetchError) throw fetchError;

      if (!data) {
        setLeaderboardData([]);
        return;
      }

      // Check if there are more items
      const hasMore = data.length > itemsPerPage;
      const items = hasMore ? data.slice(0, itemsPerPage) : data;

      // Calculate ranks
      let startRank: number;
      if (direction === 'first') {
        startRank = 1;
      } else if (direction === 'next') {
        startRank = currentPage * itemsPerPage + 1;
      } else {
        startRank = Math.max(1, (currentPage - 2) * itemsPerPage + 1);
      }

      const rankedData: LeaderboardEntry[] = items.map((item, index) => ({
        rank: startRank + index,
        display_name: item.display_name,
        total_impact_score: item.total_impact_score,
        level: item.level,
        persona: item.persona,
        user_id: item.user_id,
        avatar_url: item.avatar_url
      }));

      setLeaderboardData(rankedData);

      // Update cursor state
      setCursors({
        first: items[0]?.total_impact_score?.toString(),
        last: items[items.length - 1]?.total_impact_score?.toString(),
        hasPrev: currentPage > 1,
        hasNext: hasMore
      });

      setHasNextPage(hasMore);

      // Update page counter
      if (direction === 'next') {
        setCurrent
(prev => prev + 1);
      } else if (direction === 'prev') {
        setCurrent
(prev => Math.max(1, prev - 1));
      } else {
        setCurrent
(1);
      }

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [selectedPersona, viewType, itemsPerPage, currentPage]);

  const fetchUserRank = useCallback(async () => {
    if (!currentUserId) return;

    try {
      let query = supabase
        .from('profiles')
        .select('total_impact_score')
        .gt('total_impact_score', 0);

      if (selectedPersona && viewType === 'persona') {
        query = query.eq('persona', selectedPersona);
      }

      // Get user's score
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('total_impact_score')
        .eq('user_id', currentUserId)
        .single();

      if (userError || !userData) return;

      // Count users with higher scores
      const { count, error: countError } = await query
        .gt('total_impact_score', userData.total_impact_score)
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      setUserRank((count || 0) + 1);
    } catch (err) {
      console.error('Error fetching user rank:', err);
    }
  }, [currentUserId, selectedPersona, viewType]);

  useEffect(() => {
    fetchLeaderboard('first');
    fetchUserRank();
  }, [fetchLeaderboard, fetchUserRank]);

  const handlePersonaFilter = (persona: string | null) => {
    setSelectedPersona(persona);
    setViewType(persona ? 'persona' : 'global');
    setCurrent
(1);
    setCursors({ hasPrev: false, hasNext: false });
  };

  const handleNextPage = () => {
    if (cursors.hasNext && cursors.last) {
      fetchLeaderboard('next', cursors.last);
    }
  };

  const handlePrevPage = () => {
    if (cursors.hasPrev && cursors.first) {
      fetchLeaderboard('prev', cursors.first);
    }
  };

  if (loading && leaderboardData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                </div>
                <div className="h-6 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Leaderboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchLeaderboard('first')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-6">
            <TrophyIcon className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold">Impact Leaderboard</h1>
              <p className="text-blue-100">
                {viewType === 'global' ? 'Global Rankings' : 
                 `${PERSONA_CONFIGS[selectedPersona as keyof typeof PERSONA_CONFIGS]?.name} Rankings`}
              </p>
            </div>
          </div>

          {/* User's Current Rank */}
          {currentUserId && userRank && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/20 rounded-lg p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-yellow-900 font-bold text-sm">#{userRank}</span>
                </div>
                <span className="font-medium">Your Current Rank</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">Filter by Persona:</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handlePersonaFilter(null)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                viewType === 'global'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <UserGroupIcon className="w-4 h-4 inline mr-2" />
              All Players
            </button>
            
            {Object.entries(PERSONA_CONFIGS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handlePersonaFilter(key)}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                  selectedPersona === key
                    ? `border-${config.color}-500 bg-${config.color}-50 text-${config.color}-700`
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <span className="mr-2">{config.icon}</span>
                {config.name}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="p-6">
          {leaderboardData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No players found
              </h3>
              <p className="text-gray-600">
                {selectedPersona 
                  ? `No ${PERSONA_CONFIGS[selectedPersona as keyof typeof PERSONA_CONFIGS]?.name} players yet`
                  : 'Be the first to earn impact points!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {leaderboardData.map((entry, index) => (
                  <motion.div
                    key={`${entry.user_id}-${entry.rank}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      entry.user_id === currentUserId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      entry.rank === 1 ? 'bg-yellow-500 text-white' :
                      entry.rank === 2 ? 'bg-gray-400 text-white' :
                      entry.rank === 3 ? 'bg-orange-500 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {entry.rank <= 3 ? (
                        entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : '🥉'
                      ) : (
                        `#${entry.rank}`
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.display_name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {(entry.display_name || 'A')[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {entry.display_name || 'Anonymous Player'}
                        </h3>
                        {entry.persona && PERSONA_CONFIGS[entry.persona as keyof typeof PERSONA_CONFIGS] && (
                          <span className="text-lg" title={PERSONA_CONFIGS[entry.persona as keyof typeof PERSONA_CONFIGS].name}>
                            {PERSONA_CONFIGS[entry.persona as keyof typeof PERSONA_CONFIGS].icon}
                          </span>
                        )}
                        {entry.user_id === currentUserId && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Level {entry.level}</span>
                        {entry.rank <= 10 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <FireIcon className="w-4 h-4" />
                            Top 10
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {entry.total_impact_score.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        impact points
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {(cursors.hasPrev || cursors.hasNext) && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevPage}
                disabled={!cursors.hasPrev}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                Previous
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Page {currentPage}</span>
                {loading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
              </div>

              <button
                onClick={handleNextPage}
                disabled={!cursors.hasNext}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                Next
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}