'use client';

import { skillsActions } from '@/app/actions/cms/sections/skillsActions';
import { i18nActions } from '@/app/actions/cms/sections/i18nActions';
import { Edit3, Plus, Save, Trash2, Upload, X, Eye, ArrowUp, ArrowDown, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';
import { ErrorDiv } from '../ErrorDiv';
import { PreviewModal } from './PreviewModal';
import { SkillsPreview } from './previews/SkillsPreview';

type Skill = {
  isEditing: boolean;
  id: number;
  title: string;
  icon: string;
  invert: boolean;
  category_id: number;
  blurhashURL: string;
};

type SkillsCategory = {
  id: number;
  name: string;
  skills: Skill[];
};

type EditableSkill = Skill & {
  icon_file?: File | null;
  isEditing?: boolean;
};

type EditableCategory = SkillsCategory & {
  skills: EditableSkill[];
  isEditing?: boolean;
  newSkill?: Partial<EditableSkill> & { icon_file?: File | null };
};

// API response types
type SkillsApiResponse = {
  success: boolean;
  data: SkillsCategory[];
  error?: string;
};

type SkillApiResponse = {
  success: boolean;
  data: Skill;
  error?: string;
};

type UploadApiResponse = {
  success: boolean;
  data: {
    icon_url: string;
    blurhashURL: string;
  };
  error?: string;
};

export default function SkillsSection() {
  const [categories, setCategories] = useState<EditableCategory[]>([]);
  const [originalCategories, setOriginalCategories] = useState<EditableCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Track modifications
  const [modifiedSkills, setModifiedSkills] = useState<Set<string>>(new Set());
  const [newSkills, setNewSkills] = useState<Array<{ categoryId: number; skill: EditableSkill }>>([]);
  const [deletedSkills, setDeletedSkills] = useState<Set<number>>(new Set());
  const [modifiedCategories, setModifiedCategories] = useState<Set<number>>(new Set());
  const [newCategories, setNewCategories] = useState<Array<{ name: string; tempId: number }>>([]);
  const [deletedCategories, setDeletedCategories] = useState<Set<number>>(new Set());
  const [categoryOrderChanged, setCategoryOrderChanged] = useState(false);

  // Translation state
  const [translations, setTranslations] = useState<{
    en: { title: string; subtitle: string; skills: Record<string, string> };
    it: { title: string; subtitle: string; skills: Record<string, string> };
  }>({
    en: { title: '', subtitle: '', skills: {} },
    it: { title: '', subtitle: '', skills: {} },
  });
  const [originalTranslations, setOriginalTranslations] = useState(translations);
  const [translationLocale, setTranslationLocale] = useState<'en' | 'it'>('en');
  const [isTranslationsExpanded, setIsTranslationsExpanded] = useState(false);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  // Drag and drop states
  const [dragStates, setDragStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSkillsData();
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
        
        const skillsEn = (enData?.translations?.['skills-section'] as {
          title?: string;
          subtitle?: string;
          skills?: Record<string, string>;
        }) || {};
        
        const skillsIt = (itData?.translations?.['skills-section'] as {
          title?: string;
          subtitle?: string;
          skills?: Record<string, string>;
        }) || {};
        
        const newTranslations = {
          en: {
            title: skillsEn.title || '',
            subtitle: skillsEn.subtitle || '',
            skills: skillsEn.skills || {},
          },
          it: {
            title: skillsIt.title || '',
            subtitle: skillsIt.subtitle || '',
            skills: skillsIt.skills || {},
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

  const fetchSkillsData = async () => {
    try {
      setIsLoading(true);
      const result = (await skillsActions({
        type: 'GET',
      })) as SkillsApiResponse;

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch skills data');
      }

      const loadedCategories = result.data.map((cat: SkillsCategory) => ({
        ...cat,
        skills: cat.skills.map((skill: Skill) => ({
          ...skill,
          isEditing: false,
        })),
      }));
      setCategories(loadedCategories);
      setOriginalCategories(JSON.parse(JSON.stringify(loadedCategories))); // Deep copy
    } catch (err) {
      setError('Failed to load skills data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    categoryId: number,
    skillId: number,
    field: string,
    value: string | boolean
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              skills: cat.skills.map((skill) =>
                skill.id === skillId ? { ...skill, [field]: value } : skill
              ),
            }
          : cat
      )
    );
    // Track modification
    setModifiedSkills((prev) => new Set(prev).add(`${categoryId}-${skillId}`));
  };

  const handleFileChange = async (
    categoryId: number,
    skillId: number,
    file: File
  ) => {
    try {
      // Store file for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(categoryId, skillId, 'icon', reader.result as string);
      };
      reader.readAsDataURL(file);

      // Store the actual File object
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                skills: cat.skills.map((skill) =>
                  skill.id === skillId ? { ...skill, icon_file: file } : skill
                ),
              }
            : cat
        )
      );
    } catch (error) {
      console.error('Error handling file change:', error);
      setError('Failed to process file');
    }
  };

  const handleDragOver = (e: React.DragEvent, skillId: string) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [skillId]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, skillId: string) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [skillId]: false }));
  };

  const handleDrop = (
    e: React.DragEvent,
    categoryId: number,
    skillId: number
  ) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [skillId]: false }));

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(categoryId, skillId, files[0]);
    }
  };

  const toggleEditSkill = (categoryId: number, skillId: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              skills: cat.skills.map((skill) =>
                skill.id === skillId
                  ? { ...skill, isEditing: !skill.isEditing }
                  : skill
              ),
            }
          : cat
      )
    );
  };

  const cancelSkillEdit = (categoryId: number, skillId: number) => {
    // Revert to original data
    const originalCategory = originalCategories.find((cat) => cat.id === categoryId);
    const originalSkill = originalCategory?.skills.find((s) => s.id === skillId);
    
    if (originalSkill) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                skills: cat.skills.map((skill) =>
                  skill.id === skillId
                    ? { ...originalSkill, isEditing: false, icon_file: undefined }
                    : skill
                ),
              }
            : cat
        )
      );
      // Remove from modified set
      setModifiedSkills((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`${categoryId}-${skillId}`);
        return newSet;
      });
    }
  };

  const saveSkillChanges = (categoryId: number, skillId: number) => {
    // Just close edit mode, changes are tracked in state
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              skills: cat.skills.map((skill) =>
                skill.id === skillId
                  ? { ...skill, isEditing: false }
                  : skill
              ),
            }
          : cat
      )
    );
  };

  const addNewSkill = (categoryId: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              newSkill: {
                title: '',
                icon: '',
                invert: false,
                category_id: categoryId,
                blurhashURL: '',
                isEditing: true,
              },
            }
          : cat
      )
    );
  };

  const saveNewSkill = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    const newSkill = category?.newSkill;

    if (!newSkill || !newSkill.title) {
      setError('Please fill in all required fields');
      return;
    }

    // Require either an icon URL or a file
    if (!newSkill.icon && !newSkill.icon_file) {
      setError('Please provide an icon (upload a file or enter a URL)');
      return;
    }

    // Generate temporary ID for new skill
    const tempId = Date.now();
    const skillToAdd: EditableSkill = {
      id: tempId,
      title: newSkill.title,
      icon: newSkill.icon || '',
      invert: newSkill.invert || false,
      category_id: categoryId,
      blurhashURL: newSkill.blurhashURL || '',
      icon_file: newSkill.icon_file,
      isEditing: false,
    };

    // Add to local state
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              skills: [...cat.skills, skillToAdd],
              newSkill: undefined,
            }
          : cat
      )
    );

    // Track as new skill
    setNewSkills((prev) => [...prev, { categoryId, skill: skillToAdd }]);
  };

  // Category management functions
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const createCategory = () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    const tempId = Date.now();
    const newCategory: EditableCategory = {
      id: tempId,
      name: newCategoryName.trim(),
      skills: [],
    };

    setCategories((prev) => [...prev, newCategory]);
    setNewCategories((prev) => [...prev, { name: newCategoryName.trim(), tempId }]);
    setIsCreatingCategory(false);
    setNewCategoryName('');
  };

  const updateCategory = (categoryId: number, newName: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, name: newName, isEditing: false } : cat
      )
    );
    setModifiedCategories((prev) => new Set(prev).add(categoryId));
  };

  const deleteCategory = (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? All skills in this category must be removed first.')) {
      return;
    }

    // Check if it's a new category (temp ID)
    const isNewCategory = newCategories.some((nc) => nc.tempId === categoryId);
    
    if (isNewCategory) {
      // Remove from new categories
      setNewCategories((prev) => prev.filter((nc) => nc.tempId !== categoryId));
    } else {
      // Track for deletion
      setDeletedCategories((prev) => new Set(prev).add(categoryId));
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
  };

  const handleNewSkillFileChange = (categoryId: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                newSkill: {
                  ...cat.newSkill!,
                  icon: reader.result as string,
                  icon_file: file,
                },
              }
            : cat
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const deleteSkillHandler = (categoryId: number, skillId: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    // Check if it's a new skill (temp ID)
    const isNewSkill = newSkills.some((ns) => ns.skill.id === skillId);
    
    if (isNewSkill) {
      // Remove from new skills
      setNewSkills((prev) => prev.filter((ns) => ns.skill.id !== skillId));
    } else {
      // Track for deletion
      setDeletedSkills((prev) => new Set(prev).add(skillId));
    }

    // Remove from modified skills if present
    setModifiedSkills((prev) => {
      const newSet = new Set(prev);
      newSet.delete(`${categoryId}-${skillId}`);
      return newSet;
    });

    // Remove from local state
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              skills: cat.skills.filter((skill) => skill.id !== skillId),
            }
          : cat
      )
    );
  };

  const applyAllChanges = async () => {
    try {
      setIsUpdating(true);
      setError(null);

      // 1. Delete skills
      for (const skillId of deletedSkills) {
        const result = (await skillsActions({
          type: 'DELETE',
          id: skillId,
        })) as { success: boolean; error?: string };

        if (!result.success) {
          throw new Error(result.error || `Failed to delete skill ${skillId}`);
        }
      }

      // 2. Delete categories
      for (const categoryId of deletedCategories) {
        const result = await skillsActions({
          type: 'DELETE_CATEGORY',
          id: categoryId,
        });

        if (!result.success) {
          throw new Error(result.error || `Failed to delete category ${categoryId}`);
        }
      }

      // 3. Create new categories (with position)
      for (const newCat of newCategories) {
        const category = categories.find((cat) => cat.id === newCat.tempId);
        const position = category ? categories.indexOf(category) : categories.length;
        
        const result = await skillsActions({
          type: 'CREATE_CATEGORY',
          data: { name: newCat.name },
        });

        if (!result.success) {
          throw new Error(result.error || `Failed to create category ${newCat.name}`);
        }

        // Update position after creation
        const createdId = (result as { data: { id: number } }).data.id;
        const positionResult = await skillsActions({
          type: 'UPDATE_CATEGORY',
          id: createdId,
          data: { position },
        });

        if (!positionResult.success) {
          console.warn(`Failed to set position for category ${newCat.name}`);
        }
      }

      // 4. Update category order if changed
      if (categoryOrderChanged) {
        for (let i = 0; i < categories.length; i++) {
          const category = categories[i];
          // Skip new categories (they'll be created with position)
          const isNewCategory = newCategories.some((nc) => nc.tempId === category.id);
          if (!isNewCategory) {
            const result = await skillsActions({
              type: 'UPDATE_CATEGORY',
              id: category.id,
              data: { position: i },
            });

            if (!result.success) {
              throw new Error(result.error || `Failed to update category order for ${category.name}`);
            }
          }
        }
      }

      // 5. Update categories (name changes)
      for (const categoryId of modifiedCategories) {
        const category = categories.find((cat) => cat.id === categoryId);
        if (category) {
          const result = await skillsActions({
            type: 'UPDATE_CATEGORY',
            id: categoryId,
            data: { name: category.name },
          });

          if (!result.success) {
            throw new Error(result.error || `Failed to update category ${categoryId}`);
          }
        }
      }

      // 6. Create new skills
      for (const { categoryId, skill } of newSkills) {
        // Find the actual category ID (might be temp ID)
        const category = categories.find((cat) => cat.id === categoryId);
        const actualCategoryId = category?.id || categoryId;

        // Create skill
        const createResult = (await skillsActions({
          type: 'CREATE',
          data: {
            title: skill.title,
            icon: skill.icon || 'pending-upload',
            invert: skill.invert || false,
            category_id: actualCategoryId,
            blurhashURL: skill.blurhashURL || '',
          },
        })) as SkillApiResponse;

        if (!createResult.success) {
          throw new Error(createResult.error || `Failed to create skill ${skill.title}`);
        }

        const createdSkill = createResult.data;

        // Upload icon if there's a file
        if (skill.icon_file) {
          const uploadResult = (await skillsActions({
            type: 'UPLOAD_ICON',
            skillId: createdSkill.id,
            file: skill.icon_file,
          })) as UploadApiResponse;

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || `Failed to upload icon for ${skill.title}`);
          }

          // Update the skill with the new icon
          await skillsActions({
            type: 'UPDATE',
            id: createdSkill.id,
            data: {
              icon: uploadResult.data.icon_url,
              blurhashURL: uploadResult.data.blurhashURL,
            },
          });
        }
      }

      // 7. Update modified skills
      for (const modifiedKey of modifiedSkills) {
        const [categoryIdStr, skillIdStr] = modifiedKey.split('-');
        const categoryId = parseInt(categoryIdStr);
        const skillId = parseInt(skillIdStr);

        const category = categories.find((cat) => cat.id === categoryId);
        const skill = category?.skills.find((s) => s.id === skillId) as EditableSkill | undefined;

        if (!skill) continue;

        const updateData: Partial<Skill> = {
          title: skill.title,
          invert: skill.invert,
        };

        // Upload icon if there's a new file
        if (skill.icon_file) {
          const uploadResult = (await skillsActions({
            type: 'UPLOAD_ICON',
            skillId: skill.id,
            file: skill.icon_file,
            currentIconUrl: skill.icon,
          })) as UploadApiResponse;

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || `Failed to upload icon for ${skill.title}`);
          }

          updateData.icon = uploadResult.data.icon_url;
          updateData.blurhashURL = uploadResult.data.blurhashURL;
        }

        // Update the skill
        const result = (await skillsActions({
          type: 'UPDATE',
          id: skillId,
          data: updateData,
        })) as SkillApiResponse;

        if (!result.success) {
          throw new Error(result.error || `Failed to update skill ${skill.title}`);
        }
      }

      // Save translations if changed
      if (hasTranslationChanges()) {
        // Update English translations
        const enResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'en',
          sectionKey: 'skills-section',
          sectionData: translations.en,
        });
        if (!enResult.success) {
          throw new Error(enResult.error || 'Failed to update English translations');
        }

        // Update Italian translations
        const itResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'it',
          sectionKey: 'skills-section',
          sectionData: translations.it,
        });
        if (!itResult.success) {
          throw new Error(itResult.error || 'Failed to update Italian translations');
        }

        setOriginalTranslations(JSON.parse(JSON.stringify(translations)));
      }

      // Refresh data and reset all tracking
      await fetchSkillsData();
      setModifiedSkills(new Set());
      setNewSkills([]);
      setDeletedSkills(new Set());
      setModifiedCategories(new Set());
      setNewCategories([]);
      setDeletedCategories(new Set());
      setCategoryOrderChanged(false);

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

  const moveCategoryUp = (categoryId: number) => {
    const currentIndex = categories.findIndex((cat) => cat.id === categoryId);
    if (currentIndex <= 0) return; // Already at top

    const newCategories = [...categories];
    [newCategories[currentIndex - 1], newCategories[currentIndex]] = [
      newCategories[currentIndex],
      newCategories[currentIndex - 1],
    ];
    setCategories(newCategories);
    setCategoryOrderChanged(true);
  };

  const moveCategoryDown = (categoryId: number) => {
    const currentIndex = categories.findIndex((cat) => cat.id === categoryId);
    if (currentIndex < 0 || currentIndex >= categories.length - 1) return; // Already at bottom

    const newCategories = [...categories];
    [newCategories[currentIndex], newCategories[currentIndex + 1]] = [
      newCategories[currentIndex + 1],
      newCategories[currentIndex],
    ];
    setCategories(newCategories);
    setCategoryOrderChanged(true);
  };

  const cancelAllChanges = () => {
    if (!confirm('Are you sure you want to cancel all changes? All unsaved edits will be lost.')) {
      return;
    }

    // Reload original data
    fetchSkillsData();
    fetchTranslations();
    
    // Reset all tracking
    setModifiedSkills(new Set());
    setNewSkills([]);
    setDeletedSkills(new Set());
    setModifiedCategories(new Set());
    setNewCategories([]);
    setDeletedCategories(new Set());
    setCategoryOrderChanged(false);
  };

  const handleTranslationChange = (
    locale: 'en' | 'it',
    field: 'title' | 'subtitle' | `skills.${string}`,
    value: string
  ) => {
    setTranslations((prev) => {
      const newTranslations = { ...prev };
      if (field === 'title' || field === 'subtitle') {
        newTranslations[locale][field] = value;
      } else if (field.startsWith('skills.')) {
        const categoryName = field.replace('skills.', '');
        newTranslations[locale].skills = {
          ...newTranslations[locale].skills,
          [categoryName]: value,
        };
      }
      return newTranslations;
    });
  };

  const hasTranslationChanges = () => {
    return JSON.stringify(translations) !== JSON.stringify(originalTranslations);
  };

  const hasChanges = () => {
    return (
      modifiedSkills.size > 0 ||
      newSkills.length > 0 ||
      deletedSkills.size > 0 ||
      modifiedCategories.size > 0 ||
      newCategories.length > 0 ||
      deletedCategories.size > 0 ||
      categoryOrderChanged ||
      hasTranslationChanges()
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main" />
      </div>
    );
  }

  if (error) {
    return <ErrorDiv>{error}</ErrorDiv>;
  }

  // Convert editable categories to preview format
  const previewCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    skills: cat.skills.map((skill) => ({
      id: skill.id,
      title: skill.title,
      icon: skill.icon,
      invert: skill.invert,
      blurhashURL: skill.blurhashURL,
    })),
  }));

  return (
    <div className="space-y-6 md:space-y-8 mb-8 md:mb-0 lg:mt-0">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="hidden lg:block text-2xl md:text-3xl lg:text-4xl font-bold text-main mb-2 md:mb-4">
          Skills Section Editor
        </h1>
        <p className="text-lighttext2 text-sm md:text-base lg:text-lg">
          Manage your skills and categories
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-darkgray hover:bg-darkergray text-lighttext font-medium rounded-lg transition-all duration-200 border border-lighttext2/20"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasChanges() || isUpdating}
            onClick={cancelAllChanges}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="bg-darkergray rounded-xl p-4 md:p-6">
        <button
          type="button"
          onClick={() => setIsTranslationsExpanded(!isTranslationsExpanded)}
          className="w-full flex items-center justify-between text-left min-h-[44px]"
        >
          <h2 className="text-lg md:text-xl font-bold text-main mb-4 flex items-center gap-2">
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
                    placeholder="e.g., Skills & Tech Stack"
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
                    placeholder="e.g., This section outlines the ****key technologies****..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lighttext mb-2">
                    Category Names
                  </label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id}>
                        <label className="block text-xs text-lighttext2 mb-1">
                          {category.name}
                        </label>
                        <input
                          type="text"
                          value={translations[translationLocale].skills[category.name] || ''}
                          onChange={(e) =>
                            handleTranslationChange(
                              translationLocale,
                              `skills.${category.name}` as `skills.${string}`,
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden"
                          placeholder={`Translation for ${category.name}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Management */}
      <div className="bg-darkergray rounded-xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg md:text-xl font-bold text-main">Manage Categories</h2>
          {!isCreatingCategory && (
            <button
              type="button"
              onClick={() => setIsCreatingCategory(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          )}
        </div>
        
        {isCreatingCategory && (
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 bg-darkgray text-lighttext rounded-lg border border-darkgray focus:border-main focus:outline-hidden"
              placeholder="Category name"
            />
            <button
              type="button"
              onClick={createCategory}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingCategory(false);
                setNewCategoryName('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6 md:space-y-8">
        {categories.map((category) => (
          <div key={category.id} className="bg-darkergray rounded-xl p-4 md:p-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {category.isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      defaultValue={category.name}
                      id={`category-name-${category.id}`}
                      className="flex-1 px-3 py-2 bg-darkgray text-lighttext rounded-lg border border-darkgray focus:border-main focus:outline-hidden text-lg md:text-xl font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(`category-name-${category.id}`) as HTMLInputElement;
                        updateCategory(category.id, input.value);
                      }}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Revert to original name
                        const originalCategory = originalCategories.find((cat) => cat.id === category.id);
                        if (originalCategory) {
                          setCategories((prev) =>
                            prev.map((cat) =>
                              cat.id === category.id
                                ? { ...cat, name: originalCategory.name, isEditing: false }
                                : cat
                            )
                          );
                          setModifiedCategories((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(category.id);
                            return newSet;
                          });
                        } else {
                          setCategories((prev) =>
                            prev.map((cat) =>
                              cat.id === category.id ? { ...cat, isEditing: false } : cat
                            )
                          );
                        }
                      }}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-lighttext2 hover:text-lighttext transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveCategoryUp(category.id)}
                        disabled={categories.findIndex((cat) => cat.id === category.id) === 0}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-lighttext2 hover:text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCategoryDown(category.id)}
                        disabled={categories.findIndex((cat) => cat.id === category.id) === categories.length - 1}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-lighttext2 hover:text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-main flex-1">{category.name}</h2>
                    <button
                      type="button"
                      onClick={() =>
                        setCategories((prev) =>
                          prev.map((cat) =>
                            cat.id === category.id ? { ...cat, isEditing: true } : cat
                          )
                        )
                      }
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-lighttext2 hover:text-main transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category.id)}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => addNewSkill(category.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Skill
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
              {/* Existing Skills */}
              {category.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-darkestgray rounded-lg p-4 text-center"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-lighttext">
                      {skill.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleEditSkill(category.id, skill.id)}
                        className="p-2 text-lighttext2 hover:text-main transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          deleteSkillHandler(category.id, skill.id)
                        }
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Skill Icon */}
                  <div className="mb-4 flex flex-col items-center">
                    <div
                      className="relative cursor-pointer flex justify-center"
                      onDragOver={(e) => handleDragOver(e, `skill-${skill.id}`)}
                      onDragLeave={(e) =>
                        handleDragLeave(e, `skill-${skill.id}`)
                      }
                      onDrop={(e) => handleDrop(e, category.id, skill.id)}
                    >
                      <Image
                        src={skill.icon}
                        width={80}
                        height={80}
                        className={`rounded-lg pb-2 ${skill.invert ? 'dark:invert' : ''}`}
                        alt={skill.title}
                        placeholder="blur"
                        blurDataURL={skill.blurhashURL}
                      />
                      {dragStates[`skill-${skill.id}`] && (
                        <div className="absolute inset-0 bg-main/80 flex items-center justify-center rounded-lg border-2 border-dashed border-white">
                          <div className="text-center text-white">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Drop icon here</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`skill-icon-${skill.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file)
                            handleFileChange(category.id, skill.id, file);
                        }}
                      />
                      <label
                        htmlFor={`skill-icon-${skill.id}`}
                        className="flex items-center gap-2 px-3 py-1 bg-main hover:bg-secondary text-white text-sm rounded-sm transition-all duration-200 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        Change Icon
                      </label>
                    </div>
                  </div>

                  {/* Skill Details */}
                  {skill.isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={skill.title}
                        onChange={(e) =>
                          handleInputChange(
                            category.id,
                            skill.id,
                            'title',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-darkgray text-lighttext rounded-sm border border-darkgray focus:border-main focus:outline-hidden"
                        placeholder="Skill title"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`invert-${skill.id}`}
                          checked={skill.invert}
                          onChange={(e) =>
                            handleInputChange(
                              category.id,
                              skill.id,
                              'invert',
                              e.target.checked
                            )
                          }
                          className="rounded-sm"
                        />
                        <label
                          htmlFor={`invert-${skill.id}`}
                          className="text-sm text-lighttext2"
                        >
                          Invert in dark mode
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cancelSkillEdit(category.id, skill.id)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-sm transition-all duration-200"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveSkillChanges(category.id, skill.id)}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-sm transition-all duration-200"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-lighttext2">
                        Title: {skill.title}
                      </p>
                      <p className="text-sm text-lighttext2">
                        Invert: {skill.invert ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* New Skill Form */}
              {category.newSkill && (
                <div className="bg-darkestgray rounded-lg p-4 border-2 border-dashed border-main">
                  <h3 className="text-lg font-semibold text-main mb-4">
                    New Skill
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={category.newSkill.title || ''}
                      onChange={(e) =>
                        setCategories((prev) =>
                          prev.map((cat) =>
                            cat.id === category.id
                              ? {
                                  ...cat,
                                  newSkill: {
                                    ...cat.newSkill!,
                                    title: e.target.value,
                                  },
                                }
                              : cat
                          )
                        )
                      }
                      className="w-full px-3 py-2 bg-darkgray text-lighttext rounded-sm border border-darkgray focus:border-main focus:outline-hidden"
                      placeholder="Skill title"
                    />
                    
                    {/* Icon Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm text-lighttext2">Icon</label>
                      <div className="flex items-center gap-3">
                        {category.newSkill.icon ? (
                          <Image
                            src={category.newSkill.icon}
                            width={48}
                            height={48}
                            className="rounded-lg"
                            alt="New skill icon preview"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-darkgray rounded-lg flex items-center justify-center text-lighttext2 text-xs">
                            No icon
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`new-skill-icon-${category.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleNewSkillFileChange(category.id, file);
                            }}
                          />
                          <label
                            htmlFor={`new-skill-icon-${category.id}`}
                            className="flex items-center gap-2 px-3 py-1 bg-main hover:bg-secondary text-white text-sm rounded-sm transition-all duration-200 cursor-pointer w-fit"
                          >
                            <Upload className="w-3 h-3" />
                            Upload Icon
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`new-invert-${category.id}`}
                        checked={category.newSkill.invert || false}
                        onChange={(e) =>
                          setCategories((prev) =>
                            prev.map((cat) =>
                              cat.id === category.id
                                ? {
                                    ...cat,
                                    newSkill: {
                                      ...cat.newSkill!,
                                      invert: e.target.checked,
                                    },
                                  }
                                : cat
                            )
                          )
                        }
                        className="rounded-sm"
                      />
                      <label
                        htmlFor={`new-invert-${category.id}`}
                        className="text-sm text-lighttext2"
                      >
                        Invert in dark mode
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveNewSkill(category.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-sm transition-all duration-200"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCategories((prev) =>
                            prev.map((cat) =>
                              cat.id === category.id
                                ? { ...cat, newSkill: undefined }
                                : cat
                            )
                          )
                        }
                        className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-sm transition-all duration-200"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}


      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Skills Section Preview"
      >
        <SkillsPreview categories={previewCategories} />
      </PreviewModal>
    </div>
  );
}
