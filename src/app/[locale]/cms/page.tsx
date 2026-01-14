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
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Image from 'next/image';

const sectionLabels: Record<string, string> = {
  hero: 'Hero Section',
  skills: 'Skills',
  career: 'Career',
  portfolio: 'Portfolio',
  blog: 'Blog',
  contacts: 'Contacts',
  layout: 'Layout',
  'privacy-policy': 'Privacy Policy',
  users: 'Manage Users',
  account: 'My Account',
  settings: 'Settings',
};

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
    user,
  } = useLayoutStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    <>
      {/* Mobile Header - Sticky at top */}
      <div className="lg:hidden sticky top-0 z-30 bg-bglight dark:bg-bgdark border-b border-darkgray px-4 py-3 flex items-center justify-between">
        {user && (
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-darkergray flex-shrink-0">
              {user.avatarUrl && user.avatarUrl.length > 0 ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName || 'User'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-main text-white text-sm font-bold">
                  {(user.displayName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-main">
            {sectionLabels[activeSection] || 'CMS Dashboard'}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 text-lighttext hover:text-main transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* CMS Content Area */}
      <div className="bg-bglight dark:bg-bgdark">
        {/* Mobile: Natural flow, Desktop: Fixed sidebar layout */}
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-80px)] max-w-(--breakpoint-2xl) mx-auto">
          <SidePanel isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
          <main className="flex-1 lg:overflow-y-auto p-4 md:p-6 lg:p-8 pt-8 md:pt-6 lg:pt-8 pb-20 md:pb-12 lg:pb-8">
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
    </>
  );
}
