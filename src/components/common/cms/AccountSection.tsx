'use client';

import {
  Camera,
  Check,
  Github,
  Mail,
  Pencil,
  Trash2,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { deleteMyAccount } from '@/app/actions/cms/deleteAccount';
import { getUser } from '@/app/actions/cms/getUser';
import { updateMyProfile } from '@/app/actions/cms/sections/usersActions';
import { useLayoutStore } from '@/store/layoutStore';
import { processImageToWebP } from '@/utils/imageProcessor';

export default function AccountSection() {
  const { user, setUser } = useLayoutStore();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

    try {
      // Process image to WebP before upload
      const processed = await processImageToWebP(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.85,
      });

      if (!processed.success || !processed.file) {
        throw new Error(processed.error || 'Failed to process image');
      }

      const formData = new FormData();
      formData.append('avatar', processed.file);

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
      setError(
        err instanceof Error ? err.message : 'Failed to update display name'
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setEditedName(user?.displayName || '');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteMyAccount();
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }
      // Redirect to login page after successful deletion
      router.push(`/${locale}/cms/login`);
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8 md:mb-0 lg:mt-0">
      <div className="text-center mb-8">
        <h1 className="hidden lg:block text-4xl font-bold text-main mb-4">
          My Account
        </h1>
        <p className="text-lighttext2 text-lg">Manage your profile settings</p>
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
                <div
                  className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
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
              <p className="text-xs text-lighttext2">
                Click to upload a new avatar
              </p>
            </div>
          </div>

          {/* Display Name Section */}
          <div>
            <label htmlFor="display-name-input" className="block text-sm font-medium text-lighttext mb-2">
              Display Name
            </label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  id="display-name-input"
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-darkestgray border border-main rounded-lg text-lighttext focus:outline-none"
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
              <div className="block text-sm font-medium text-lighttext mb-2">
                Email Address
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-darkestgray rounded-lg text-lighttext2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <p className="text-xs text-lighttext2 mt-1">
                Email cannot be changed
              </p>
            </div>
          )}

          {/* GitHub Username Section (Read-only) */}
          {user.githubUsername && (
            <div>
              <div className="block text-sm font-medium text-lighttext mb-2">
                GitHub Username
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-darkestgray rounded-lg text-lighttext2">
                <Github className="w-4 h-4" />
                <span>@{user.githubUsername}</span>
              </div>
              <p className="text-xs text-lighttext2 mt-1">
                GitHub username cannot be changed
              </p>
            </div>
          )}

          {/* Role Section (Read-only) */}
          <div>
            <div className="block text-sm font-medium text-lighttext mb-2">
              Role
            </div>
            <div className="px-3 py-2 bg-darkestgray rounded-lg">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  user.role === 'admin'
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {user.role || 'user'}
              </span>
            </div>
            <p className="text-xs text-lighttext2 mt-1">
              Role is managed by administrators
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-lighttext2 mb-4">
          Once you delete your account, there is no going back. This will
          permanently delete your account and all associated data.
        </p>

        {showDeleteConfirm ? (
          <div className="space-y-4">
            <div className="bg-darkestgray rounded-lg p-4 border border-red-500/50">
              <p className="text-red-400 font-semibold mb-2">
                Are you absolutely sure?
              </p>
              <p className="text-lighttext2 text-sm">
                This action cannot be undone. This will permanently delete your
                account, profile, and all associated data.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, delete my account
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-darkgray hover:bg-darkergray text-lighttext font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 font-medium rounded-lg transition-colors border border-red-500/50"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        )}
      </div>
    </div>
  );
}
