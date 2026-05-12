'use client';

import { Menu } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { getUser } from '@/app/actions/cms/getUser';
import { heroActions } from '@/app/actions/cms/sections/heroActions';
import AccountSection from '@/components/common/cms/AccountSection';
import BlogSection from '@/components/cms/sections/Blog/BlogSection';
import CareerSection from '@/components/cms/sections/Career/CareerSection';
import ContactsSection from '@/components/cms/sections/Contacts/ContactsSection';
import HeroSection from '@/components/cms/sections/Hero/HeroSection';
import LayoutSection from '@/components/cms/sections/Layout/LayoutSection';
import PortfolioSection from '@/components/cms/sections/Portfolio/PortfolioSection';
import PrivacyPolicySection from '@/components/cms/sections/Privacy/PrivacyPolicySection';
import SidePanel from '@/components/common/cms/SidePanel';
import SkillsSection from '@/components/cms/sections/Skills/SkillsSection';
import UsersSection from '@/components/cms/sections/Users/UsersSection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useLayoutStore } from '@/store/layoutStore';

// sectionLabels is built inside the component using t()

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function CMS() {
  const t = useTranslations('cms');
  const sectionLabels: Record<string, string> = {
    hero: t('page.sectionLabels.hero'),
    skills: t('page.sectionLabels.skills'),
    career: t('page.sectionLabels.career'),
    portfolio: t('page.sectionLabels.portfolio'),
    blog: t('page.sectionLabels.blog'),
    contacts: t('page.sectionLabels.contacts'),
    layout: t('page.sectionLabels.layout'),
    'privacy-policy': t('page.sectionLabels.privacy-policy'),
    users: t('page.sectionLabels.users'),
    account: t('page.sectionLabels.account'),
    settings: t('page.sectionLabels.settings'),
  };
  const {
    setUser,
    activeSection,
    setActiveSection,
    setHeroSection,
    heroSection,
    setLoading,
    setError,
    loading,
    error,
    user,
  } = useLayoutStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [canShowError, setCanShowError] = useState(false);

  useEffect(() => {
    const initializeCMS = async () => {
      setLoading(true);
      setError(null);
      setCanShowError(false);

      const startedAt = Date.now();
      const errorDelayMs = 5000;
      let cancelled = false;

      // If component unmounts, prevent setting state
      const cleanup = () => {
        cancelled = true;
      };

      try {
        // Load saved section FIRST, before fetching user (to avoid race conditions)
        const savedSection =
          typeof window !== 'undefined'
            ? localStorage.getItem('cms_active_section')
            : null;

        // Fetch user (keep spinner up; retry until either success or 5s timeout)
        let fetchedUser = await getUser();
        while (!fetchedUser && Date.now() - startedAt < errorDelayMs) {
          await sleep(250);
          fetchedUser = await getUser();
        }

        if (!fetchedUser) {
          throw new Error(t('page.authError'));
        }
        setUser(fetchedUser);

        // Validate saved section based on user role
        const defaultSection = fetchedUser.role === 'admin' ? 'hero' : 'blog';
        const adminOnlySections = [
          'hero',
          'skills',
          'career',
          'contacts',
          'layout',
          'privacy-policy',
          'users',
        ];
        const validSections = [
          'hero',
          'skills',
          'career',
          'portfolio',
          'blog',
          'contacts',
          'layout',
          'privacy-policy',
          'users',
          'account',
          'settings',
        ];

        let sectionToUse = defaultSection;

        if (savedSection && validSections.includes(savedSection)) {
          // Check if saved section is valid for this user
          if (
            fetchedUser.role === 'admin' ||
            !adminOnlySections.includes(savedSection)
          ) {
            sectionToUse = savedSection;
          }
        }

        // Set active section immediately
        setActiveSection(sectionToUse);

        // Always save to localStorage to ensure it's persisted
        if (typeof window !== 'undefined') {
          localStorage.setItem('cms_active_section', sectionToUse);
        }

        // Fetch hero data for admins (required for initial render to avoid section-level flashes)
        if (fetchedUser.role === 'admin') {
          type HeroBootData = {
            hero: { propic: string; blurhashURL: string } | null;
            resume: { resume_en: string; resume_it: string } | null;
          };

          let lastError: string | null = null;
          let data: HeroBootData | null = null;

          while (!data && Date.now() - startedAt < errorDelayMs) {
            const result = await heroActions({ type: 'GET' });
            if (result.success && result.data) {
              data = result.data as HeroBootData;
              break;
            }

            lastError = result.error || 'Failed to fetch hero section data';

            // Transient right-after-login auth propagation: wait and retry
            await sleep(250);
          }

          if (!data) {
            throw new Error(lastError || 'Failed to fetch hero section data');
          }

          setHeroSection({
            mainImage: data.hero?.propic || null,
            blurhashURL: data.hero?.blurhashURL || null,
            resume_en: data.resume?.resume_en || null,
            resume_it: data.resume?.resume_it || null,
          });
        }
        if (cancelled) return;
        setLoading(false);
        setCanShowError(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('page.initError'));

        // Keep showing the full-page spinner until 5s have elapsed since init started
        const elapsed = Date.now() - startedAt;
        const remaining = errorDelayMs - elapsed;
        if (remaining > 0) {
          await sleep(remaining);
        }

        if (cancelled) return;
        setCanShowError(true);
        setLoading(false);
      }

      return cleanup;
    };

    initializeCMS();
  }, [setUser, setActiveSection, setHeroSection, setLoading, setError]);

  const needsAdminBootData = user?.role === 'admin' && !heroSection;
  const waitingForUser = !user && !(error && canShowError);

  if (loading || needsAdminBootData || waitingForUser) {
    if (error && canShowError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && canShowError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Header - Sticky at top */}
      <div className="lg:hidden flex-shrink-0 z-30 bg-bglight dark:bg-bgdark border-b border-gray-200 dark:border-darkgray px-4 py-3 flex items-center justify-between">
        {user && (
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-darkergray flex-shrink-0">
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
            {activeSection
              ? sectionLabels[activeSection] || 'CMS Dashboard'
              : t('page.cmsDashboard')}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 text-darktext dark:text-lighttext hover:text-main transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* CMS Content Area */}
      <div className="bg-bglight dark:bg-bgdark flex-1 min-h-0 overflow-hidden">
        {/* Mobile: Natural flow, Desktop: Fixed sidebar layout */}
        <div className="flex flex-col lg:flex-row max-w-(--breakpoint-2xl) mx-auto h-full">
          <SidePanel
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
          />
          <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8 pt-8 md:pt-6 lg:pt-8">
            <div className="max-w-4xl mx-auto md:mb-20">
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
                  <h2 className="text-3xl font-bold text-main mb-4">
                    {t('page.settingsTitle')}
                  </h2>
                  <p className="text-gray-500 dark:text-lighttext2">
                    {t('page.settingsComingSoon')}
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
