'use client';

import { useState, useEffect } from 'react';
import { User } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { UserButton } from '@clerk/nextjs';
import PhaserGame from '../../../phaser-game';
import RoutingQuiz from '../../../routing-quiz';
import Leaderboard from '../../../leaderboard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  persona: string | null;
  total_impact_score: number;
  level: number;
  onboarded_at: string | null;
  created_at: string;
}

interface DashboardContentProps {
  user: User;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        setProfile(existingProfile);
        // Show quiz if user hasn't been onboarded or doesn't have a persona
        setShowQuiz(!existingProfile.onboarded_at || !existingProfile.persona);
      } else {
        // Create new profile
        const newProfile = {
          user_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          display_name: user.firstName ? `${user.firstName} ${user.lastName}`.trim() : null,
          avatar_url: user.imageUrl,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;

        setProfile(createdProfile);
        setShowQuiz(true);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = async (persona: any, scores: Record<string, number>) => {
    if (!profile) return;

    try {
      // Update profile with persona and onboarding completion
      const { error } = await supabase
        .from('profiles')
        .update({
          persona: persona.id,
          onboarded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Award onboarding bonus points
      await supabase.rpc('award_points', {
        p_user_id: user.id,
        p_points: 100,
        p_activity_type: 'onboarding_complete',
        p_description: `Welcome bonus for completing persona quiz: ${persona.name}`,
        p_metadata: {
          persona: persona.id,
          quiz_scores: scores,
        },
      });

      // Reload profile to get updated data
      await loadUserProfile();
      setShowQuiz(false);
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your NYC impact dashboard...</p>
        </div>
      </div>
    );
  }

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to NYC Impact Game! 🏙️
            </h1>
            <p className="text-xl text-gray-600">
              Let's discover your impact persona and get you started in the Big Apple
            </p>
          </div>
          
          <RoutingQuiz
            onComplete={handleQuizComplete}
            onClose={() => setShowQuiz(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏙️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NYC Impact Game</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {profile?.display_name || user.firstName || 'Impact Maker'}!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{profile?.total_impact_score || 0}</div>
                  <div className="text-gray-600">Impact Points</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{profile?.level || 1}</div>
                  <div className="text-gray-600">Level</div>
                </div>
                {profile?.persona && (
                  <div className="text-center">
                    <div className="font-bold text-purple-600">
                      {profile.persona.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </div>
                    <div className="text-gray-600">Persona</div>
                  </div>
                )}
              </div>

              <UserButton />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('game')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'game'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎮 NYC Game
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'leaderboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏆 Leaderboard
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'game' ? (
          <div className="space-y-8">
            {/* Game Instructions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Navigate NYC & Make Impact 🗽
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How to Play:</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Use WASD or arrow keys to move around NYC</li>
                    <li>• Visit different neighborhoods and boroughs</li>
                    <li>• Click on pulsing impact zones to help communities</li>
                    <li>• Complete quests to earn points and level up</li>
                    <li>• Track your location and progress in real-time</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Impact Locations:</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>🏢 Harlem Community Center - Volunteer work</li>
                    <li>🍽️ Brooklyn Food Bank - Feed families</li>
                    <li>💻 Manhattan Tech Hub - Teach coding</li>
                    <li>🏥 Bronx Health Clinic - Health support</li>
                    <li>🌱 Queens Environmental - Urban gardening</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Game Container */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <PhaserGame
                currentUserId={user.id}
                userProfile={{
                  totalImpactScore: profile?.total_impact_score || 0,
                  level: profile?.level || 1,
                  completedQuests: 0, // TODO: Add quest completion tracking
                }}
                onScoreUpdate={(score) => {
                  // Handle score updates
                  console.log('Score updated:', score);
                }}
                onLevelUpdate={(level) => {
                  // Handle level updates
                  console.log('Level updated:', level);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Leaderboard Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                NYC Impact Leaderboard 🏆
              </h2>
              <p className="text-gray-600">
                See how you rank among NYC's top impact makers
              </p>
            </div>

            {/* Leaderboard Component */}
            <Leaderboard
              currentUserId={user.id}
              itemsPerPage={10}
            />
          </div>
        )}
      </main>

      {/* Quick Actions Footer */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setShowQuiz(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all text-sm font-medium"
        >
          🔄 Retake Quiz
        </button>
      </div>
    </div>
  );
}