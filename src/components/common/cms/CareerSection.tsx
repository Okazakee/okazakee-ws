'use client';

import { careerActions } from '@/app/actions/cms/sections/careerActions';
import type { CareerEntry } from '@/types/fetchedData.types';
import {
  Briefcase,
  Calendar,
  Code,
  Edit3,
  FileText,
  Globe,
  MapPin,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';
import { ErrorDiv } from '../ErrorDiv';

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

  const toggleEditing = (entryId: number) => {
    setCareerEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, isEditing: !entry.isEditing } : entry
      )
    );
  };

  const handleCreateCareer = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await careerActions({
        type: 'CREATE',
        data: newCareerEntry,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create career entry');
      }

      // Upload logo if provided
      if (newEntryLogo && result.data) {
        const createdEntry = result.data as CareerEntry;
        await careerActions({
          type: 'UPLOAD_LOGO',
          careerId: createdEntry.id,
          file: newEntryLogo,
        });
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

      // Refresh data
      await fetchCareerData();
    } catch (error) {
      console.error('Error creating career entry:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create career entry'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCareer = async (entryId: number) => {
    setError(null);

    try {
      const entry = careerEntries.find((e) => e.id === entryId);
      if (!entry) return;

      const result = await careerActions({
        type: 'UPDATE',
        id: entryId,
        data: {
          title: entry.title,
          company: entry.company,
          website_url: entry.website_url,
          logo: entry.logo,
          blurhashURL: entry.blurhashURL,
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

      toggleEditing(entryId);
      await fetchCareerData();
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
      const result = await careerActions({
        type: 'DELETE',
        id: entryId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete career entry');
      }

      await fetchCareerData();
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

      await fetchCareerData();
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to upload logo'
      );
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, entryId: number) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [`logo-${entryId}`]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, entryId: number) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [`logo-${entryId}`]: false }));
  };

  const handleDrop = (e: React.DragEvent, entryId: number) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [`logo-${entryId}`]: false }));

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleLogoUpload(entryId, file);
      }
    }
  };

  // New entry logo handlers
  const handleNewEntryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, 'new-entry-logo': true }));
  };

  const handleNewEntryDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, 'new-entry-logo': false }));
  };

  const handleNewEntryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, 'new-entry-logo': false }));

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setNewEntryLogo(file);
      }
    }
  };

  const handleNewEntryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      setNewEntryLogo(file);
    }
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
          Career Section Editor
        </h1>
        <p className="text-lighttext2 text-lg">
          Manage your professional experience and career entries
        </p>
      </div>

      {/* Create New Career Entry */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4">
          Add New Career Entry
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="new-title"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Job Title *
            </label>
            <input
              id="new-title"
              type="text"
              value={newCareerEntry.title}
              onChange={(e) => handleNewEntryChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="e.g., Senior Developer"
            />
          </div>

          <div>
            <label
              htmlFor="new-company"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Company *
            </label>
            <input
              id="new-company"
              type="text"
              value={newCareerEntry.company}
              onChange={(e) => handleNewEntryChange('company', e.target.value)}
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="e.g., Tech Corp"
            />
          </div>

          <div>
            <label
              htmlFor="new-website"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Website URL
            </label>
            <input
              id="new-website"
              type="url"
              value={newCareerEntry.website_url}
              onChange={(e) =>
                handleNewEntryChange('website_url', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="https://company.com"
            />
          </div>

          <div>
            <label
              htmlFor="new-location-en"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Location (EN) *
            </label>
            <input
              id="new-location-en"
              type="text"
              value={newCareerEntry.location_en}
              onChange={(e) =>
                handleNewEntryChange('location_en', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="e.g., New York, NY"
            />
          </div>

          <div>
            <label
              htmlFor="new-location-it"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Location (IT) *
            </label>
            <input
              id="new-location-it"
              type="text"
              value={newCareerEntry.location_it}
              onChange={(e) =>
                handleNewEntryChange('location_it', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="e.g., Milano, Italia"
            />
          </div>

          <div>
            <label
              htmlFor="new-remote"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Remote Type *
            </label>
            <select
              id="new-remote"
              value={newCareerEntry.remote}
              onChange={(e) =>
                handleNewEntryChange(
                  'remote',
                  e.target.value as 'full' | 'hybrid' | 'onSite'
                )
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
            >
              <option value="onSite">On Site</option>
              <option value="hybrid">Hybrid</option>
              <option value="full">Full Remote</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="new-start-date"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Start Date *
            </label>
            <input
              id="new-start-date"
              type="date"
              value={newCareerEntry.startDate}
              onChange={(e) =>
                handleNewEntryChange('startDate', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-end-date"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              End Date
            </label>
            <input
              id="new-end-date"
              type="date"
              value={newCareerEntry.endDate || ''}
              onChange={(e) =>
                handleNewEntryChange('endDate', e.target.value || null)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-skills"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Skills
            </label>
            <input
              id="new-skills"
              type="text"
              value={newCareerEntry.skills}
              onChange={(e) => handleNewEntryChange('skills', e.target.value)}
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="React, TypeScript, Node.js"
            />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="new-description-en"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Description (EN) *
            </label>
            <textarea
              id="new-description-en"
              value={newCareerEntry.description_en}
              onChange={(e) =>
                handleNewEntryChange('description_en', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[100px]"
              placeholder="Describe your role and achievements..."
            />
          </div>

          <div>
            <label
              htmlFor="new-description-it"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Description (IT) *
            </label>
            <textarea
              id="new-description-it"
              value={newCareerEntry.description_it}
              onChange={(e) =>
                handleNewEntryChange('description_it', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[100px]"
              placeholder="Descrivi il tuo ruolo e i risultati..."
            />
          </div>

          <div>
            <label
              htmlFor="new-company-desc-en"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Company Description (EN)
            </label>
            <textarea
              id="new-company-desc-en"
              value={newCareerEntry.company_description_en}
              onChange={(e) =>
                handleNewEntryChange('company_description_en', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[80px]"
              placeholder="Brief description of the company..."
            />
          </div>

          <div>
            <label
              htmlFor="new-company-desc-it"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Company Description (IT)
            </label>
            <textarea
              id="new-company-desc-it"
              value={newCareerEntry.company_description_it}
              onChange={(e) =>
                handleNewEntryChange('company_description_it', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[80px]"
              placeholder="Breve descrizione dell'azienda..."
            />
          </div>
        </div>

        {/* Logo Upload for New Entry */}
        <div className="mt-4">
          <label
            htmlFor="new-entry-logo-upload"
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Company Logo
          </label>
          <div
            className="relative border-2 border-dashed border-lighttext2 rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-main"
            onDragOver={handleNewEntryDragOver}
            onDragLeave={handleNewEntryDragLeave}
            onDrop={handleNewEntryDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleNewEntryFileChange}
              className="hidden"
              id="new-entry-logo-upload"
            />
            <label htmlFor="new-entry-logo-upload" className="cursor-pointer">
              {newEntryLogo ? (
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-main" />
                    <p className="text-lighttext font-medium">
                      {newEntryLogo.name}
                    </p>
                    <p className="text-sm text-lighttext2">
                      Click to change logo
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-lighttext2" />
                  <p className="text-lighttext2 font-medium">
                    Drop logo here or click to browse
                  </p>
                </>
              )}
            </label>
            {dragStates['new-entry-logo'] && (
              <div className="absolute inset-0 bg-main/80 flex items-center justify-center rounded-lg border-2 border-dashed border-white">
                <div className="text-center text-white">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-medium">Drop logo here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleCreateCareer}
            disabled={
              isCreating || !newCareerEntry.title || !newCareerEntry.company
            }
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Creating...' : 'Create Career Entry'}
          </button>
        </div>
      </div>

      {/* Manage Career Entries */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4">
          Manage Career Entries
        </h2>

        {careerEntries.length === 0 ? (
          <div className="text-center py-8 text-lighttext2">
            No career entries found. Add your first career entry above.
          </div>
        ) : (
          <div className="space-y-6">
            {careerEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-darkestgray rounded-lg p-6 border border-lighttext2"
              >
                {entry.isEditing ? (
                  <EditCareerForm
                    entry={entry}
                    onSave={() => handleUpdateCareer(entry.id)}
                    onCancel={() => toggleEditing(entry.id)}
                    onInputChange={handleInputChange}
                    onLogoUpload={handleLogoUpload}
                    dragStates={dragStates}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                  />
                ) : (
                  <CareerDisplay
                    entry={entry}
                    onEdit={() => toggleEditing(entry.id)}
                    onDelete={() => handleDeleteCareer(entry.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}

function CareerDisplay({
  entry,
  onEdit,
  onDelete,
}: {
  entry: CareerEntryWithEditing;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4 flex-1">
        {entry.logo && (
          <div className="flex-shrink-0">
            <Image
              src={entry.logo}
              width={60}
              height={60}
              className="rounded-lg"
              alt={`${entry.company} logo`}
              placeholder={entry.blurhashURL ? 'blur' : 'empty'}
              blurDataURL={entry.blurhashURL || undefined}
            />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-lighttext2" />
            <h3 className="text-lg font-bold text-lighttext">{entry.title}</h3>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-lighttext2" />
            <span className="text-lighttext font-medium">{entry.company}</span>
            {entry.website_url && (
              <a
                href={entry.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-main hover:underline text-sm"
              >
                (Website)
              </a>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-lighttext2 mb-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{entry.location_en}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(entry.startDate).toLocaleDateString()} -{' '}
                {entry.endDate
                  ? new Date(entry.endDate).toLocaleDateString()
                  : 'Present'}
              </span>
            </div>
            <span className="capitalize">{entry.remote}</span>
          </div>

          {entry.skills && (
            <div className="flex items-center gap-1 text-sm text-lighttext2 mb-2">
              <Code className="w-3 h-3" />
              <span>{entry.skills}</span>
            </div>
          )}

          <div className="text-sm text-lighttext2 line-clamp-2">
            {entry.description_en}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="p-2 text-lighttext2 hover:text-main transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-lighttext2 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EditCareerForm({
  entry,
  onSave,
  onCancel,
  onInputChange,
  onLogoUpload,
  dragStates,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}: {
  entry: CareerEntryWithEditing;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: (
    entryId: number,
    field: string,
    value: string | boolean | null
  ) => void;
  onLogoUpload: (entryId: number, file: File) => void;
  dragStates: Record<string, boolean>;
  handleDragOver: (e: React.DragEvent, entryId: number) => void;
  handleDragLeave: (e: React.DragEvent, entryId: number) => void;
  handleDrop: (e: React.DragEvent, entryId: number) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      onLogoUpload(entry.id, file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor={`edit-title-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Job Title *
          </label>
          <input
            id={`edit-title-${entry.id}`}
            type="text"
            value={entry.title}
            onChange={(e) => onInputChange(entry.id, 'title', e.target.value)}
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-company-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Company *
          </label>
          <input
            id={`edit-company-${entry.id}`}
            type="text"
            value={entry.company}
            onChange={(e) => onInputChange(entry.id, 'company', e.target.value)}
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-website-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Website URL
          </label>
          <input
            id={`edit-website-${entry.id}`}
            type="url"
            value={entry.website_url}
            onChange={(e) =>
              onInputChange(entry.id, 'website_url', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-location-en-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Location (EN) *
          </label>
          <input
            id={`edit-location-en-${entry.id}`}
            type="text"
            value={entry.location_en}
            onChange={(e) =>
              onInputChange(entry.id, 'location_en', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-location-it-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Location (IT) *
          </label>
          <input
            id={`edit-location-it-${entry.id}`}
            type="text"
            value={entry.location_it}
            onChange={(e) =>
              onInputChange(entry.id, 'location_it', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-remote-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Remote Type *
          </label>
          <select
            id={`edit-remote-${entry.id}`}
            value={entry.remote}
            onChange={(e) =>
              onInputChange(
                entry.id,
                'remote',
                e.target.value as 'full' | 'hybrid' | 'onSite'
              )
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          >
            <option value="onSite">On Site</option>
            <option value="hybrid">Hybrid</option>
            <option value="full">Full Remote</option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`edit-start-date-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Start Date *
          </label>
          <input
            id={`edit-start-date-${entry.id}`}
            type="date"
            value={entry.startDate}
            onChange={(e) =>
              onInputChange(entry.id, 'startDate', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-end-date-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            End Date
          </label>
          <input
            id={`edit-end-date-${entry.id}`}
            type="date"
            value={entry.endDate || ''}
            onChange={(e) =>
              onInputChange(entry.id, 'endDate', e.target.value || null)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-skills-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Skills
          </label>
          <input
            id={`edit-skills-${entry.id}`}
            type="text"
            value={entry.skills}
            onChange={(e) => onInputChange(entry.id, 'skills', e.target.value)}
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>
      </div>

      {/* Logo Upload */}
      <div>
        <label
          htmlFor={`logo-upload-${entry.id}`}
          className="block text-sm font-medium text-lighttext mb-2"
        >
          Company Logo
        </label>
        <div
          className="relative border-2 border-dashed border-lighttext2 rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-main"
          onDragOver={(e) => handleDragOver(e, entry.id)}
          onDragLeave={(e) => handleDragLeave(e, entry.id)}
          onDrop={(e) => handleDrop(e, entry.id)}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={`logo-upload-${entry.id}`}
          />
          <label htmlFor={`logo-upload-${entry.id}`} className="cursor-pointer">
            {entry.logo ? (
              <div className="flex items-center justify-center">
                <Image
                  src={entry.logo}
                  width={80}
                  height={80}
                  className="rounded-lg"
                  alt={`${entry.company} logo`}
                  placeholder={entry.blurhashURL ? 'blur' : 'empty'}
                  blurDataURL={entry.blurhashURL || undefined}
                />
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-lighttext2" />
                <p className="text-lighttext2 font-medium">
                  Drop logo here or click to browse
                </p>
              </>
            )}
          </label>
          {dragStates[`logo-${entry.id}`] && (
            <div className="absolute inset-0 bg-main/80 flex items-center justify-center rounded-lg border-2 border-dashed border-white">
              <div className="text-center text-white">
                <Upload className="w-12 h-12 mx-auto mb-2" />
                <p className="font-medium">Drop logo here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor={`edit-description-en-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Description (EN) *
          </label>
          <textarea
            id={`edit-description-en-${entry.id}`}
            value={entry.description_en}
            onChange={(e) =>
              onInputChange(entry.id, 'description_en', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[100px]"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-description-it-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Description (IT) *
          </label>
          <textarea
            id={`edit-description-it-${entry.id}`}
            value={entry.description_it}
            onChange={(e) =>
              onInputChange(entry.id, 'description_it', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[100px]"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-company-desc-en-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Company Description (EN)
          </label>
          <textarea
            id={`edit-company-desc-en-${entry.id}`}
            value={entry.company_description_en}
            onChange={(e) =>
              onInputChange(entry.id, 'company_description_en', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[80px]"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-company-desc-it-${entry.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Company Description (IT)
          </label>
          <textarea
            id={`edit-company-desc-it-${entry.id}`}
            value={entry.company_description_it}
            onChange={(e) =>
              onInputChange(entry.id, 'company_description_it', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[80px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}
