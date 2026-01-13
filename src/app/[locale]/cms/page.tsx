'use client';

import { getUser } from '@/app/actions/cms/getUser';
import { heroActions } from '@/app/actions/cms/sections/heroActions';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import BlogSection from '@/components/common/cms/BlogSection';
import CareerSection from '@/components/common/cms/CareerSection';
import ContactsSection from '@/components/common/cms/ContactsSection';
import HeroSection from '@/components/common/cms/HeroSection';
import I18nSection from '@/components/common/cms/I18nSection';
import PortfolioSection from '@/components/common/cms/PortfolioSection';
import SidePanel from '@/components/common/cms/SidePanel';
import SkillsSection from '@/components/common/cms/SkillsSection';
import UsersSection from '@/components/common/cms/UsersSection';
import { useLayoutStore } from '@/store/layoutStore';
import { useEffect } from 'react';

export default function CMS() {
  const {
    setUser,
    activeSection,
    setActiveSection,
    setHeroSection,
    setLoading,
    setError,
    loading,
    error,
  } = useLayoutStore();

  useEffect(() => {
    const initializeCMS = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch user first
        const fetchedUser = await getUser();
        setUser(fetchedUser);

        if (fetchedUser) {
          // Set default section based on user role
          const defaultSection = fetchedUser.role === 'admin' ? 'hero' : 'blog';
          setActiveSection(defaultSection);

          // Only fetch hero data for admins
          if (fetchedUser.role === 'admin') {
            const result = await heroActions({ type: 'GET' });
            if (!result.success) {
              throw new Error(result.error || 'Failed to fetch hero section data');
            }

            const data = result.data as {
              hero: { propic: string; blurhashURL: string } | null;
              resume: { resume_en: string; resume_it: string } | null;
            };
            setHeroSection({
              mainImage: data.hero?.propic || null,
              blurhashURL: data.hero?.blurhashURL || null,
              resume_en: data.resume?.resume_en || null,
              resume_it: data.resume?.resume_it || null,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize CMS');
      } finally {
        setLoading(false);
      }
    };

    initializeCMS();
  }, [setUser, setActiveSection, setHeroSection, setLoading, setError]);

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
    <div className=" bg-bglight dark:bg-bgdark">
      <div className="flex max-w-(--breakpoint-2xl) mx-auto mt-6">
        <div className="flex flex-col">
          <SidePanel />
          <div className="w-72 p-4 text-center">
            <h1 className="text-2xl font-bold text-main">CMS Dashboard</h1>
            <p className="text-lighttext2 text-sm">
              Manage your website content
            </p>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            {activeSection === 'hero' && <HeroSection />}
            {activeSection === 'skills' && <SkillsSection />}
            {activeSection === 'career' && <CareerSection />}
            {activeSection === 'portfolio' && <PortfolioSection />}
            {activeSection === 'blog' && <BlogSection />}
            {activeSection === 'contacts' && <ContactsSection />}
            {activeSection === 'i18n' && <I18nSection />}
            {activeSection === 'users' && <UsersSection />}
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
