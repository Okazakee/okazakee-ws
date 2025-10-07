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

type UploadApiResponse = {
  success: boolean;
  data: {
    url: string;
    blurhash: string;
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

        updateData.icon = uploadResult.data.url;
        updateData.blurhashURL = uploadResult.data.blurhash;
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

    if (!newSkill || !newSkill.title || !newSkill.icon) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      // Create the new skill
      const result = (await skillsActions({
        type: 'CREATE',
        data: {
          title: newSkill.title,
          icon: newSkill.icon,
          invert: newSkill.invert || false,
          category_id: categoryId,
          blurhashURL: newSkill.blurhashURL || '',
        },
      })) as SkillApiResponse;

      if (!result.success) {
        throw new Error(result.error || 'Failed to create skill');
      }

      // Add the new skill to local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                skills: [...cat.skills, { ...result.data, isEditing: false }],
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

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.id} className="bg-darkergray rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-main">{category.name}</h2>
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
