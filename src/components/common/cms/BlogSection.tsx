'use client';

import { type Author, blogActions } from '@/app/actions/cms/sections/blogActions';
import { useLayoutStore } from '@/store/layoutStore';
import type { BlogPost } from '@/types/fetchedData.types';
import {
  Calendar,
  Edit3,
  FileText,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';

type FormMode = 'list' | 'create' | 'edit';

type BlogFormData = {
  title_en: string;
  title_it: string;
  image: string;
  description_en: string;
  description_it: string;
  body_en: string;
  body_it: string;
  blurhashURL: string;
  post_tags: string;
  created_at: string;
  author_id: string;
};

const emptyFormData: BlogFormData = {
  title_en: '',
  title_it: '',
  image: '',
  description_en: '',
  description_it: '',
  body_en: '',
  body_it: '',
  blurhashURL: '',
  post_tags: '',
  created_at: new Date().toISOString().split('T')[0],
  author_id: '',
};

export default function BlogSection() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [mode, setMode] = useState<FormMode>('list');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(emptyFormData);
  const [formImage, setFormImage] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { user } = useLayoutStore();

  useEffect(() => {
    fetchBlogData();
    fetchAuthors();
  }, []);

  // Set default author to current user when creating
  useEffect(() => {
    if (mode === 'create' && user && !formData.author_id) {
      setFormData(prev => ({ ...prev, author_id: user.id }));
    }
  }, [mode, user, formData.author_id]);

  const fetchBlogData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await blogActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch blog data');
      }
      setBlogPosts(result.data as BlogPost[]);
    } catch (error) {
      console.error('Error fetching blog data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch blog data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const result = await blogActions({ type: 'GET_AUTHORS' });
      if (result.success) {
        setAuthors(result.data as Author[]);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  const handleFormChange = (field: keyof BlogFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateForm = () => {
    setFormData(emptyFormData);
    setFormImage(null);
    setEditingPostId(null);
    setMode('create');
  };

  const openEditForm = (post: BlogPost & { author_id?: string }) => {
    setFormData({
      title_en: post.title_en ?? '',
      title_it: post.title_it ?? '',
      image: post.image ?? '',
      description_en: post.description_en ?? '',
      description_it: post.description_it ?? '',
      body_en: post.body_en ?? '',
      body_it: post.body_it ?? '',
      blurhashURL: post.blurhashURL ?? '',
      post_tags: post.post_tags ?? '',
      created_at: post.created_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
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

  const handleCreateBlog = async () => {
    if (!formImage) {
      setError('Please select an image for the blog post');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await blogActions({
        type: 'CREATE',
        data: {
          ...formData,
          image: '',
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create blog post');
      }

      const newPost = result.data as BlogPost;

      const imageResult = await blogActions({
        type: 'UPLOAD_IMAGE',
        blogId: newPost.id,
        file: formImage,
      });

      if (!imageResult.success) {
        throw new Error(imageResult.error || 'Failed to upload image');
      }

      closeForm();
      await fetchBlogData();
    } catch (error) {
      console.error('Error creating blog post:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create blog post'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBlog = async () => {
    if (!editingPostId) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await blogActions({
        type: 'UPDATE',
        id: editingPostId,
        data: {
          title_en: formData.title_en,
          title_it: formData.title_it,
          description_en: formData.description_en,
          description_it: formData.description_it,
          body_en: formData.body_en,
          body_it: formData.body_it,
          post_tags: formData.post_tags,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update blog post');
      }

      // Upload new image if selected
      if (formImage) {
        const imageResult = await blogActions({
          type: 'UPLOAD_IMAGE',
          blogId: editingPostId,
          file: formImage,
          currentImageUrl: formData.image,
        });

        if (!imageResult.success) {
          throw new Error(imageResult.error || 'Failed to upload image');
        }
      }

      closeForm();
      await fetchBlogData();
    } catch (error) {
      console.error('Error updating blog post:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update blog post'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlog = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    setError(null);

    try {
      const result = await blogActions({ type: 'DELETE', id: postId });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete blog post');
      }

      setBlogPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Error deleting blog post:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete blog post'
      );
    }
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
      : isEditing ? formData.image : null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-darktext dark:text-lighttext">
            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h2>
          <button
            type="button"
            onClick={closeForm}
            className="flex items-center gap-2 px-4 py-2 bg-darkgray dark:bg-darkergray text-lighttext rounded-lg hover:bg-darkergray dark:hover:bg-darkestgray transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
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
                English Title
              </label>
              <input
                type="text"
                value={formData.title_en}
                onChange={(e) => handleFormChange('title_en', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                placeholder="Enter English title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                Italian Title
              </label>
              <input
                type="text"
                value={formData.title_it}
                onChange={(e) => handleFormChange('title_it', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                placeholder="Enter Italian title"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                English Description
              </label>
              <textarea
                value={formData.description_en}
                onChange={(e) => handleFormChange('description_en', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={3}
                placeholder="Enter English description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                Italian Description
              </label>
              <textarea
                value={formData.description_it}
                onChange={(e) => handleFormChange('description_it', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={3}
                placeholder="Enter Italian description"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                English Content
              </label>
              <textarea
                value={formData.body_en}
                onChange={(e) => handleFormChange('body_en', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={5}
                placeholder="Enter English content"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main mb-1">
                Italian Content
              </label>
              <textarea
                value={formData.body_it}
                onChange={(e) => handleFormChange('body_it', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={5}
                placeholder="Enter Italian content"
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
                className="w-full px-3 py-2 border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                placeholder="Enter tags (comma separated)"
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
                className="w-full px-3 py-2 border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
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
                className="w-full px-3 py-2 border-2 border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
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
                    {formImage ? formImage.name : 'Current image'}
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
                {currentImage ? 'Change Image' : 'Select Image'}
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={isEditing ? handleUpdateBlog : handleCreateBlog}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-secondary disabled:opacity-50 transition-colors border-2 border-main hover:border-secondary"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : isEditing ? 'Update Blog Post' : 'Create Blog Post'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 bg-darkgray dark:bg-darkergray text-lighttext rounded-lg hover:bg-darkergray dark:hover:bg-darkestgray transition-colors border-2 border-darkgray dark:border-darkergray"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-darktext dark:text-lighttext">
          Blog Posts
        </h2>
        <button
          type="button"
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-secondary transition-colors border-2 border-main hover:border-secondary"
        >
          <Plus className="h-4 w-4" />
          Add Blog Post
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.map((post) => (
          <div
            key={post.id}
            className="bg-bglight dark:bg-darkgray rounded-lg border-2 border-main overflow-hidden"
          >
            <div className="relative">
              {post.image ? (
                <Image
                  src={post.image}
                  alt={post.title_en}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover"
                  placeholder="blur"
                  blurDataURL={post.blurhashURL}
                />
              ) : (
                <div className="h-48 flex items-center justify-center bg-bglight dark:bg-darkergray">
                  <ImageIcon className="h-8 w-8 text-main" />
                </div>
              )}
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
                    onClick={() => handleDeleteBlog(post.id)}
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

      {blogPosts.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-main mb-4" />
          <p className="text-darktext dark:text-lighttext2">
            No blog posts found. Create your first blog post!
          </p>
        </div>
      )}
    </div>
  );
}
