'use client';

import { logout } from '@/app/actions/cms/logout';
import { updateMyProfile } from '@/app/actions/cms/sections/usersActions';
import { useLayoutStore } from '@/store/layoutStore';
import {
  Briefcase,
  Camera,
  Check,
  Contact,
  Crown,
  Github,
  Globe,
  Home,
  LogOut,
  NotebookPen,
  Pencil,
  User2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const SidePanel = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zustand store
  const { activeSection, setActiveSection, user, setUser } = useLayoutStore();
  
  const isAdmin = user?.role === 'admin';
  // Default section: admin gets 'hero', editor gets 'blog'
  const defaultSection = isAdmin ? 'hero' : 'blog';

  const handleButtonClick = (section: string) => {
    setActiveSection(section);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);

    const formData = new FormData();
    formData.append('avatar', file);

    const result = await updateMyProfile(formData);

    if (result.success && result.avatarUrl) {
      setUser({ ...user, avatarUrl: result.avatarUrl });
    }

    setIsUploadingAvatar(false);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditNameClick = () => {
    setEditedName(user?.displayName || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;

    setIsSavingName(true);

    const formData = new FormData();
    formData.append('displayName', editedName.trim());

    const result = await updateMyProfile(formData);

    if (result.success) {
      setUser({ ...user, displayName: editedName.trim() });
      setIsEditingName(false);
    }

    setIsSavingName(false);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const menuItems = [
    { id: 'hero', label: 'Hero Section', icon: Home, adminOnly: true },
    { id: 'skills', label: 'Skills', icon: Zap, adminOnly: true },
    { id: 'career', label: 'Career', icon: User2, adminOnly: true },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'blog', label: 'Blog', icon: NotebookPen },
    { id: 'contacts', label: 'Contacts', icon: Contact, adminOnly: true },
    { id: 'i18n', label: 'I18n Strings', icon: Globe, adminOnly: true },
    { id: 'users', label: 'Manage Users', icon: Users, adminOnly: true },
  ];

  // Set default section for editors on first render
  useEffect(() => {
    if (!isAdmin && activeSection === 'hero') {
      setActiveSection(defaultSection);
    }
  }, [isAdmin, activeSection, defaultSection, setActiveSection]);

  return (
    <div className="w-72 text-lighttext flex flex-col h-fit">
      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-b border-darkgray">
          <div className="flex items-center gap-3">
            {/* Avatar with upload */}
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="relative w-12 h-12 rounded-full overflow-hidden bg-darkergray flex-shrink-0 group cursor-pointer"
            >
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
              {/* Upload overlay */}
              <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isUploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleAvatarChange}
              className="hidden"
            />

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-24 px-1 py-0.5 text-sm bg-darkestgray border border-main rounded text-lighttext focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelEditName();
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="p-0.5 text-green-400 hover:text-green-300"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditName}
                      className="p-0.5 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-lighttext truncate">
                      {user.displayName}
                    </span>
                    <button
                      type="button"
                      onClick={handleEditNameClick}
                      className="p-0.5 text-lighttext2 hover:text-main"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </>
                )}
                {isAdmin && !isEditingName && (
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
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                isAdmin 
                  ? 'bg-yellow-500/20 text-yellow-500' 
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {user.role || 'user'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="p-4">
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

      {/* Logout & Home Buttons */}
      <div className="p-4 mt-auto border-t border-darkgray space-y-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
        <a
          href="/"
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-darkergray hover:bg-darkgray text-lighttext hover:text-white transition-all duration-200"
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Home</span>
        </a>
      </div>
    </div>
  );
};

export default SidePanel;
