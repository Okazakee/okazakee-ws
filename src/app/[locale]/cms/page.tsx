'use client';

import { getUser } from '@/app/actions/cms/getUser';
import { heroActions } from '@/app/actions/cms/sections/heroActions';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AccountSection from '@/components/common/cms/AccountSection';
import BlogSection from '@/components/common/cms/BlogSection';
import CareerSection from '@/components/common/cms/CareerSection';
import ContactsSection from '@/components/common/cms/ContactsSection';
import HeroSection from '@/components/common/cms/HeroSection';
import LayoutSection from '@/components/common/cms/LayoutSection';
import PrivacyPolicySection from '@/components/common/cms/PrivacyPolicySection';
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
        // Load saved section FIRST, before fetching user (to avoid race conditions)
        const savedSection = typeof window !== 'undefined' 
          ? localStorage.getItem('cms_active_section') 
          : null;

        // Fetch user
        const fetchedUser = await getUser();
        setUser(fetchedUser);

        if (fetchedUser) {
          // Validate saved section based on user role
          const defaultSection = fetchedUser.role === 'admin' ? 'hero' : 'blog';
          const adminOnlySections = ['hero', 'skills', 'career', 'contacts', 'layout', 'privacy-policy', 'users'];
          const validSections = ['hero', 'skills', 'career', 'portfolio', 'blog', 'contacts', 'layout', 'privacy-policy', 'users', 'account', 'settings'];
          
          let sectionToUse = defaultSection;
          
          if (savedSection && validSections.includes(savedSection)) {
            // Check if saved section is valid for this user
            if (fetchedUser.role === 'admin' || !adminOnlySections.includes(savedSection)) {
              sectionToUse = savedSection;
            }
          }
          
          // Set active section immediately
          setActiveSection(sectionToUse);
          
          // Always save to localStorage to ensure it's persisted
          if (typeof window !== 'undefined') {
            localStorage.setItem('cms_active_section', sectionToUse);
          }

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
    <div className="bg-bglight dark:bg-bgdark min-h-screen">
      <div className="flex h-screen max-w-(--breakpoint-2xl) mx-auto">
        <SidePanel />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            {activeSection === 'hero' && <HeroSection />}
            {activeSection === 'skills' && <SkillsSection />}
            {activeSection === 'career' && <CareerSection />}
            {activeSection === 'portfolio' && <PortfolioSection />}
            {activeSection === 'blog' && <BlogSection />}
            {activeSection === 'contacts' && <ContactsSection />}
            {activeSection === 'layout' && <LayoutSection />}
            {activeSection === 'privacy-policy' && <PrivacyPolicySection />}
            {activeSection === 'users' && <UsersSection />}
            {activeSection === 'account' && <AccountSection />}
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
