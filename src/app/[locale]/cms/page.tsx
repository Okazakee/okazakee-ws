'use client';

import { getUser } from '@/app/actions/cms/getUser';
import { getHero } from '@/app/actions/cms/sections/getHero';
import HeroSection from '@/components/common/cms/HeroSection';
import SidePanel from '@/components/common/cms/SidePanel';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useLayoutStore } from '@/store/layoutStore';
import React, { useEffect } from 'react';

export default function CMS() {
  const {
    setUser,
    activeSection,
    setHeroSection,
    setLoading,
    setError,
    loading,
    error,
  } = useLayoutStore();

  useEffect(() => {
    const fetchHeroSection = async () => {
      setLoading(true);
      setError(null);

      try {
        const hero = await getHero();
        setHeroSection(hero);
      } catch (err) {
        setError('Failed to fetch hero section data');
      } finally {
        setLoading(false);
      }
    };

    fetchHeroSection();
  }, [setHeroSection, setLoading, setError]);

  useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = await getUser();
      setUser(fetchedUser);
    };
    fetchUser();
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bglight dark:bg-bgdark">
      <div className="flex h-screen max-w-screen-2xl mx-auto">
        <SidePanel />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            {activeSection === 'hero' && <HeroSection />}
            {activeSection === 'skills' && (
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold text-main mb-4">Skills Section</h2>
                <p className="text-lighttext2">Coming soon...</p>
              </div>
            )}
            {activeSection === 'posts' && (
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold text-main mb-4">Posts Section</h2>
                <p className="text-lighttext2">Coming soon...</p>
              </div>
            )}
            {activeSection === 'contacts' && (
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold text-main mb-4">Contacts Section</h2>
                <p className="text-lighttext2">Coming soon...</p>
              </div>
            )}
            {activeSection === 'settings' && (
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold text-main mb-4">Settings</h2>
                <p className="text-lighttext2">Coming soon...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
