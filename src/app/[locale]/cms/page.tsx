'use client';

import { getUser } from '@/app/actions/getUser';
import SidePanel from '@/components/common/cms/SidePanel';
import { useLayoutStore } from '@/store/layoutStore';
import React, { useEffect } from 'react';

export default function CMS() {
  // Zustand store
  const { setUser, activeSection } = useLayoutStore();

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = await getUser();
      setUser(fetchedUser);
    };
    fetchUser();
  }, []);

  return (
    <section className="flex h-[90vh]">
      <SidePanel />
      <main className="flex-1 md:max-w-7xl mt-20 md:mt-10 h-full">
        {activeSection === 'hero' && <div className="">hero sec</div>}
        {activeSection === 'skills' && <div>skills sec</div>}
        {activeSection === 'posts' && <div>3</div>}
        {activeSection === 'contacts' && <div>4</div>}
      </main>
    </section>
  );
}
