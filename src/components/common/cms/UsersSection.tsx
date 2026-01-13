'use client';

import { updateUserDisplayName, uploadUserAvatar, usersActions } from '@/app/actions/cms/sections/usersActions';
import { useLayoutStore } from '@/store/layoutStore';
import {
  Camera,
  Check,
  Crown,
  Github,
  Mail,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type AllowedUser = {
  id: number;
  email: string | null;
  github_username: string | null;
  role: 'admin' | 'editor';
  invited_at: string | null;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function UsersSection() {
  const { user } = useLayoutStore();
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addType, setAddType] = useState<'email' | 'github'>('email');
  const [newUserInput, setNewUserInput] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAvatarFor, setUploadingAvatarFor] = useState<string | null>(null);
  const [editingNameFor, setEditingNameFor] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [savingNameFor, setSavingNameFor] = useState<string | null>(null);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await usersActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }
      setUsers(result.data as AllowedUser[]);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserInput.trim()) {
      setError('Please enter an email or GitHub username');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = addType === 'email'
        ? await usersActions({ type: 'ADD_EMAIL', email: newUserInput, role: newUserRole })
        : await usersActions({ type: 'ADD_GITHUB', github_username: newUserInput, role: newUserRole });

      if (!result.success) {
        throw new Error(result.error || 'Failed to add user');
      }

      setNewUserInput('');
      setIsAdding(false);
      await fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (id: number, newRole: 'admin' | 'editor') => {
    setError(null);

    try {
      const result = await usersActions({ type: 'UPDATE_ROLE', id, role: newRole });
      if (!result.success) {
        throw new Error(result.error || 'Failed to update role');
      }
      await fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveUser = async (id: number) => {
    if (!confirm('Are you sure you want to remove this user from the allowed list?')) {
      return;
    }

    setError(null);

    try {
      const result = await usersActions({ type: 'REMOVE', id });
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove user');
      }
      await fetchUsers();
    } catch (err) {
      console.error('Error removing user:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    }
  };

  const handleAvatarClick = (profileId: string) => {
    const input = fileInputRefs.current.get(profileId);
    if (input) {
      input.click();
    }
  };

  const handleAvatarChange = async (profileId: string, file: File) => {
    setUploadingAvatarFor(profileId);
    setError(null);

    const formData = new FormData();
    formData.append('profileId', profileId);
    formData.append('avatar', file);

    try {
      const result = await uploadUserAvatar(formData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload avatar');
      }
      await fetchUsers();
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploadingAvatarFor(null);
    }
  };

  const handleEditNameClick = (profileId: string, currentName: string) => {
    setEditingNameFor(profileId);
    setEditedName(currentName || '');
  };

  const handleSaveName = async (profileId: string) => {
    if (!editedName.trim()) return;

    setSavingNameFor(profileId);
    setError(null);

    try {
      const result = await updateUserDisplayName(profileId, editedName.trim());
      if (!result.success) {
        throw new Error(result.error || 'Failed to update display name');
      }
      setEditingNameFor(null);
      setEditedName('');
      await fetchUsers();
    } catch (err) {
      console.error('Error updating display name:', err);
      setError(err instanceof Error ? err.message : 'Failed to update display name');
    } finally {
      setSavingNameFor(null);
    }
  };

  const handleCancelEditName = () => {
    setEditingNameFor(null);
    setEditedName('');
  };

  if (isLoading) {
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
          Manage Users
        </h1>
        <p className="text-lighttext2 text-lg">
          Control who can access the CMS
        </p>
      </div>

      {!isAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-center">
          <Shield className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
          <p className="text-yellow-500">
            You need admin privileges to manage users. Contact an administrator.
          </p>
        </div>
      )}

      {/* Add User Section */}
      {isAdmin && (
        <div className="bg-darkergray rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-main flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New User
            </h2>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            )}
          </div>

          {isAdding && (
            <div className="space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddType('email')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    addType === 'email'
                      ? 'bg-main text-white'
                      : 'bg-darkestgray text-lighttext2 hover:bg-darkgray'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email Invite
                </button>
                <button
                  type="button"
                  onClick={() => setAddType('github')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    addType === 'github'
                      ? 'bg-main text-white'
                      : 'bg-darkestgray text-lighttext2 hover:bg-darkgray'
                  }`}
                >
                  <Github className="w-4 h-4" />
                  GitHub Username
                </button>
              </div>

              {/* Input fields */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-lighttext mb-2">
                    {addType === 'email' ? 'Email Address' : 'GitHub Username'}
                  </label>
                  <input
                    type={addType === 'email' ? 'email' : 'text'}
                    value={newUserInput}
                    onChange={(e) => setNewUserInput(e.target.value)}
                    placeholder={addType === 'email' ? 'user@example.com' : '@username'}
                    className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lighttext mb-2">
                    Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'editor')}
                    className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Info text */}
              <p className="text-sm text-lighttext2">
                {addType === 'email'
                  ? '📧 An invitation email will be sent automatically. The user will set their password.'
                  : '🔗 The user can log in immediately using GitHub OAuth (no invite needed).'}
              </p>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddUser}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  {isSubmitting ? 'Adding...' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewUserInput('');
                    setError(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-darkestgray hover:bg-darkgray text-lighttext font-medium rounded-lg transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Users List */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-xl font-bold text-main mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Allowed Users ({users.length})
        </h2>

        {users.length === 0 ? (
          <div className="text-center py-8 text-lighttext2">
            No users in the allowed list yet.
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((allowedUser) => {
              const hasProfile = !!allowedUser.profile;
              const isUploadingThis = uploadingAvatarFor === allowedUser.profile?.id;

              return (
                <div
                  key={allowedUser.id}
                  className="flex items-center justify-between bg-darkestgray rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar / Icon */}
                    {hasProfile && isAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAvatarClick(allowedUser.profile!.id)}
                          disabled={isUploadingThis}
                          className="relative w-10 h-10 rounded-full overflow-hidden bg-darkgray flex-shrink-0 group cursor-pointer"
                        >
                          {allowedUser.profile?.avatar_url ? (
                            <Image
                              src={allowedUser.profile.avatar_url}
                              alt={allowedUser.profile.display_name || 'User'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-main text-white text-sm font-bold">
                              {(allowedUser.profile?.display_name || allowedUser.email || allowedUser.github_username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* Upload overlay */}
                          <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${isUploadingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isUploadingThis ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </button>
                        <input
                          ref={(el) => {
                            if (el && allowedUser.profile?.id) {
                              fileInputRefs.current.set(allowedUser.profile.id, el);
                            }
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && allowedUser.profile?.id) {
                              handleAvatarChange(allowedUser.profile.id, file);
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </>
                    ) : hasProfile ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-darkgray flex-shrink-0">
                        {allowedUser.profile?.avatar_url ? (
                          <Image
                            src={allowedUser.profile.avatar_url}
                            alt={allowedUser.profile.display_name || 'User'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-main text-white text-sm font-bold">
                            {(allowedUser.profile?.display_name || allowedUser.email || allowedUser.github_username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        allowedUser.github_username ? 'bg-gray-700' : 'bg-blue-600/20'
                      }`}>
                        {allowedUser.github_username ? (
                          <Github className="w-5 h-5 text-white" />
                        ) : (
                          <Mail className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                    )}

                    {/* User info */}
                    <div>
                      <div className="flex items-center gap-2">
                        {hasProfile && isAdmin && editingNameFor === allowedUser.profile?.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="w-28 px-1 py-0.5 text-sm bg-darkgray border border-main rounded text-lighttext focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName(allowedUser.profile!.id);
                                if (e.key === 'Escape') handleCancelEditName();
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveName(allowedUser.profile!.id)}
                              disabled={savingNameFor === allowedUser.profile?.id}
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
                            <span className="font-medium text-lighttext">
                              {allowedUser.profile?.display_name || allowedUser.email || `@${allowedUser.github_username}`}
                            </span>
                            {hasProfile && isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleEditNameClick(allowedUser.profile!.id, allowedUser.profile?.display_name || '')}
                                className="p-0.5 text-lighttext2 hover:text-main"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                        {allowedUser.role === 'admin' && editingNameFor !== allowedUser.profile?.id && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-lighttext2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          allowedUser.role === 'admin' 
                            ? 'bg-yellow-500/20 text-yellow-500' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {allowedUser.role}
                        </span>
                        {!hasProfile && (
                          <span className="text-yellow-500 text-xs">Not logged in yet</span>
                        )}
                        {allowedUser.invited_at && !hasProfile && (
                          <span>Invited {new Date(allowedUser.invited_at).toLocaleDateString()}</span>
                        )}
                        {allowedUser.github_username && (
                          <span className="flex items-center gap-1">
                            <Github className="w-3 h-3" />
                            @{allowedUser.github_username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <select
                        value={allowedUser.role}
                        onChange={(e) => handleUpdateRole(allowedUser.id, e.target.value as 'admin' | 'editor')}
                        className="px-2 py-1 bg-darkgray border border-lighttext2 rounded text-sm text-lighttext focus:border-main focus:outline-hidden"
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(allowedUser.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
