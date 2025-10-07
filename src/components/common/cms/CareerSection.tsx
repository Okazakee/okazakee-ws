'use client';

import { careerActions } from '@/app/actions/cms/sections/careerActions';
import type { CareerEntry } from '@/types/fetchedData.types';
import {
  Briefcase,
  Calendar,
  Edit3,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';

type CareerEntryWithEditing = CareerEntry & {
  isEditing: boolean;
};

type NewCareerEntry = {
  title: string;
  company: string;
  website_url: string;
  logo: string;
  blurhashURL: string;
  location_en: string;
  location_it: string;
  remote: 'full' | 'hybrid' | 'onSite';
  startDate: string;
  endDate: string | null;
  description_en: string;
  description_it: string;
  skills: string;
  company_description_en: string;
  company_description_it: string;
};

export default function CareerSection() {
  const [careerEntries, setCareerEntries] = useState<CareerEntryWithEditing[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCareerEntry, setNewCareerEntry] = useState<NewCareerEntry>({
    title: '',
    company: '',
    website_url: '',
    logo: '',
    blurhashURL: '',
    location_en: '',
    location_it: '',
    remote: 'onSite',
    startDate: '',
    endDate: null,
    description_en: '',
    description_it: '',
    skills: '',
    company_description_en: '',
    company_description_it: '',
  });

  // Drag and drop states
  const [dragStates, setDragStates] = useState<Record<string, boolean>>({});
  const [newEntryLogo, setNewEntryLogo] = useState<File | null>(null);

  useEffect(() => {
    fetchCareerData();
  }, []);

  const fetchCareerData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await careerActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch career data');
      }

      const entriesWithEditing = (result.data as CareerEntry[]).map(
        (entry: CareerEntry) => ({
          ...entry,
          isEditing: false,
        })
      );

      setCareerEntries(entriesWithEditing);
    } catch (error) {
      console.error('Error fetching career data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch career data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    entryId: number,
    field: string,
    value: string | boolean | null
  ) => {
    setCareerEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleNewEntryChange = (field: string, value: string | null) => {
    setNewCareerEntry((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCareer = async () => {
    if (!newEntryLogo) {
      setError('Please select a logo for the career entry');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await careerActions({
        type: 'CREATE',
        data: {
          ...newCareerEntry,
          logo: '', // Will be set after logo upload
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create career entry');
      }

      const newEntry = result.data as CareerEntry;

      // Upload logo
      const logoResult = await careerActions({
        type: 'UPLOAD_LOGO',
        careerId: newEntry.id,
        file: newEntryLogo,
      });

      if (!logoResult.success) {
        throw new Error(logoResult.error || 'Failed to upload logo');
      }

      // Reset form
      setNewCareerEntry({
        title: '',
        company: '',
        website_url: '',
        logo: '',
        blurhashURL: '',
        location_en: '',
        location_it: '',
        remote: 'onSite',
        startDate: '',
        endDate: null,
        description_en: '',
        description_it: '',
        skills: '',
        company_description_en: '',
        company_description_it: '',
      });
      setNewEntryLogo(null);
      setIsCreating(false);

      // Refresh data
      await fetchCareerData();
    } catch (error) {
      console.error('Error creating career entry:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create career entry'
      );
      setIsCreating(false);
    }
  };

  const handleUpdateCareer = async (entryId: number) => {
    const entry = careerEntries.find((e) => e.id === entryId);
    if (!entry) return;

    setError(null);

    try {
      const result = await careerActions({
        type: 'UPDATE',
        id: entryId,
        data: {
          title: entry.title,
          company: entry.company,
          website_url: entry.website_url,
          location_en: entry.location_en,
          location_it: entry.location_it,
          remote: entry.remote,
          startDate: entry.startDate,
          endDate: entry.endDate,
          description_en: entry.description_en,
          description_it: entry.description_it,
          skills: entry.skills,
          company_description_en: entry.company_description_en,
          company_description_it: entry.company_description_it,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update career entry');
      }

      // Update local state
      setCareerEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, isEditing: false } : e))
      );
    } catch (error) {
      console.error('Error updating career entry:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update career entry'
      );
    }
  };

  const handleDeleteCareer = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this career entry?')) return;

    setError(null);

    try {
      const result = await careerActions({ type: 'DELETE', id: entryId });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete career entry');
      }

      // Remove from local state
      setCareerEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (error) {
      console.error('Error deleting career entry:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete career entry'
      );
    }
  };

  const handleLogoUpload = async (entryId: number, file: File) => {
    setError(null);

    try {
      const entry = careerEntries.find((e) => e.id === entryId);
      if (!entry) return;

      const result = await careerActions({
        type: 'UPLOAD_LOGO',
        careerId: entryId,
        file,
        currentLogoUrl: entry.logo,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload logo');
      }

      // Refresh data to get updated logo
      await fetchCareerData();
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to upload logo'
      );
    }
  };

  const handleDragOver = (e: React.DragEvent, entryId: string) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [entryId]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, entryId: string) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [entryId]: false }));
  };

  const handleDrop = (e: React.DragEvent, entryId: string) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [entryId]: false }));

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith('image/'));

    if (imageFile) {
      if (entryId === 'new') {
        setNewEntryLogo(imageFile);
      } else {
        handleLogoUpload(parseInt(entryId), imageFile);
      }
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    entryId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (entryId === 'new') {
        setNewEntryLogo(file);
      } else {
        handleLogoUpload(parseInt(entryId), file);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-darktext dark:text-lighttext">
          Career Entries
        </h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-secondary transition-colors border-2 border-main hover:border-secondary"
        >
          <Plus className="h-4 w-4" />
          Add Career Entry
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isCreating && (
        <div className="p-6 bg-bglight dark:bg-darkgray rounded-lg border-2 border-main dark:border-main">
          <h3 className="text-lg font-semibold mb-4 text-darktext dark:text-lighttext">
            Create New Career Entry
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={newCareerEntry.title}
                onChange={(e) => handleNewEntryChange('title', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                placeholder="Enter job title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                Company
              </label>
              <input
                type="text"
                value={newCareerEntry.company}
                onChange={(e) => handleNewEntryChange('company', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                placeholder="Enter company name"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-main dark:text-main mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={newCareerEntry.website_url}
              onChange={(e) => handleNewEntryChange('website_url', e.target.value)}
              className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
              placeholder="https://company.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                English Location
              </label>
              <input
                type="text"
                value={newCareerEntry.location_en}
                onChange={(e) => handleNewEntryChange('location_en', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                placeholder="Enter location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                Italian Location
              </label>
              <input
                type="text"
                value={newCareerEntry.location_it}
                onChange={(e) => handleNewEntryChange('location_it', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                placeholder="Enter location"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-main dark:text-main mb-1">
              Remote Type
            </label>
            <select
              value={newCareerEntry.remote}
              onChange={(e) => handleNewEntryChange('remote', e.target.value as 'full' | 'hybrid' | 'onSite')}
              className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
            >
              <option value="full">Full Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onSite">On Site</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={newCareerEntry.startDate}
                onChange={(e) => handleNewEntryChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                End Date
              </label>
              <input
                type="date"
                value={newCareerEntry.endDate || ''}
                onChange={(e) => handleNewEntryChange('endDate', e.target.value || null)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                English Description
              </label>
              <textarea
                value={newCareerEntry.description_en}
                onChange={(e) => handleNewEntryChange('description_en', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={3}
                placeholder="Enter job description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                Italian Description
              </label>
              <textarea
                value={newCareerEntry.description_it}
                onChange={(e) => handleNewEntryChange('description_it', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={3}
                placeholder="Enter job description"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                English Company Description
              </label>
              <textarea
                value={newCareerEntry.company_description_en}
                onChange={(e) => handleNewEntryChange('company_description_en', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={3}
                placeholder="Enter company description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                Italian Company Description
              </label>
              <textarea
                value={newCareerEntry.company_description_it}
                onChange={(e) => handleNewEntryChange('company_description_it', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={3}
                placeholder="Enter company description"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-main dark:text-main mb-1">
              Skills
            </label>
            <input
              type="text"
              value={newCareerEntry.skills}
              onChange={(e) => handleNewEntryChange('skills', e.target.value)}
              className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
              placeholder="Enter skills (comma separated)"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-main dark:text-main mb-2">
              Company Logo
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragStates['new']
                  ? 'border-main bg-main/10 dark:bg-main/20'
                  : 'border-main dark:border-main'
              }`}
              onDragOver={(e) => handleDragOver(e, 'new')}
              onDragLeave={(e) => handleDragLeave(e, 'new')}
              onDrop={(e) => handleDrop(e, 'new')}
            >
              {newEntryLogo ? (
                <div className="space-y-2">
                  <Image
                    src={URL.createObjectURL(newEntryLogo)}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="mx-auto rounded-lg"
                  />
                  <p className="text-sm text-darktext dark:text-lighttext2">
                    {newEntryLogo.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Briefcase className="h-8 w-8 mx-auto text-main dark:text-main" />
                  <p className="text-sm text-darktext dark:text-lighttext2">
                    Drag and drop a logo here, or click to select
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileInputChange(e, 'new')}
                className="hidden"
                id="new-entry-logo"
              />
              <label
                htmlFor="new-entry-logo"
                className="mt-2 inline-block px-4 py-2 bg-secondary text-white rounded-lg cursor-pointer hover:bg-tertiary transition-colors border-2 border-secondary hover:border-tertiary"
              >
                Select Logo
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateCareer}
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-secondary disabled:opacity-50 transition-colors border-2 border-main hover:border-secondary"
            >
              <Save className="h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create Career Entry'}
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-darkgray dark:bg-darkergray text-lighttext dark:text-lighttext rounded-lg hover:bg-darkergray dark:hover:bg-darkestgray transition-colors border-2 border-darkgray dark:border-darkergray hover:border-darkergray dark:hover:border-darkestgray"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {careerEntries.map((entry) => (
          <div
            key={entry.id}
            className="bg-bglight dark:bg-darkgray rounded-lg border-2 border-main dark:border-main overflow-hidden"
          >
            <div className="relative">
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  dragStates[entry.id.toString()]
                    ? 'border-main bg-main/10 dark:bg-main/20'
                    : 'border-main dark:border-main'
                }`}
                onDragOver={(e) => handleDragOver(e, entry.id.toString())}
                onDragLeave={(e) => handleDragLeave(e, entry.id.toString())}
                onDrop={(e) => handleDrop(e, entry.id.toString())}
              >
                {entry.logo ? (
                  <Image
                    src={entry.logo}
                    alt={entry.company}
                    width={200}
                    height={200}
                    className="w-full h-32 object-contain rounded-lg"
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center bg-bglight dark:bg-darkergray rounded-lg">
                    <Briefcase className="h-8 w-8 text-main dark:text-main" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileInputChange(e, entry.id.toString())}
                  className="hidden"
                  id={`logo-${entry.id}`}
                />
                <label
                  htmlFor={`logo-${entry.id}`}
                  className="mt-2 inline-block px-3 py-1 bg-secondary text-white rounded-sm text-sm cursor-pointer hover:bg-tertiary transition-colors border border-secondary hover:border-tertiary"
                >
                  <Upload className="h-3 w-3 inline mr-1" />
                  Change Logo
                </label>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-darktext dark:text-lighttext">
                  {entry.title}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      handleInputChange(entry.id, 'isEditing', !entry.isEditing)
                    }
                    className="p-1 text-main hover:text-secondary transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCareer(entry.id)}
                    className="p-1 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-darktext dark:text-lighttext2 mb-1">
                {entry.company}
              </p>

              <div className="flex items-center gap-2 text-xs text-darktext dark:text-lighttext2">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(entry.startDate).toLocaleDateString()} - {entry.endDate ? new Date(entry.endDate).toLocaleDateString() : 'Present'}
                </span>
              </div>

              {entry.isEditing && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'title', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={entry.company}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'company', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={entry.website_url}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'website_url', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      English Location
                    </label>
                    <input
                      type="text"
                      value={entry.location_en}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'location_en', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Italian Location
                    </label>
                    <input
                      type="text"
                      value={entry.location_it}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'location_it', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Remote Type
                    </label>
                    <select
                      value={entry.remote}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'remote', e.target.value as 'full' | 'hybrid' | 'onSite')
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    >
                      <option value="full">Full Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onSite">On Site</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={entry.startDate}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'startDate', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={entry.endDate || ''}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'endDate', e.target.value || null)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Skills
                    </label>
                    <input
                      type="text"
                      value={entry.skills}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'skills', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      English Description
                    </label>
                    <textarea
                      value={entry.description_en}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'description_en', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Italian Description
                    </label>
                    <textarea
                      value={entry.description_it}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'description_it', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      English Company Description
                    </label>
                    <textarea
                      value={entry.company_description_en}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'company_description_en', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Italian Company Description
                    </label>
                    <textarea
                      value={entry.company_description_it}
                      onChange={(e) =>
                        handleInputChange(entry.id, 'company_description_it', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded-sm focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCareer(entry.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-main text-white text-sm rounded-sm hover:bg-secondary transition-colors border border-main hover:border-secondary"
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </button>
                    <button
                      onClick={() =>
                        handleInputChange(entry.id, 'isEditing', false)
                      }
                      className="px-3 py-1 bg-darkgray dark:bg-darkergray text-lighttext dark:text-lighttext text-sm rounded-sm hover:bg-darkergray dark:hover:bg-darkestgray transition-colors border border-darkgray dark:border-darkergray hover:border-darkergray dark:hover:border-darkestgray"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {careerEntries.length === 0 && !isCreating && (
        <div className="text-center py-8">
          <Briefcase className="h-12 w-12 mx-auto text-main dark:text-main mb-4" />
          <p className="text-darktext dark:text-lighttext2">
            No career entries found. Create your first career entry!
          </p>
        </div>
      )}
    </div>
  );
}