'use client';

import { getUser } from '@/app/actions/cms/getUser';
import { getHero } from '@/app/actions/cms/sections/getHero';
import HeroSection from '@/components/common/cms/HeroSection';
import SidePanel from '@/components/common/cms/SidePanel';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useLayoutStore } from '@/store/layoutStore';
import React, { useEffect } from 'react';

export default function CMS() {
  const { setUser, activeSection, setHeroSection, setLoading, setError, loading, error } = useLayoutStore();

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
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>; // Show an error message if fetching fails
  }

  return (
    <section className="flex h-[90vh] max-w-screen-2xl mx-auto">
      <SidePanel />
      <main className="flex-1 mt-20 md:mt-10 h-full">
        {activeSection === 'hero' && <HeroSection />}
        {activeSection === 'skills' && <div>skills sec</div>}
        {activeSection === 'posts' && <div>3</div>}
        {activeSection === 'contacts' && <div>4</div>}
      </main>
    </section>
  );
}