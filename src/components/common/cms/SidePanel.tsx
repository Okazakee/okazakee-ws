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
  Globe,
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
    { id: 'i18n', label: 'I18n Strings', icon: Globe },
  ];

  return (
    <div className="w-72 text-lighttext flex flex-col h-fit">
      <div className="p-4">
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
    </div>
  );
};

export default SidePanel;
