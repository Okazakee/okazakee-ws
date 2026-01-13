'use client';

import { skillsActions } from '@/app/actions/cms/sections/skillsActions';
import { Edit3, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';
import { ErrorDiv } from '../ErrorDiv';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Drag and drop states
  const [dragStates, setDragStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSkillsData();
  }, []);

  const fetchSkillsData = async () => {
    try {
      setIsLoading(true);
      const result = (await skillsActions({
        type: 'GET',
      })) as SkillsApiResponse;

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch skills data');
      }

      setCategories(
        result.data.map((cat: SkillsCategory) => ({
          ...cat,
          skills: cat.skills.map((skill: Skill) => ({
            ...skill,
            isEditing: false,
          })),
        }))
      );
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

  const saveSkillChanges = async (categoryId: number, skillId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    const skill = category?.skills.find((s) => s.id === skillId) as
      | EditableSkill
      | undefined;

    if (!skill) return;

    try {
      setIsUpdating(true);
      setError(null);

      const updateData: Partial<Skill> = {
        title: skill.title,
        invert: skill.invert,
      };

      // If there's a new icon file, upload it first
      if (skill.icon_file) {
        const uploadResult = (await skillsActions({
          type: 'UPLOAD_ICON',
          skillId: skill.id,
          file: skill.icon_file,
          currentIconUrl: skill.icon,
        })) as UploadApiResponse;

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload icon');
        }

        updateData.icon = uploadResult.data.icon_url;
        updateData.blurhashURL = uploadResult.data.blurhashURL;
      }

      // Update the skill in database
      const result = (await skillsActions({
        type: 'UPDATE',
        id: skillId,
        data: updateData,
      })) as SkillApiResponse;

      if (!result.success) {
        throw new Error(result.error || 'Failed to update skill');
      }

      // Update local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                skills: cat.skills.map((s) =>
                  s.id === skillId
                    ? {
                        ...s,
                        isEditing: false,
                        icon_file: undefined,
                        icon: updateData.icon || s.icon,
                        blurhashURL: updateData.blurhashURL || s.blurhashURL,
                      }
                    : s
                ),
              }
            : cat
        )
      );
    } catch (error) {
      console.error('Error saving skill changes:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to save changes'
      );
    } finally {
      setIsUpdating(false);
    }
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

  const saveNewSkill = async (categoryId: number) => {
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

    try {
      setIsUpdating(true);
      setError(null);

      // Create the new skill with placeholder icon if we're uploading a file
      const result = (await skillsActions({
        type: 'CREATE',
        data: {
          title: newSkill.title,
          icon: newSkill.icon || 'pending-upload',
          invert: newSkill.invert || false,
          category_id: categoryId,
          blurhashURL: newSkill.blurhashURL || '',
        },
      })) as SkillApiResponse;

      if (!result.success) {
        throw new Error(result.error || 'Failed to create skill');
      }

      const createdSkill = result.data;

      // If there's an icon file, upload it
      if (newSkill.icon_file) {
        const uploadResult = (await skillsActions({
          type: 'UPLOAD_ICON',
          skillId: createdSkill.id,
          file: newSkill.icon_file,
        })) as UploadApiResponse;

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload icon');
        }

        createdSkill.icon = uploadResult.data.icon_url;
        createdSkill.blurhashURL = uploadResult.data.blurhashURL;
      }

      // Add the new skill to local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                skills: [...cat.skills, { ...createdSkill, isEditing: false }],
                newSkill: undefined,
              }
            : cat
        )
      );
    } catch (error) {
      console.error('Error creating skill:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create skill'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Category management functions
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const result = await skillsActions({
        type: 'CREATE_CATEGORY',
        data: { name: newCategoryName.trim() },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create category');
      }

      setNewCategoryName('');
      setIsCreatingCategory(false);
      await fetchSkillsData();
    } catch (error) {
      console.error('Error creating category:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create category'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const updateCategory = async (categoryId: number, newName: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const result = await skillsActions({
        type: 'UPDATE_CATEGORY',
        id: categoryId,
        data: { name: newName },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update category');
      }

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, name: newName, isEditing: false } : cat
        )
      );
    } catch (error) {
      console.error('Error updating category:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update category'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? All skills in this category must be removed first.')) {
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const result = await skillsActions({
        type: 'DELETE_CATEGORY',
        id: categoryId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete category');
      }

      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete category'
      );
    } finally {
      setIsUpdating(false);
    }
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

  const deleteSkillHandler = async (categoryId: number, skillId: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      setIsUpdating(true);
      setError(null);

      const result = (await skillsActions({
        type: 'DELETE',
        id: skillId,
      })) as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete skill');
      }

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
    } catch (error) {
      console.error('Error deleting skill:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete skill'
      );
    } finally {
      setIsUpdating(false);
    }
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

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-main mb-4">
          Skills Section Editor
        </h1>
        <p className="text-lighttext2 text-lg">
          Manage your skills and categories
        </p>
      </div>

      {/* Category Management */}
      <div className="bg-darkergray rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-main">Manage Categories</h2>
          {!isCreatingCategory && (
            <button
              type="button"
              onClick={() => setIsCreatingCategory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200"
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

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.id} className="bg-darkergray rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              {category.isEditing ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    defaultValue={category.name}
                    id={`category-name-${category.id}`}
                    className="px-3 py-2 bg-darkgray text-lighttext rounded-lg border border-darkgray focus:border-main focus:outline-hidden text-xl font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(`category-name-${category.id}`) as HTMLInputElement;
                      updateCategory(category.id, input.value);
                    }}
                    disabled={isUpdating}
                    className="p-2 text-green-500 hover:text-green-400 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCategories((prev) =>
                        prev.map((cat) =>
                          cat.id === category.id ? { ...cat, isEditing: false } : cat
                        )
                      )
                    }
                    className="p-2 text-lighttext2 hover:text-lighttext transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-main">{category.name}</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setCategories((prev) =>
                        prev.map((cat) =>
                          cat.id === category.id ? { ...cat, isEditing: true } : cat
                        )
                      )
                    }
                    className="p-2 text-lighttext2 hover:text-main transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => addNewSkill(category.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </button>
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
                          onClick={() =>
                            saveSkillChanges(category.id, skill.id)
                          }
                          className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-sm transition-all duration-200"
                          disabled={isUpdating}
                        >
                          <Save className="w-3 h-3" />
                          {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleEditSkill(category.id, skill.id)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-sm transition-all duration-200"
                          disabled={isUpdating}
                        >
                          <X className="w-3 h-3" />
                          Cancel
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
                        className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-sm transition-all duration-200"
                        disabled={isUpdating}
                      >
                        <Save className="w-3 h-3" />
                        {isUpdating ? 'Saving...' : 'Save'}
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
                        disabled={isUpdating}
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
    </div>
  );
}
