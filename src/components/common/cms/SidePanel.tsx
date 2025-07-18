'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLayoutStore } from '@/store/layoutStore';
import {
  Home,
  Zap,
  Briefcase,
  NotebookPen,
  Contact,
  User2,
  Layers3,
} from 'lucide-react';

const SidePanel = () => {
  const [activeButton, setActiveButton] = useState('hero');

  // Zustand store
  const { setActiveSection, user } = useLayoutStore();

  const handleButtonClick = (section: string) => {
    setActiveButton(section);
    setActiveSection(section);
  };

  const menuItems = [
    { id: 'hero', label: 'Hero Section', icon: Home },
    { id: 'skills', label: 'Skills', icon: Zap },
    { id: 'career', label: 'Career', icon: User2 },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'blog', label: 'Blog', icon: NotebookPen },
    { id: 'contacts', label: 'Contacts', icon: Contact },
  ];

  return (
    <div className="w-72 bg-darkestgray text-lighttext flex flex-col border-r border-darkgray">
      <div className="p-6 border-b border-darkgray">
        <h1 className="text-2xl font-bold text-main">CMS Dashboard</h1>
        <p className="text-lighttext2 text-sm mt-1">Manage your website content</p>
      </div>

      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                activeButton === item.id
                  ? 'bg-main text-white shadow-lg'
                  : 'bg-darkergray hover:bg-darkgray text-lighttext hover:text-white'
              }`}
              onClick={() => handleButtonClick(item.id)}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-darkgray bg-darkergray">
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-darkestgray">
            <Image
              loading="eager"
              decoding="sync"
              src={user.propic}
              width={40}
              height={40}
              className="rounded-full border-2 border-main"
              alt="User Profile"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-lighttext truncate">
                {user.email}
              </p>
              <p className="text-xs text-lighttext2">Administrator</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanel;
