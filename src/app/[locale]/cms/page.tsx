'use client';

import { getUser } from '@/app/actions/cms/getUser';
import HeroSection from '@/components/common/cms/HeroSection';
import SidePanel from '@/components/common/cms/SidePanel';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useLayoutStore } from '@/store/layoutStore';
import React, { useEffect } from 'react';
import SkillsSection from '@/components/common/cms/SkillsSection';
import { heroActions } from '@/app/actions/cms/sections/heroActions';
import ContactsSection from '@/components/common/cms/ContactsSection';
import I18nSection from '@/components/common/cms/I18nSection';

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
        const result = await heroActions({ type: 'GET' });
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch hero section data');
        }
        setHeroSection(result.data);
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
    <div className=" bg-bglight dark:bg-bgdark">
      <div className="flex max-w-screen-2xl mx-auto">
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
            {activeSection === 'posts' && (
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold text-main mb-4">
                  Posts Section
                </h2>
                <p className="text-lighttext2">Coming soon...</p>
              </div>
            )}
            {activeSection === 'contacts' && <ContactsSection />}
            {activeSection === 'i18n' && <I18nSection />}
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
