'use client';

import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { useEffect, useState } from 'react';
import { i18nActions } from '@/app/actions/cms/sections/i18nActions';
import {
  type Author,
  portfolioActions,
} from '@/app/actions/cms/sections/portfolioActions';
import { useLayoutStore } from '@/store/layoutStore';
import type { PortfolioPost } from '@/types/fetchedData.types';
import { processImageToWebP } from '@/utils/imageProcessor';
import { ListPostImage } from './ListPostImage';
import { PreviewModal } from './PreviewModal';
import { PortfolioPreview } from './previews/PortfolioPreview';
import { PostPreview } from './previews/PostPreview';

type FormMode = 'list' | 'create' | 'edit';

type PortfolioFormData = {
  title_en: string;
  title_it: string;
  image: string;
  source_link: string;
  demo_link: string;
  description_en: string;
  description_it: string;
  body_en: string;
  body_it: string;
  blurhashURL: string;
  post_tags: string;
  store_link: string;
  created_at: string;
  author_id: string;
};

const emptyFormData: PortfolioFormData = {
  title_en: '',
  title_it: '',
  image: '',
  source_link: '',
  demo_link: '',
  description_en: '',
  description_it: '',
  body_en: '',
  body_it: '',
  blurhashURL: '',
  post_tags: '',
  store_link: '',
  created_at: new Date().toISOString().split('T')[0],
  author_id: '',
};

type EditablePortfolioPost = PortfolioPost & {
  image_file?: File | null;
  author_id?: string;
};

export default function PortfolioSection() {
  const t = useTranslations('cms');
  const [portfolioPosts, setPortfolioPosts] = useState<EditablePortfolioPost[]>(
    []
  );
  const [originalPosts, setOriginalPosts] = useState<EditablePortfolioPost[]>(
    []
  );
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPostPreviewOpen, setIsPostPreviewOpen] = useState(false);

  // Form state
  const [mode, setMode] = useState<FormMode>('list');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PortfolioFormData>(emptyFormData);
  const [formImage, setFormImage] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Track modifications
  const [modifiedPosts, setModifiedPosts] = useState<Set<number>>(new Set());
  const [newPosts, setNewPosts] = useState<
    Array<{ post: EditablePortfolioPost; imageFile: File | null }>
  >([]);
  const [deletedPosts, setDeletedPosts] = useState<Set<number>>(new Set());

  // Translation state
  const [translations, setTranslations] = useState<{
    en: Record<string, string>;
    it: Record<string, string>;
  }>({
    en: {},
    it: {},
  });
  const [originalTranslations, setOriginalTranslations] =
    useState(translations);
  const [translationLocale, setTranslationLocale] = useState<'en' | 'it'>('en');
  const [isTranslationsExpanded, setIsTranslationsExpanded] = useState(false);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  const { user } = useLayoutStore();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'en') as 'en' | 'it';

  useEffect(() => {
    fetchPortfolioData();
    fetchAuthors();
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

        const postsEn =
          (enData?.translations?.['posts-section'] as Record<string, string>) ||
          {};
        const postsIt =
          (itData?.translations?.['posts-section'] as Record<string, string>) ||
          {};

        const newTranslations = {
          en: postsEn,
          it: postsIt,
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

  // Set default author to current user when creating
  useEffect(() => {
    if (mode === 'create' && user && !formData.author_id) {
      setFormData((prev) => ({ ...prev, author_id: user.id }));
    }
  }, [mode, user, formData.author_id]);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await portfolioActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch portfolio data');
      }
      const loadedPosts = (result.data as PortfolioPost[]).map((post) => ({
        ...post,
        image_file: null,
      }));
      setPortfolioPosts(loadedPosts);
      setOriginalPosts(JSON.parse(JSON.stringify(loadedPosts))); // Deep copy
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch portfolio data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const result = await portfolioActions({ type: 'GET_AUTHORS' });
      if (result.success) {
        setAuthors(result.data as Author[]);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  const handleFormChange = (field: keyof PortfolioFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateForm = () => {
    setFormData(emptyFormData);
    setFormImage(null);
    setEditingPostId(null);
    setMode('create');
  };

  const openEditForm = (post: PortfolioPost & { author_id?: string }) => {
    setFormData({
      title_en: post.title_en ?? '',
      title_it: post.title_it ?? '',
      image: post.image ?? '',
      source_link: post.source_link ?? '',
      demo_link: post.demo_link ?? '',
      description_en: post.description_en ?? '',
      description_it: post.description_it ?? '',
      body_en: post.body_en ?? '',
      body_it: post.body_it ?? '',
      blurhashURL: post.blurhashURL ?? '',
      post_tags: post.post_tags ?? '',
      store_link: post.store_link ?? '',
      created_at:
        post.created_at?.split('T')[0] ??
        new Date().toISOString().split('T')[0],
      author_id: post.author_id ?? user?.id ?? '',
    });
    setFormImage(null);
    setEditingPostId(post.id);
    setMode('edit');
  };

  const closeForm = () => {
    setFormData(emptyFormData);
    setFormImage(null);
    setEditingPostId(null);
    setMode('list');
  };

  const cancelFormEdit = () => {
    if (editingPostId) {
      // Revert to original data
      const originalPost = originalPosts.find((p) => p.id === editingPostId);
      if (originalPost) {
        setPortfolioPosts((prev) =>
          prev.map((post) =>
            post.id === editingPostId
              ? { ...originalPost, image_file: null }
              : post
          )
        );
        // Remove from modified set
        setModifiedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(editingPostId);
          return newSet;
        });
      }
    }
    closeForm();
  };

  const handleCreatePortfolio = () => {
    if (!formImage) {
      setError(t('portfolio.selectImage'));
      return;
    }

    // Generate temporary ID
    const tempId = -Date.now();
    const newPost: EditablePortfolioPost = {
      id: tempId,
      title_en: formData.title_en,
      title_it: formData.title_it,
      image: '',
      source_link: formData.source_link,
      demo_link: formData.demo_link,
      description_en: formData.description_en,
      description_it: formData.description_it,
      body_en: formData.body_en,
      body_it: formData.body_it,
      blurhashURL: formData.blurhashURL,
      post_tags: formData.post_tags,
      store_link: formData.store_link,
      created_at: formData.created_at,
      views: 0,
      image_file: formImage,
    };

    // Add to local state
    setPortfolioPosts((prev) => [...prev, newPost]);
    setNewPosts((prev) => [...prev, { post: newPost, imageFile: formImage }]);

    // Close form
    closeForm();
  };

  const handleUpdatePortfolio = () => {
    if (!editingPostId) return;

    // Update local state
    setPortfolioPosts((prev) =>
      prev.map((post) =>
        post.id === editingPostId
          ? {
              ...post,
              title_en: formData.title_en,
              title_it: formData.title_it,
              source_link: formData.source_link,
              demo_link: formData.demo_link,
              store_link: formData.store_link,
              description_en: formData.description_en,
              description_it: formData.description_it,
              body_en: formData.body_en,
              body_it: formData.body_it,
              post_tags: formData.post_tags,
              created_at: formData.created_at,
              author_id: formData.author_id,
              image_file: formImage || post.image_file,
            }
          : post
      )
    );

    // Track modification
    setModifiedPosts((prev) => new Set(prev).add(editingPostId));

    // Close form
    closeForm();
  };

  const handleDeletePortfolio = (postId: number) => {
    if (!confirm(t('common.confirmDelete'))) return;

    // Check if it's a new post (temp ID)
    const isNewPost = newPosts.some((np) => np.post.id === postId);

    if (isNewPost) {
      // Remove from new posts
      setNewPosts((prev) => prev.filter((np) => np.post.id !== postId));
    } else {
      // Track for deletion
      setDeletedPosts((prev) => new Set(prev).add(postId));
    }

    // Remove from modified posts if present
    setModifiedPosts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });

    // Remove from local state
    setPortfolioPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith('image/'));

    if (imageFile) {
      setFormImage(imageFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImage(file);
    }
  };

  const handleTranslationChange = (
    locale: 'en' | 'it',
    key: string,
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [key]: value },
    }));
  };

  const hasTranslationChanges = () => {
    return (
      JSON.stringify(translations) !== JSON.stringify(originalTranslations)
    );
  };

  const cancelAllChanges = () => {
    if (!confirm(t('common.confirmCancel'))) {
      return;
    }

    // Reload original data
    fetchPortfolioData();
    fetchTranslations();

    // Reset all tracking
    setModifiedPosts(new Set());
    setNewPosts([]);
    setDeletedPosts(new Set());
    closeForm();
  };

  const applyAllChanges = async () => {
    const createdForRollback: { postId: number; imagePath: string }[] = [];
    try {
      setIsUpdating(true);
      setError(null);

      // 1. Create new posts first (so we can roll back only creates on failure)
      for (const { post, imageFile } of newPosts) {
        if (!imageFile) {
          throw new Error(
            `Image is required for portfolio post ${post.title_en}`
          );
        }

        const processed = await processImageToWebP(imageFile, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
        });

        if (!processed.success || !processed.file) {
          throw new Error(processed.error || 'Failed to process image');
        }

        const imageResult = await portfolioActions({
          type: 'UPLOAD_IMAGE_FOR_NEW_POST',
          file: processed.file,
          titleEn: post.title_en,
        });

        if (!imageResult.success) {
          throw new Error(
            imageResult.error || `Failed to upload image for ${post.title_en}`
          );
        }

        const {
          image: imageUrl,
          blurhashURL: uploadedBlurhash,
          path: imagePath,
        } = imageResult.data as {
          image: string;
          blurhashURL: string;
          path: string;
        };

        const createResult = await portfolioActions({
          type: 'CREATE',
          data: {
            title_en: post.title_en,
            title_it: post.title_it,
            source_link: post.source_link,
            demo_link: post.demo_link,
            store_link: post.store_link,
            description_en: post.description_en,
            description_it: post.description_it,
            body_en: post.body_en,
            body_it: post.body_it,
            post_tags: post.post_tags,
            created_at: post.created_at,
            author_id: user?.id || '',
            image: imageUrl,
            blurhashURL: uploadedBlurhash || post.blurhashURL || '',
          },
        });

        if (!createResult.success) {
          throw new Error(
            createResult.error ||
              `Failed to create portfolio post ${post.title_en}`
          );
        }

        const newRow = createResult.data as { id: number };
        createdForRollback.push({ postId: newRow.id, imagePath });
      }

      // 2. Update modified posts
      for (const postId of modifiedPosts) {
        const post = portfolioPosts.find((p) => p.id === postId);
        if (!post) continue;

        // Update post data
        const updateResult = await portfolioActions({
          type: 'UPDATE',
          id: postId,
          data: {
            title_en: post.title_en,
            title_it: post.title_it,
            source_link: post.source_link,
            demo_link: post.demo_link,
            store_link: post.store_link,
            description_en: post.description_en,
            description_it: post.description_it,
            body_en: post.body_en,
            body_it: post.body_it,
            post_tags: post.post_tags,
            created_at: post.created_at,
            author_id: post.author_id,
          },
        });

        if (!updateResult.success) {
          throw new Error(
            updateResult.error ||
              `Failed to update portfolio post ${post.title_en}`
          );
        }

        // Upload image if there's a new file
        if (post.image_file) {
          // Process image to WebP before upload
          const processed = await processImageToWebP(post.image_file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.85,
          });

          if (!processed.success || !processed.file) {
            throw new Error(processed.error || 'Failed to process image');
          }

          const imageResult = await portfolioActions({
            type: 'UPLOAD_IMAGE',
            portfolioId: postId,
            file: processed.file,
            currentImageUrl: post.image,
          });

          if (!imageResult.success) {
            throw new Error(
              imageResult.error || `Failed to upload image for ${post.title_en}`
            );
          }
        }
      }

      // 3. Delete posts
      for (const postId of deletedPosts) {
        const result = await portfolioActions({ type: 'DELETE', id: postId });

        if (!result.success) {
          throw new Error(
            result.error || `Failed to delete portfolio post ${postId}`
          );
        }
      }

      // 4. Save translations if changed
      if (hasTranslationChanges()) {
        // Update English translations
        const enResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'en',
          sectionKey: 'posts-section',
          sectionData: translations.en,
        });
        if (!enResult.success) {
          throw new Error(
            enResult.error || 'Failed to update English translations'
          );
        }

        // Update Italian translations
        const itResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: 'it',
          sectionKey: 'posts-section',
          sectionData: translations.it,
        });
        if (!itResult.success) {
          throw new Error(
            itResult.error || 'Failed to update Italian translations'
          );
        }

        setOriginalTranslations(JSON.parse(JSON.stringify(translations)));
      }

      // Refresh data and reset all tracking
      await fetchPortfolioData();
      setModifiedPosts(new Set());
      setNewPosts([]);
      setDeletedPosts(new Set());

      alert(`${t('common.applyChanges')}!`);
    } catch (error) {
      console.error('Error applying changes:', error);
      // Roll back created posts and their images (reverse order)
      for (let i = createdForRollback.length - 1; i >= 0; i--) {
        const { postId, imagePath } = createdForRollback[i];
        await portfolioActions({ type: 'ROLLBACK_CREATE', postId, imagePath });
      }
      setError(
        error instanceof Error ? error.message : 'Failed to apply changes'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = () => {
    return (
      modifiedPosts.size > 0 ||
      newPosts.length > 0 ||
      deletedPosts.size > 0 ||
      hasTranslationChanges()
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main" />
      </div>
    );
  }

  // Form view (create or edit)
  if (mode === 'create' || mode === 'edit') {
    const isEditing = mode === 'edit';
    const currentImage = formImage
      ? URL.createObjectURL(formImage)
      : isEditing
        ? formData.image
        : null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-darktext dark:text-lighttext">
            {isEditing ? t('portfolio.editPost') : t('portfolio.createNewPost')}
          </h2>
          <button
            type="button"
            onClick={closeForm}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-darkergray text-darktext dark:text-lighttext rounded-lg hover:bg-gray-300 dark:hover:bg-darkestgray transition-colors"
          >
            <X className="h-4 w-4" />
            {t('common.cancel')}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="p-6 bg-bglight dark:bg-darkgray rounded-lg border-2 border-main">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                {t('portfolio.titleEnLabel')}
              </label>
              <input
                type="text"
                value={formData.title_en}
                onChange={(e) => handleFormChange('title_en', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                placeholder={t('portfolio.titleEnPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                {t('portfolio.titleItLabel')}
              </label>
              <input
                type="text"
                value={formData.title_it}
                onChange={(e) => handleFormChange('title_it', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                placeholder={t('portfolio.titleItPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                {t('portfolio.sourceLinkLabel')}
              </label>
              <input
                type="url"
                value={formData.source_link}
                onChange={(e) =>
                  handleFormChange('source_link', e.target.value)
                }
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                placeholder={t('portfolio.sourceLinkPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                {t('portfolio.demoLinkLabel')}
              </label>
              <input
                type="url"
                value={formData.demo_link}
                onChange={(e) => handleFormChange('demo_link', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                placeholder={t('portfolio.demoLinkPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                {t('portfolio.storeLinkLabel')}
              </label>
              <input
                type="url"
                value={formData.store_link}
                onChange={(e) => handleFormChange('store_link', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                placeholder={t('portfolio.storeLinkPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                {t('portfolio.descriptionEnLabel')}
              </label>
              <textarea
                value={formData.description_en}
                onChange={(e) =>
                  handleFormChange('description_en', e.target.value)
                }
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                rows={3}
                placeholder={t('portfolio.descriptionEnPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                {t('portfolio.descriptionItLabel')}
              </label>
              <textarea
                value={formData.description_it}
                onChange={(e) =>
                  handleFormChange('description_it', e.target.value)
                }
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                rows={3}
                placeholder={t('portfolio.descriptionItPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                {t('portfolio.bodyEnLabel')}
              </label>
              <textarea
                value={formData.body_en}
                onChange={(e) => handleFormChange('body_en', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                rows={5}
                placeholder={t('portfolio.bodyEnPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                {t('portfolio.bodyItLabel')}
              </label>
              <textarea
                value={formData.body_it}
                onChange={(e) => handleFormChange('body_it', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                rows={5}
                placeholder={t('portfolio.bodyItPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                Tags
              </label>
              <input
                type="text"
                value={formData.post_tags}
                onChange={(e) => handleFormChange('post_tags', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                placeholder={`"tag1" "tag2" "tag3"`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Publication Date
              </label>
              <input
                type="date"
                value={formData.created_at}
                onChange={(e) => handleFormChange('created_at', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Author
              </label>
              <select
                value={formData.author_id}
                onChange={(e) => handleFormChange('author_id', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-darkergray border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary text-darktext dark:text-lighttext"
                required
              >
                <option value="">Select an author</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-main mb-2">
              Image {isEditing && !formImage && '(leave empty to keep current)'}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-main bg-main/10 dark:bg-main/20'
                  : 'border-main'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {currentImage ? (
                <div className="space-y-2">
                  <Image
                    src={currentImage}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="mx-auto rounded-lg object-cover"
                  />
                  <p className="text-sm text-darktext dark:text-lighttext2">
                    {formImage ? formImage.name : t('portfolio.changeImage')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm text-darktext dark:text-lighttext2">
                    Drag and drop an image here, or click to select
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                id="form-image"
              />
              <label
                htmlFor="form-image"
                className="mt-2 inline-block px-4 py-2 bg-secondary text-white rounded-lg cursor-pointer hover:bg-tertiary transition-colors border-2 border-secondary hover:border-tertiary"
              >
                {currentImage
                  ? t('portfolio.changeImage')
                  : t('portfolio.selectImage')}
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={isEditing ? cancelFormEdit : closeForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => setIsPostPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-tertiary text-white rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4" />
              {t('portfolio.previewPost')}
            </button>
            <button
              type="button"
              onClick={
                isEditing ? handleUpdatePortfolio : handleCreatePortfolio
              }
              className="flex items-center gap-2 px-4 py-2 bg-main hover:bg-secondary text-white rounded-lg transition-colors"
            >
              {t('common.done')}
            </button>
          </div>
        </div>

        <PreviewModal
          isOpen={isPostPreviewOpen}
          onClose={() => setIsPostPreviewOpen(false)}
          title={t('portfolio.postPreviewTitle')}
        >
          <PostPreview
            formData={formData}
            postType="portfolio"
            locale={locale}
            imageFile={formImage}
            author={authors.find((a) => a.id === formData.author_id) || null}
            views={
              isEditing && editingPostId
                ? portfolioPosts.find((p) => p.id === editingPostId)?.views || 0
                : 0
            }
          />
        </PreviewModal>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6 mb-8 md:mb-0 lg:mt-0">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="hidden lg:block text-2xl md:text-3xl lg:text-4xl font-bold text-main mb-2 md:mb-4">
          {t('portfolio.title')}
        </h1>
        <p className="text-gray-500 dark:text-lighttext2 text-lg mb-4">
          {t('portfolio.subtitle')}
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
      <div className="bg-gray-100 dark:bg-darkergray rounded-xl p-6 mb-6">
        <button
          type="button"
          onClick={() => setIsTranslationsExpanded(!isTranslationsExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-xl font-bold text-main mb-4 flex items-center gap-2">
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
                    {t('portfolio.translationTitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].title1 || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'title1',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.translationTitlePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.translationSubtitleLabel')}
                  </label>
                  <textarea
                    value={translations[translationLocale].subtitle1 || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'subtitle1',
                        e.target.value
                      )
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden resize-y"
                    placeholder={t('portfolio.translationSubtitlePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.buttonTextLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].button || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'button',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.exploreMorePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.demoLabelLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].demo || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'demo',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.liveDemoPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.storeLabelLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].store || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'store',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.playStorePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.sourceLabelLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].source || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'source',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.sourceCodePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.copyButtonTextLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].copyButton || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'copyButton',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.copyLinkPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.preCopyTextLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].preCopy || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'preCopy',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.copiedPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.noPostsMessageLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale]['no-posts'] || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'no-posts',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.noPostsPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.rateLimitMessageLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].ratelimit || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'ratelimit',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.rateLimitPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darktext dark:text-lighttext mb-2">
                    {t('portfolio.searchbarPlaceholderLabel')}
                  </label>
                  <input
                    type="text"
                    value={translations[translationLocale].searchbar || ''}
                    onChange={(e) =>
                      handleTranslationChange(
                        translationLocale,
                        'searchbar',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-darkestgray border border-gray-300 dark:border-lighttext2 rounded-lg text-darktext dark:text-lighttext focus:border-main focus:outline-hidden"
                    placeholder={t('portfolio.searchPlaceholder')}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-darktext dark:text-lighttext">
          {t('portfolio.postsTitle')}
        </h2>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-secondary transition-colors border-2 border-main hover:border-secondary"
        >
          <Plus className="h-4 w-4" />
          {t('portfolio.addPortfolioPost')}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolioPosts.map((post) => (
          <div
            key={post.id}
            className="bg-bglight dark:bg-darkgray rounded-lg border-2 border-main overflow-hidden"
          >
            <div className="relative">
              <ListPostImage
                imageFile={post.image_file}
                imageUrl={post.image}
                blurhashURL={post.blurhashURL}
                alt={post.title_en}
              />
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-darktext dark:text-lighttext truncate">
                  {post.title_en}
                </h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEditForm(post)}
                    className="p-1 text-main hover:text-secondary transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePortfolio(post.id)}
                    className="p-1 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-darktext dark:text-lighttext2 mb-2 line-clamp-2">
                {post.description_en}
              </p>

              <div className="flex items-center gap-2 text-xs text-darktext dark:text-lighttext2">
                <Calendar className="h-3 w-3" />
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <FileText className="h-3 w-3" />
                <span>{post.views} views</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {portfolioPosts.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-main mb-4" />
          <p className="text-darktext dark:text-lighttext2">
            {t('portfolio.noPortfolioPosts')}
          </p>
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={t('portfolio.previewTitle')}
      >
        <PortfolioPreview
          posts={portfolioPosts}
          deletedPostIds={deletedPosts}
        />
      </PreviewModal>
    </div>
  );
}
