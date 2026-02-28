'use client';

import {
  Briefcase,
  Contact,
  Crown,
  FileText,
  Github,
  Home,
  LayoutGrid,
  LogOut,
  NotebookPen,
  Settings,
  User2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLayoutStore } from '@/store/layoutStore';
import { createClient } from '@/utils/supabase/client';

interface SidePanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SidePanel = ({ isOpen = true, onClose }: SidePanelProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  // Zustand store
  const { activeSection, setActiveSection, user, setUser, setHeroSection } =
    useLayoutStore();

  const isAdmin = user?.role === 'admin';
  // Default section: admin gets 'hero', editor gets 'blog'
  const defaultSection = isAdmin ? 'hero' : 'blog';

  const handleButtonClick = (section: string) => {
    setActiveSection(section);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms_active_section', section);
    }
    // Close drawer on mobile when a section is selected
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setUser(null);
    setHeroSection(null);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}/cms/login`;
  };

  const menuItems = [
    { id: 'hero', label: 'Hero Section', icon: Home, adminOnly: true },
    { id: 'skills', label: 'Skills', icon: Zap, adminOnly: true },
    { id: 'career', label: 'Career', icon: User2, adminOnly: true },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'blog', label: 'Blog', icon: NotebookPen },
    { id: 'contacts', label: 'Contacts', icon: Contact, adminOnly: true },
    { id: 'layout', label: 'Layout', icon: LayoutGrid, adminOnly: true },
    {
      id: 'privacy-policy',
      label: 'Privacy Policy',
      icon: FileText,
      adminOnly: true,
    },
    { id: 'users', label: 'Manage Users', icon: Users, adminOnly: true },
  ];

  // Set default section for editors only once after user loads
  // This ensures editors don't stay on admin-only sections
  useEffect(() => {
    // Don't run if user is not loaded yet or if user is admin
    if (!user || isAdmin) return;

    // Only run once after user is loaded
    if (typeof window !== 'undefined' && activeSection) {
      const savedSection = localStorage.getItem('cms_active_section');
      const adminOnlySections = [
        'hero',
        'skills',
        'career',
        'contacts',
        'layout',
        'privacy-policy',
        'users',
      ];

      // Only redirect if:
      // 1. Current section is admin-only AND
      // 2. There's no saved section OR saved section is also admin-only
      if (
        adminOnlySections.includes(activeSection) &&
        (!savedSection || adminOnlySections.includes(savedSection))
      ) {
        setActiveSection(defaultSection);
        localStorage.setItem('cms_active_section', defaultSection);
      }
    }
  }, [user]); // Only run when user loads (once)

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {onClose && (
        <div
          className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* SidePanel */}
      <div
        className={`w-72 text-lighttext flex flex-col h-full bg-bglight dark:bg-bgdark ${
          onClose
            ? `fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:z-auto ${
                isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
              }`
            : 'relative'
        }`}
      >
        {/* Mobile Header with Close Button */}
        {onClose && (
          <div className="p-4 border-b border-darkgray flex-shrink-0 flex items-center justify-between lg:hidden">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-main mb-1">
                CMS Dashboard
              </h1>
              <p className="text-lighttext2 text-xs">
                Manage your website content
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-lighttext2 hover:text-lighttext transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Desktop Header */}
        {!onClose && (
          <div className="p-4 border-b border-darkgray flex-shrink-0 text-center">
            <h1 className="text-xl font-bold text-main mb-1">CMS Dashboard</h1>
            <p className="text-lighttext2 text-xs">
              Manage your website content
            </p>
          </div>
        )}

        {/* User Profile Section */}
        {user && (
          <div className="p-4 border-b border-darkgray flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-darkergray flex-shrink-0">
                {user.avatarUrl && user.avatarUrl.length > 0 ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-main text-white text-lg font-bold">
                    {(user.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lighttext truncate">
                    {user.displayName}
                  </span>
                  {isAdmin && (
                    <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-lighttext2">
                  {user.authProvider === 'github' ? (
                    <>
                      <Github className="w-3 h-3" />
                      <span>@{user.githubUsername}</span>
                    </>
                  ) : (
                    <span className="truncate">{user.email}</span>
                  )}
                </div>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    isAdmin
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {user.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation and Account Actions */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 pb-4">
            <nav className="space-y-2">
              {menuItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                      activeSection === item.id
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

          {/* Account, Home & Logout Buttons */}
          <div className="px-4 pt-4 pb-4 border-t border-darkgray space-y-2">
            <button
              type="button"
              onClick={() => handleButtonClick('account')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                activeSection === 'account'
                  ? 'bg-main text-white shadow-lg'
                  : 'bg-darkergray hover:bg-darkgray text-lighttext hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">My Account</span>
            </button>
            <a
              href={`/${locale}`}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-darkergray hover:bg-darkgray text-lighttext hover:text-white transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </a>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidePanel;
