'use client';

import { updateMyProfile } from '@/app/actions/cms/sections/usersActions';
import { getUser } from '@/app/actions/cms/getUser';
import { useLayoutStore } from '@/store/layoutStore';
import {
  Camera,
  Check,
  Github,
  Mail,
  Pencil,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function AccountSection() {
  const { user, setUser } = useLayoutStore();
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEditedName(user.displayName);
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (file: File) => {
    setIsUploadingAvatar(true);
    setError(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const result = await updateMyProfile(formData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload avatar');
      }
      // Refresh user data
      const refreshedUser = await getUser();
      if (refreshedUser) {
        setUser(refreshedUser);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEditNameClick = () => {
    setEditingName(true);
    setEditedName(user?.displayName || '');
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || !user) return;

    setSavingName(true);
    setError(null);

    const formData = new FormData();
    formData.append('displayName', editedName.trim());

    try {
      const result = await updateMyProfile(formData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update display name');
      }
      setEditingName(false);
      // Refresh user data
      const refreshedUser = await getUser();
      if (refreshedUser) {
        setUser(refreshedUser);
      }
    } catch (err) {
      console.error('Error updating display name:', err);
      setError(err instanceof Error ? err.message : 'Failed to update display name');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setEditedName(user?.displayName || '');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-main mb-4">
          My Account
        </h1>
        <p className="text-lighttext2 text-lg">
          Manage your profile settings
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-xl font-bold text-main mb-6 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Information
        </h2>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-darkgray flex-shrink-0 group cursor-pointer"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-main text-white text-2xl font-bold">
                    {(user.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Upload overlay */}
                <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isUploadingAvatar ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAvatarChange(file);
                  }
                  e.target.value = '';
                }}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm text-lighttext2 mb-1">Profile Picture</p>
              <p className="text-xs text-lighttext2">Click to upload a new avatar</p>
            </div>
          </div>

          {/* Display Name Section */}
          <div>
            <label className="block text-sm font-medium text-lighttext mb-2">
              Display Name
            </label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-darkestgray border border-main rounded-lg text-lighttext focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEditName();
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditName}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-darkestgray rounded-lg text-lighttext flex-1">
                  {user.displayName}
                </span>
                <button
                  type="button"
                  onClick={handleEditNameClick}
                  className="p-2 text-lighttext2 hover:text-main hover:bg-darkgray rounded transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Email Section (Read-only) */}
          {user.email && (
            <div>
              <label className="block text-sm font-medium text-lighttext mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-darkestgray rounded-lg text-lighttext2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <p className="text-xs text-lighttext2 mt-1">Email cannot be changed</p>
            </div>
          )}

          {/* GitHub Username Section (Read-only) */}
          {user.githubUsername && (
            <div>
              <label className="block text-sm font-medium text-lighttext mb-2">
                GitHub Username
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-darkestgray rounded-lg text-lighttext2">
                <Github className="w-4 h-4" />
                <span>@{user.githubUsername}</span>
              </div>
              <p className="text-xs text-lighttext2 mt-1">GitHub username cannot be changed</p>
            </div>
          )}

          {/* Role Section (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-lighttext mb-2">
              Role
            </label>
            <div className="px-3 py-2 bg-darkestgray rounded-lg">
              <span className={`px-2 py-1 rounded text-xs ${
                user.role === 'admin' 
                  ? 'bg-yellow-500/20 text-yellow-500' 
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {user.role || 'user'}
              </span>
            </div>
            <p className="text-xs text-lighttext2 mt-1">Role is managed by administrators</p>
          </div>
        </div>
      </div>
    </div>
  );
}
