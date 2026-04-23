'use client';

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  Globe,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { i18nActions } from '@/app/actions/cms/sections/i18nActions';
import { skillsActions } from '@/app/actions/cms/sections/skillsActions';
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
  isEditing?: boolean;
};

type EditableCategory = Omit<SkillsCategory, 'skills'> & {
  skills: EditableSkill[];
  isEditing?: boolean;
  newSkill?: Partial<EditableSkill>;
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

export default function SkillsSection() {
  const t = useTranslations('cms');
  const [categories, setCategories] = useState<EditableCategory[]>([]);
  const [originalCategories, setOriginalCategories] = useState<
    EditableCategory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Track modifications
  const [modifiedSkills, setModifiedSkills] = useState<Set<string>>(new Set());
  const [newSkills, setNewSkills] = useState<
    Array<{ categoryId: number; skill: EditableSkill }>
  >([]);
  const [deletedSkills, setDeletedSkills] = useState<Set<number>>(new Set());
  const [modifiedCategories, setModifiedCategories] = useState<Set<number>>(
    new Set()
  );
  const [newCategories, setNewCategories] = useState<
    Array<{ name: string; tempId: number }>
  >([]);
  const [deletedCategories, setDeletedCategories] = useState<Set<number>>(
    new Set()
  );
  const [categoryOrderChanged, setCategoryOrderChanged] = useState(false);

  // Translation state
  const [translations, setTranslations] = useState<{
    en: { title: string; subtitle: string; skills: Record<string, string> };
    it: { title: string; subtitle: string; skills: Record<string, string> };
  }>({
    en: { title: '', subtitle: '', skills: {} },
    it: { title: '', subtitle: '', skills: {} },
  });
  const [originalTranslations, setOriginalTranslations] =
    useState(translations);
  const [translationLocale, setTranslationLocale] = useState<'en' | 'it'>('en');
  const [isTranslationsExpanded, setIsTranslationsExpanded] = useState(false);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

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

        const skillsEn =
          (enData?.translations?.['skills-section'] as {
            title?: string;
            subtitle?: string;
            skills?: Record<string, string>;
          }) || {};

        const skillsIt =
          (itData?.translations?.['skills-section'] as {
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

  const handleIconUrlChange = (
    categoryId: number,
    skillId: number,
    url: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              skills: cat.skills.map((skill) =>
                skill.id === skillId ? { ...skill, icon: url } : skill
              ),
            }
          : cat
      )
    );
    setModifiedSkills((prev) => new Set(prev).add(`${categoryId}-${skillId}`));
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
    const originalCategory = originalCategories.find(
      (cat) => cat.id === categoryId
    );
    const originalSkill = originalCategory?.skills.find(
      (s) => s.id === skillId
    );

    if (originalSkill) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                skills: cat.skills.map((skill) =>
                  skill.id === skillId
                    ? {
                        ...originalSkill,
                        isEditing: false,
                      }
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
                skill.id === skillId ? { ...skill, isEditing: false } : skill
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
      setError(t('skills.errorRequiredFields'));
      return;
    }

    if (!newSkill.icon?.trim()) {
      setError(t('skills.errorIconUrl'));
      return;
    }

    // Generate temporary ID for new skill
    const tempId = Date.now();
    const skillToAdd: EditableSkill = {
      id: tempId,
      title: newSkill.title,
      icon: newSkill.icon.trim(),
      invert: newSkill.invert || false,
      category_id: categoryId,
      blurhashURL: newSkill.blurhashURL || '',
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
      setError(t('skills.errorCategoryName'));
      return;
    }

    const tempId = Date.now();
    const newCategory: EditableCategory = {
      id: tempId,
      name: newCategoryName.trim(),
      skills: [],
    };

    setCategories((prev) => [...prev, newCategory]);
    setNewCategories((prev) => [
      ...prev,
      { name: newCategoryName.trim(), tempId },
    ]);
    setIsCreatingCategory(false);
    setNewCategoryName('');
  };

  const updateCategory = (categoryId: number, newName: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, name: newName, isEditing: false }
          : cat
      )
    );
    setModifiedCategories((prev) => new Set(prev).add(categoryId));
  };

  const deleteCategory = (categoryId: number) => {
    if (!confirm(t('skills.confirmDeleteCategory'))) {
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

  const deleteSkillHandler = (categoryId: number, skillId: number) => {
    if (!confirm(t('common.confirmDelete'))) return;

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
    const errors: string[] = [];
    const tempIdToRealId: Record<number, number> = {};
    setIsUpdating(true);
    setError(null);

    // 1. Create new categories
    for (const newCat of newCategories) {
      try {
        const category = categories.find((cat) => cat.id === newCat.tempId);
        const position = category ? categories.indexOf(category) : categories.length;

        const result = await skillsActions({
          type: 'CREATE_CATEGORY',
          data: { name: newCat.name },
        });
        if (!result.success) {
          errors.push(`Category "${newCat.name}": ${result.error || 'failed to create'}`);
          continue;
        }

        const createdId = (result as { data: { id: number } }).data.id;
        tempIdToRealId[newCat.tempId] = createdId;

        await skillsActions({ type: 'UPDATE_CATEGORY', id: createdId, data: { position } });
      } catch (e) {
        errors.push(`Category "${newCat.name}": ${e instanceof Error ? e.message : 'unexpected error'}`);
      }
    }

    // 2. Create new skills (skip if their category failed to create)
    for (const { categoryId, skill } of newSkills) {
      try {
        const actualCategoryId =
          tempIdToRealId[categoryId] ??
          categories.find((cat) => cat.id === categoryId)?.id ??
          categoryId;

        const createResult = (await skillsActions({
          type: 'CREATE',
          data: {
            title: skill.title,
            icon: skill.icon,
            invert: skill.invert || false,
            category_id: actualCategoryId,
            blurhashURL: skill.blurhashURL || '',
          },
        })) as SkillApiResponse & { data?: { id: number } };

        if (!createResult.success) {
          errors.push(`Skill "${skill.title}": ${createResult.error || 'failed to create'}`);
        }
      } catch (e) {
        errors.push(`Skill "${skill.title}": ${e instanceof Error ? e.message : 'unexpected error'}`);
      }
    }

    // 3. Delete skills
    for (const skillId of deletedSkills) {
      try {
        const result = (await skillsActions({ type: 'DELETE', id: skillId })) as { success: boolean; error?: string };
        if (!result.success) {
          errors.push(`Delete skill ${skillId}: ${result.error || 'failed'}`);
        }
      } catch (e) {
        errors.push(`Delete skill ${skillId}: ${e instanceof Error ? e.message : 'unexpected error'}`);
      }
    }

    // 4. Delete categories
    for (const categoryId of deletedCategories) {
      try {
        const result = await skillsActions({ type: 'DELETE_CATEGORY', id: categoryId });
        if (!result.success) {
          errors.push(`Delete category ${categoryId}: ${result.error || 'failed'}`);
        }
      } catch (e) {
        errors.push(`Delete category ${categoryId}: ${e instanceof Error ? e.message : 'unexpected error'}`);
      }
    }

    // 5. Update category order if changed
    if (categoryOrderChanged) {
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        try {
          const isNewCategory = newCategories.some((nc) => nc.tempId === category.id);
          const categoryId = isNewCategory ? tempIdToRealId[category.id] : category.id;
          if (categoryId != null) {
            const result = await skillsActions({
              type: 'UPDATE_CATEGORY',
              id: categoryId,
              data: { position: i },
            });
            if (!result.success) {
              errors.push(`Reorder "${category.name}": ${result.error || 'failed'}`);
            }
          }
        } catch (e) {
          errors.push(`Reorder "${category.name}": ${e instanceof Error ? e.message : 'unexpected error'}`);
        }
      }
    }

    // 6. Update categories (name changes)
    for (const categoryId of modifiedCategories) {
      const category = categories.find((cat) => cat.id === categoryId);
      if (!category) continue;
      try {
        const realId = tempIdToRealId[categoryId] ?? categoryId;
        const result = await skillsActions({
          type: 'UPDATE_CATEGORY',
          id: realId,
          data: { name: category.name },
        });
        if (!result.success) {
          errors.push(`Category "${category.name}": ${result.error || 'failed to update'}`);
        }
      } catch (e) {
        errors.push(`Category "${category.name}": ${e instanceof Error ? e.message : 'unexpected error'}`);
      }
    }

    // 7. Update modified skills
    for (const modifiedKey of modifiedSkills) {
      const [categoryIdStr, skillIdStr] = modifiedKey.split('-');
      const categoryId = parseInt(categoryIdStr, 10);
      const skillId = parseInt(skillIdStr, 10);
      const category = categories.find((cat) => cat.id === categoryId);
      const skill = category?.skills.find((s) => s.id === skillId) as EditableSkill | undefined;
      if (!skill) continue;
      try {
        const result = (await skillsActions({
          type: 'UPDATE',
          id: skillId,
          data: { title: skill.title, icon: skill.icon, invert: skill.invert },
        })) as SkillApiResponse;
        if (!result.success) {
          errors.push(`Skill "${skill.title}": ${result.error || 'failed to update'}`);
        }
      } catch (e) {
        errors.push(`Skill "${skill.title}": ${e instanceof Error ? e.message : 'unexpected error'}`);
      }
    }

    // Save translations if changed
    if (hasTranslationChanges()) {
      try {
        const enResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'en',
          sectionKey: 'skills-section',
          sectionData: translations.en,
        });
        const itResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'it',
          sectionKey: 'skills-section',
          sectionData: translations.it,
        });
        if (!enResult.success) errors.push(`EN translations: ${enResult.error || 'failed'}`);
        if (!itResult.success) errors.push(`IT translations: ${itResult.error || 'failed'}`);
        if (enResult.success && itResult.success) {
          setOriginalTranslations(JSON.parse(JSON.stringify(translations)));
        }
      } catch (e) {
        errors.push(`Translations: ${e instanceof Error ? e.message : 'unexpected error'}`);
      }
    }

    // Always refresh and reset state
    await fetchSkillsData().catch(() => {});
    setModifiedSkills(new Set());
    setNewSkills([]);
    setDeletedSkills(new Set());
    setModifiedCategories(new Set());
    setNewCategories([]);
    setDeletedCategories(new Set());
    setCategoryOrderChanged(false);
    setIsUpdating(false);

    if (errors.length > 0) {
      setError(errors.join('\n'));
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
    if (!confirm(t('common.confirmCancel'))) {
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
    return (
      JSON.stringify(translations) !== JSON.stringify(originalTranslations)
    );
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
          {t('skills.title')}
        </h1>
        <p className="text-gray-500 dark:text-lighttext2 text-sm md:text-base lg:text-lg">
          {t('skills.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-gray-200 hover:bg-gray-300 dark:bg-darkgray dark:hover:bg-darkergray text-darktext dark:text-lighttext font-medium rounded-lg transition-all duration-200 border border-gray-200 dark:border-lighttext2/20"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="w-4 h-4" />
            {t('common.preview')}
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasChanges() || isUpdating}
            onClick={cancelAllChanges}
          >
            <X className="w-4 h-4" />
            {t('common.cancel')}
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
                {t('common.applying')}
              </>
            ) : (
              t('common.applyChanges')
            )}
          </button>
        </div>
      </div>

      {/* Translations Section */}
      <div className="bg-gray-100 dark:bg-darkergray rounded-xl p-4 md:p-6">
        <button
          type="button"
          onClick={() => setIsTranslationsExpanded(!isTranslationsExpanded)}
          className="w-full flex items-center justify-between text-left min-h-[44px]"
        >
          <h2 className="text-lg md:text-xl font-bold text-main mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('common.translations')}
          </h2>
          {isTranslationsExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-lighttext2" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-lighttext2" />
          )}
        </button>

        {isTranslationsExpanded && (
          <div className="space-y-6 mt-4">
            {/* Locale Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-darkgray">
              <button
                type="button"
                onClick={() => setTranslationLocale('en')}
                className={`px-4 py-2 font-medium transition-colors ${
                  translationLocale === 'en'
                    ? 'text-main border-b-2 border-main'
                    : 'text-gray-500 dark:text-lighttext2 hover:text-darktext dark:hover:text-lighttext'
                }`}
              >
                {t('common.english')}
              </button>
              <button
                type="button"
                onClick={() => setTranslationLocale('it')}
                className={`px-4 py-2 font-medium transition-colors ${
                  translationLocale === 'it'
                    ? 'text-main border-b-2 border-main'
                    : 'text-gray-500 dark:text-lighttext2 hover:text-darktext dark:hover:text-lighttext'
                }`}
              >
                {t('common.italian')}
              </button>
            </div>

            {isLoadingTranslations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('skills.translationTitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].title}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'title',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('skills.translationTitlePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('skills.translationSubtitleLabel')}
                  </label>
                  <textarea
                    value={translations[translationLocale].subtitle}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'subtitle',
                        e.target.value
                      )
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden resize-y"
                    placeholder={t('skills.translationSubtitlePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('skills.categoryNamesLabel')}
                  </label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id}>
                        <label className="block text-xs text-gray-500 dark:text-lighttext2 mb-1">
                          {category.name}
                        </label>
                        <input
                          type="text"
                          value={
                            translations[translationLocale].skills[
                              category.name
                            ] || ''
                          }
                          onChange={(e) =>
                            handleTranslationChange(
                              translationLocale,
                              `skills.${category.name}` as `skills.${string}`,
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                          placeholder={t(
                            'skills.categoryTranslationPlaceholder'
                          ).replace('{category}', category.name)}
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
      <div className="bg-gray-100 dark:bg-darkergray rounded-xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg md:text-xl font-bold text-main">
            {t('skills.manageCategoriesTitle')}
          </h2>
          {!isCreatingCategory && (
            <button
              type="button"
              onClick={() => setIsCreatingCategory(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              {t('skills.addCategory')}
            </button>
          )}
        </div>

        {isCreatingCategory && (
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 bg-white dark:bg-darkgray text-darktext dark:text-lighttext rounded-lg border border-gray-200 dark:border-darkgray focus:border-main focus:outline-hidden"
              placeholder={t('skills.categoryNamePlaceholder')}
            />
            <button
              type="button"
              onClick={createCategory}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              {t('common.save')}
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
          <div
            key={category.id}
            className="bg-gray-100 dark:bg-darkergray rounded-xl p-4 md:p-6"
          >
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {category.isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      defaultValue={category.name}
                      id={`category-name-${category.id}`}
                      className="flex-1 px-3 py-2 bg-white dark:bg-darkgray text-darktext dark:text-lighttext rounded-lg border border-gray-200 dark:border-darkgray focus:border-main focus:outline-hidden text-lg md:text-xl font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(
                          `category-name-${category.id}`
                        ) as HTMLInputElement;
                        updateCategory(category.id, input.value);
                      }}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      {t('common.done')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Revert to original name
                        const originalCategory = originalCategories.find(
                          (cat) => cat.id === category.id
                        );
                        if (originalCategory) {
                          setCategories((prev) =>
                            prev.map((cat) =>
                              cat.id === category.id
                                ? {
                                    ...cat,
                                    name: originalCategory.name,
                                    isEditing: false,
                                  }
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
                              cat.id === category.id
                                ? { ...cat, isEditing: false }
                                : cat
                            )
                          );
                        }
                      }}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-lighttext2 hover:text-darktext dark:hover:text-lighttext transition-colors"
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
                        disabled={
                          categories.findIndex(
                            (cat) => cat.id === category.id
                          ) === 0
                        }
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-lighttext2 hover:text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={t('common.moveUp')}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCategoryDown(category.id)}
                        disabled={
                          categories.findIndex(
                            (cat) => cat.id === category.id
                          ) ===
                          categories.length - 1
                        }
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-lighttext2 hover:text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={t('common.moveDown')}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-main flex-1">
                      {category.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        setCategories((prev) =>
                          prev.map((cat) =>
                            cat.id === category.id
                              ? { ...cat, isEditing: true }
                              : cat
                          )
                        )
                      }
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-lighttext2 hover:text-main transition-colors"
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
                  {t('skills.addSkill')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
              {/* Existing Skills */}
              {category.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-white dark:bg-darkestgray rounded-lg p-4 text-center"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-darktext dark:text-lighttext">
                      {skill.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleEditSkill(category.id, skill.id)}
                        className="p-2 text-gray-500 dark:text-lighttext2 hover:text-main transition-colors"
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

                  {/* Skill Icon (URL) */}
                  <div className="mb-4 flex flex-col items-center">
                    {skill.icon && (
                      <Image
                        src={skill.icon}
                        width={80}
                        height={80}
                        className={`rounded-lg pb-2 ${skill.invert ? 'dark:invert' : ''}`}
                        alt={skill.title}
                        {...(skill.blurhashURL
                          ? {
                              placeholder: 'blur' as const,
                              blurDataURL: skill.blurhashURL,
                            }
                          : {})}
                      />
                    )}
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
                        className="w-full px-3 py-2 bg-white dark:bg-darkgray text-darktext dark:text-lighttext rounded-sm border border-gray-200 dark:border-darkgray focus:border-main focus:outline-hidden"
                        placeholder={t('skills.skillTitlePlaceholder')}
                      />
                      <input
                        type="url"
                        value={skill.icon}
                        onChange={(e) =>
                          handleIconUrlChange(
                            category.id,
                            skill.id,
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-darkgray text-darktext dark:text-lighttext rounded-sm border border-gray-200 dark:border-darkgray focus:border-main focus:outline-hidden text-xs"
                        placeholder="https://example.com/icon.svg"
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
                          className="text-sm text-gray-500 dark:text-lighttext2"
                        >
                          {t('skills.invertLabel')}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cancelSkillEdit(category.id, skill.id)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-sm transition-all duration-200"
                        >
                          <X className="w-3 h-3" />
                          {t('common.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            saveSkillChanges(category.id, skill.id)
                          }
                          className="flex items-center gap-2 px-3 py-1 bg-main hover:bg-secondary text-white text-sm rounded-sm transition-all duration-200"
                        >
                          {t('common.done')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-lighttext2">
                        Title: {skill.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-lighttext2">
                        Invert: {skill.invert ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* New Skill Form */}
              {category.newSkill && (
                <div className="bg-gray-100 dark:bg-darkestgray rounded-lg p-4 border-2 border-dashed border-main">
                  <h3 className="text-lg font-semibold text-main mb-4">
                    {t('skills.newSkill')}
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
                      className="w-full px-3 py-2 bg-white dark:bg-darkgray text-darktext dark:text-lighttext rounded-sm border border-gray-200 dark:border-darkgray focus:border-main focus:outline-hidden"
                      placeholder="Skill title"
                    />

                    {/* Icon URL */}
                    <div className="space-y-2">
                      <p className="block text-sm text-gray-500 dark:text-lighttext2">
                        {t('skills.iconUrlLabel')}
                      </p>
                      <div className="flex items-start gap-3">
                        {category.newSkill.icon ? (
                          <Image
                            src={category.newSkill.icon}
                            width={48}
                            height={48}
                            className="rounded-lg shrink-0"
                            alt="New skill icon preview"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-darkgray rounded-lg flex items-center justify-center text-gray-500 dark:text-lighttext2 text-xs shrink-0">
                            No icon
                          </div>
                        )}
                        <input
                          type="url"
                          value={category.newSkill.icon || ''}
                          onChange={(e) =>
                            setCategories((prev) =>
                              prev.map((cat) =>
                                cat.id === category.id
                                  ? {
                                      ...cat,
                                      newSkill: {
                                        ...cat.newSkill!,
                                        icon: e.target.value,
                                      },
                                    }
                                  : cat
                              )
                            )
                          }
                          className="flex-1 px-3 py-2 bg-white dark:bg-darkgray text-darktext dark:text-lighttext rounded-sm border border-gray-200 dark:border-darkgray focus:border-main focus:outline-hidden text-xs"
                          placeholder="https://example.com/icon.svg"
                        />
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
                        className="text-sm text-gray-500 dark:text-lighttext2"
                      >
                        {t('skills.invertLabel')}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveNewSkill(category.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-main hover:bg-secondary text-white text-sm rounded-sm transition-all duration-200"
                      >
                        {t('common.add')}
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
                        {t('common.cancel')}
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
        title={t('skills.previewTitle')}
      >
        <SkillsPreview categories={previewCategories} />
      </PreviewModal>
    </div>
  );
}
