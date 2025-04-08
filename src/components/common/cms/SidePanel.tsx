'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLayoutStore } from '@/store/layoutStore';

const SidePanel = () => {
  const [activeButton, setActiveButton] = useState('hero');

  // Zustand store
  const { setActiveSection, user } = useLayoutStore();

  const handleButtonClick = (section: string) => {
    setActiveButton(section);
    setActiveSection(section);
  };

  return (
    <div className="w-64 bg-darkestgray text-lighttext flex flex-col mt-10 rounded-xl">
      <div className="flex-1 p-4 mt-10">
        {[
          'hero',
          'skills categories',
          'skills',
          'portfolio',
          'blog',
          'contacts',
          'i18n strings',
        ].map((section) => (
          <button
            type="button"
            key={section}
            className={`w-full p-2 mb-2 rounded ${
              activeButton === section ? 'bg-darkgray' : 'bg-darkergray'
            }`}
            onClick={() => handleButtonClick(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-4 bg-darkergray rounded-xl">
        {user && (
          <div className="flex items-center justify-center gap-3">
            <Image
              loading="eager"
              decoding="sync"
              src={user.propic}
              width={40}
              height={40}
              className="rounded-full mr-2"
              alt="User Profile"
            />
            <div>
              <p className="text-sm font-semibold">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanel;
