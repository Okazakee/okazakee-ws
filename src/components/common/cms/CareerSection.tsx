'use client';

import { careerActions } from '@/app/actions/cms/sections/careerActions';
import { i18nActions } from '@/app/actions/cms/sections/i18nActions';
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
  Eye,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';
import { PreviewModal } from './PreviewModal';
import { CareerPreview } from './previews/CareerPreview';

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

type EditableCareerEntry = CareerEntryWithEditing & {
  logo_file?: File | null;
};

export default function CareerSection() {
  const [careerEntries, setCareerEntries] = useState<EditableCareerEntry[]>(
    []
  );
  const [originalEntries, setOriginalEntries] = useState<EditableCareerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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

  // Track modifications
  const [modifiedEntries, setModifiedEntries] = useState<Set<number>>(new Set());
  const [newEntries, setNewEntries] = useState<Array<{ entry: EditableCareerEntry; logoFile: File | null }>>([]);
  const [deletedEntries, setDeletedEntries] = useState<Set<number>>(new Set());

  // Drag and drop states
  const [dragStates, setDragStates] = useState<Record<string, boolean>>({});
  const [newEntryLogo, setNewEntryLogo] = useState<File | null>(null);

  // Translation state
  const [translations, setTranslations] = useState<{
    en: {
      title: string;
      subtitle: string;
      present: string;
      month: string;
      months: string;
      year: string;
      years: string;
      remote: { full: string; hybrid: string; onSite: string };
    };
    it: {
      title: string;
      subtitle: string;
      present: string;
      month: string;
      months: string;
      year: string;
      years: string;
      remote: { full: string; hybrid: string; onSite: string };
    };
  }>({
    en: {
      title: '',
      subtitle: '',
      present: '',
      month: '',
      months: '',
      year: '',
      years: '',
      remote: { full: '', hybrid: '', onSite: '' },
    },
    it: {
      title: '',
      subtitle: '',
      present: '',
      month: '',
      months: '',
      year: '',
      years: '',
      remote: { full: '', hybrid: '', onSite: '' },
    },
  });
  const [originalTranslations, setOriginalTranslations] = useState(translations);
  const [translationLocale, setTranslationLocale] = useState<'en' | 'it'>('en');
  const [isTranslationsExpanded, setIsTranslationsExpanded] = useState(false);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  useEffect(() => {
    fetchCareerData();
    fetchTranslations();
  }, []);

  const fetchTranslations = async () => {
    setIsLoadingTranslations(true);
    try {
      const result = await i18nActions({ type: 'GET' });
      if (result.success && result.data) {
        const i18nData = result.data as Array<{
          language: string;
          translations: Record<string, unknown>;
        }>;
        
        const enData = i18nData.find((d) => d.language === 'en');
        const itData = i18nData.find((d) => d.language === 'it');
        
        const careerEn = (enData?.translations?.['career-section'] as {
          title?: string;
          subtitle?: string;
          present?: string;
          month?: string;
          months?: string;
          year?: string;
          years?: string;
          remote?: { full?: string; hybrid?: string; onSite?: string };
        }) || {};
        
        const careerIt = (itData?.translations?.['career-section'] as {
          title?: string;
          subtitle?: string;
          present?: string;
          month?: string;
          months?: string;
          year?: string;
          years?: string;
          remote?: { full?: string; hybrid?: string; onSite?: string };
        }) || {};
        
        const newTranslations = {
          en: {
            title: careerEn.title || '',
            subtitle: careerEn.subtitle || '',
            present: careerEn.present || '',
            month: careerEn.month || '',
            months: careerEn.months || '',
            year: careerEn.year || '',
            years: careerEn.years || '',
            remote: {
              full: careerEn.remote?.full || '',
              hybrid: careerEn.remote?.hybrid || '',
              onSite: careerEn.remote?.onSite || '',
            },
          },
          it: {
            title: careerIt.title || '',
            subtitle: careerIt.subtitle || '',
            present: careerIt.present || '',
            month: careerIt.month || '',
            months: careerIt.months || '',
            year: careerIt.year || '',
            years: careerIt.years || '',
            remote: {
              full: careerIt.remote?.full || '',
              hybrid: careerIt.remote?.hybrid || '',
              onSite: careerIt.remote?.onSite || '',
            },
          },
        };
        
        setTranslations(newTranslations);
        setOriginalTranslations(JSON.parse(JSON.stringify(newTranslations)));
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
    } finally {
      setIsLoadingTranslations(false);
    }
  };

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
          logo_file: null,
        })
      );

      setCareerEntries(entriesWithEditing);
      setOriginalEntries(JSON.parse(JSON.stringify(entriesWithEditing))); // Deep copy
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
    entryId: number | string,
    field: string,
    value: string | boolean | null
  ) => {
    const id = typeof entryId === 'string' ? parseInt(entryId) : entryId;
    setCareerEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
    // Track modification (only for existing entries, not new ones)
    if (id > 0) {
      setModifiedEntries((prev) => new Set(prev).add(id));
    }
  };

  const handleNewEntryChange = (field: string, value: string | null) => {
    setNewCareerEntry((prev) => ({ ...prev, [field]: value }));
  };

  const handleTranslationChange = (
    locale: 'en' | 'it',
    field: string,
    value: string
  ) => {
    setTranslations((prev) => {
      const newTranslations = { ...prev };
      if (field.startsWith('remote.')) {
        const remoteType = field.replace('remote.', '') as 'full' | 'hybrid' | 'onSite';
        newTranslations[locale].remote = {
          ...newTranslations[locale].remote,
          [remoteType]: value,
        };
      } else {
        (newTranslations[locale] as Record<string, unknown>)[field] = value;
      }
      return newTranslations;
    });
  };

  const hasTranslationChanges = () => {
    return JSON.stringify(translations) !== JSON.stringify(originalTranslations);
  };

  const hasChanges = () => {
    return (
      modifiedEntries.size > 0 ||
      newEntries.length > 0 ||
      deletedEntries.size > 0 ||
      hasTranslationChanges()
    );
  };

  const handleCreateCareer = () => {
    if (!newEntryLogo) {
      setError('Please select a logo for the career entry');
      return;
    }

    // Generate temporary ID (negative to avoid conflicts)
    const tempId = -Date.now();
    const newEntry: EditableCareerEntry = {
      id: tempId,
      title: newCareerEntry.title,
      company: newCareerEntry.company,
      website_url: newCareerEntry.website_url,
      logo: '',
      blurhashURL: '',
      location_en: newCareerEntry.location_en,
      location_it: newCareerEntry.location_it,
      remote: newCareerEntry.remote,
      startDate: newCareerEntry.startDate,
      endDate: newCareerEntry.endDate,
      description_en: newCareerEntry.description_en,
      description_it: newCareerEntry.description_it,
      skills: newCareerEntry.skills,
      company_description_en: newCareerEntry.company_description_en,
      company_description_it: newCareerEntry.company_description_it,
      isEditing: false,
      logo_file: newEntryLogo,
    };

    // Add to local state
    setCareerEntries((prev) => [...prev, newEntry]);
    setNewEntries((prev) => [...prev, { entry: newEntry, logoFile: newEntryLogo }]);

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
  };

  const handleUpdateCareer = (entryId: number | string) => {
    const id = typeof entryId === 'string' ? parseInt(entryId) : entryId;
    // Just close edit mode, changes are tracked in state
    setCareerEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isEditing: false } : e))
    );
  };

  const cancelEntryEdit = (entryId: number | string) => {
    const id = typeof entryId === 'string' ? parseInt(entryId) : entryId;
    // Revert to original data
    const originalEntry = originalEntries.find((e) => e.id === id);
    
    if (originalEntry) {
      setCareerEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...originalEntry, isEditing: false, logo_file: null }
            : entry
        )
      );
      // Remove from modified set
      setModifiedEntries((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeleteCareer = (entryId: number | string) => {
    if (!confirm('Are you sure you want to delete this career entry?')) return;

    const id = typeof entryId === 'string' ? parseInt(entryId) : entryId;

    // Check if it's a new entry (temp ID is negative)
    const isNewEntry = id < 0;
    
    if (isNewEntry) {
      // Remove from new entries
      setNewEntries((prev) => prev.filter((ne) => ne.entry.id !== id));
    } else {
      // Track for deletion
      setDeletedEntries((prev) => new Set(prev).add(id));
    }

    // Remove from modified entries if present
    setModifiedEntries((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    // Remove from local state
    setCareerEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleLogoUpload = (entryId: number | string, file: File) => {
    const id = typeof entryId === 'string' ? parseInt(entryId) : entryId;
    // Store file for later upload
    setCareerEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, logo_file: file } : entry
      )
    );
    // Track modification (only for existing entries)
    if (id > 0) {
      setModifiedEntries((prev) => new Set(prev).add(id));
    }
  };

  const cancelAllChanges = () => {
    if (!confirm('Are you sure you want to cancel all changes? All unsaved edits will be lost.')) {
      return;
    }

    // Reload original data
    fetchCareerData();
    fetchTranslations();
    
    // Reset all tracking
    setModifiedEntries(new Set());
    setNewEntries([]);
    setDeletedEntries(new Set());
    setIsCreating(false);
    setNewEntryLogo(null);
  };

  const applyAllChanges = async () => {
    try {
      setIsUpdating(true);
      setError(null);

      // 1. Delete entries
      for (const entryId of deletedEntries) {
        const result = await careerActions({ type: 'DELETE', id: entryId });

        if (!result.success) {
          throw new Error(result.error || `Failed to delete career entry ${entryId}`);
        }
      }

      // 2. Create new entries
      for (const { entry, logoFile } of newEntries) {
        // Create entry
        const createResult = await careerActions({
          type: 'CREATE',
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
            logo: '', // Will be set after logo upload
          },
        });

        if (!createResult.success) {
          throw new Error(createResult.error || `Failed to create career entry ${entry.title}`);
        }

        const createdEntry = createResult.data as CareerEntry;

        // Upload logo
        if (logoFile) {
          const logoResult = await careerActions({
            type: 'UPLOAD_LOGO',
            careerId: createdEntry.id,
            file: logoFile,
          });

          if (!logoResult.success) {
            throw new Error(logoResult.error || `Failed to upload logo for ${entry.title}`);
          }
        }
      }

      // 3. Update modified entries
      for (const entryId of modifiedEntries) {
        const entry = careerEntries.find((e) => e.id === entryId);
        if (!entry) continue;

        // Update entry data
        const updateResult = await careerActions({
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

        if (!updateResult.success) {
          throw new Error(updateResult.error || `Failed to update career entry ${entry.title}`);
        }

        // Upload logo if there's a new file
        if (entry.logo_file) {
          const logoResult = await careerActions({
            type: 'UPLOAD_LOGO',
            careerId: entryId,
            file: entry.logo_file,
            currentLogoUrl: entry.logo,
          });

          if (!logoResult.success) {
            throw new Error(logoResult.error || `Failed to upload logo for ${entry.title}`);
          }
        }
      }

      // Save translations if changed
      if (hasTranslationChanges()) {
        // Update English translations
        const enResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'en',
          sectionKey: 'career-section',
          sectionData: translations.en,
        });
        if (!enResult.success) {
          throw new Error(enResult.error || 'Failed to update English translations');
        }

        // Update Italian translations
        const itResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'it',
          sectionKey: 'career-section',
          sectionData: translations.it,
        });
        if (!itResult.success) {
          throw new Error(itResult.error || 'Failed to update Italian translations');
        }

        setOriginalTranslations(JSON.parse(JSON.stringify(translations)));
      }

      // Refresh data and reset all tracking
      await fetchCareerData();
      setModifiedEntries(new Set());
      setNewEntries([]);
      setDeletedEntries(new Set());

      alert('All changes applied successfully!');
    } catch (error) {
      console.error('Error applying changes:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to apply changes'
      );
    } finally {
      setIsUpdating(false);
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
    <div className="space-y-6 mb-8 md:mb-0 lg:mt-0">
      <div className="text-center mb-8">
        <h1 className="hidden lg:block text-4xl font-bold text-main mb-4">
          Career Section
        </h1>
        <p className="text-lighttext2 text-lg mb-4">
          Manage your career entries
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-darkgray hover:bg-darkergray text-lighttext font-medium rounded-lg transition-all duration-200 border border-lighttext2/20"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasChanges() || isUpdating}
            onClick={cancelAllChanges}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasChanges() || isUpdating}
            onClick={applyAllChanges}
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Applying Changes...
              </>
            ) : (
              'Apply Changes'
            )}
          </button>
        </div>
      </div>

      {/* Translations Section */}
      <div className="bg-darkergray rounded-xl p-6">
        <button
          type="button"
          onClick={() => setIsTranslationsExpanded(!isTranslationsExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-xl font-bold text-main mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Translations
          </h2>
          {isTranslationsExpanded ? (
            <ChevronUp className="w-5 h-5 text-lighttext2" />
          ) : (
            <ChevronDown className="w-5 h-5 text-lighttext2" />
          )}
        </button>

        {isTranslationsExpanded && (
          <div className="space-y-6 mt-4">
            {/* Locale Tabs */}
            <div className="flex gap-2 border-b border-darkgray">
              <button
                type="button"
                onClick={() => setTranslationLocale('en')}
                className={`px-4 py-2 font-medium transition-colors ${
                  translationLocale === 'en'
                    ? 'text-main border-b-2 border-main'
                    : 'text-lighttext2 hover:text-lighttext'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setTranslationLocale('it')}
                className={`px-4 py-2 font-medium transition-colors ${
                  translationLocale === 'it'
                    ? 'text-main border-b-2 border-main'
                    : 'text-lighttext2 hover:text-lighttext'
                }`}
              >
                Italian
              </button>
            </div>

            {isLoadingTranslations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-lighttext mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].title}
                    onChange={(e) =>
                      handleTranslationChange(translationLocale, 'title', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                    placeholder="e.g., Career History"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lighttext mb-2">
                    Subtitle
                  </label>
                  <textarea
                    value={translations[translationLocale].subtitle}
                    onChange={(e) =>
                      handleTranslationChange(translationLocale, 'subtitle', e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden resize-y"
                    placeholder="e.g., My professional journey and experience"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-lighttext mb-2">
                      Present
                    </label>
                    <input
                      type="text"
                      value={translations[translationLocale].present}
                      onChange={(e) =>
                        handleTranslationChange(translationLocale, 'present', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                      placeholder="e.g., Present"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-lighttext mb-2">
                      Month
                    </label>
                    <input
                      type="text"
                      value={translations[translationLocale].month}
                      onChange={(e) =>
                        handleTranslationChange(translationLocale, 'month', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                      placeholder="e.g., month"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-lighttext mb-2">
                      Months
                    </label>
                    <input
                      type="text"
                      value={translations[translationLocale].months}
                      onChange={(e) =>
                        handleTranslationChange(translationLocale, 'months', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                      placeholder="e.g., months"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-lighttext mb-2">
                      Year
                    </label>
                    <input
                      type="text"
                      value={translations[translationLocale].year}
                      onChange={(e) =>
                        handleTranslationChange(translationLocale, 'year', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                      placeholder="e.g., year"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-lighttext mb-2">
                      Years
                    </label>
                    <input
                      type="text"
                      value={translations[translationLocale].years}
                      onChange={(e) =>
                        handleTranslationChange(translationLocale, 'years', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                      placeholder="e.g., years"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-lighttext mb-2">
                    Remote Types
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-lighttext2 mb-1">Full Remote</label>
                      <input
                        type="text"
                        value={translations[translationLocale].remote.full}
                        onChange={(e) =>
                          handleTranslationChange(translationLocale, 'remote.full', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                        placeholder="e.g., Remote"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-lighttext2 mb-1">Hybrid</label>
                      <input
                        type="text"
                        value={translations[translationLocale].remote.hybrid}
                        onChange={(e) =>
                          handleTranslationChange(translationLocale, 'remote.hybrid', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                        placeholder="e.g., Hybrid"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-lighttext2 mb-1">On-site</label>
                      <input
                        type="text"
                        value={translations[translationLocale].remote.onSite}
                        onChange={(e) =>
                          handleTranslationChange(translationLocale, 'remote.onSite', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                        placeholder="e.g., On-site"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
                      onClick={() => cancelEntryEdit(entry.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-sm transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateCareer(entry.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-sm transition-colors"
                    >
                      Done
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

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Career Section Preview"
      >
        <CareerPreview
          entries={careerEntries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            company: entry.company,
            remote: entry.remote,
            startDate: entry.startDate,
            endDate: entry.endDate,
            skills: entry.skills,
            logo: entry.logo || '',
            blurhashURL: entry.blurhashURL || '',
            website_url: entry.website_url,
            location_en: entry.location_en,
            location_it: entry.location_it,
            description_en: entry.description_en,
            description_it: entry.description_it,
            company_description_en: entry.company_description_en,
            company_description_it: entry.company_description_it,
          }))}
        />
      </PreviewModal>
    </div>
  );
}