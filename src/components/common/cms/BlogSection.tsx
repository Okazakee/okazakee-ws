'use client';

import { blogActions } from '@/app/actions/cms/sections/blogActions';
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
  X,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';

type BlogPostWithEditing = BlogPost & {
  isEditing: boolean;
};

type NewBlogPost = {
  title_en: string;
  title_it: string;
  image: string;
  description_en: string;
  description_it: string;
  body_en: string;
  body_it: string;
  blurhashURL: string;
  post_tags: string;
};

export default function BlogSection() {
  const [blogPosts, setBlogPosts] = useState<BlogPostWithEditing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBlogPost, setNewBlogPost] = useState<NewBlogPost>({
    title_en: '',
    title_it: '',
    image: '',
    description_en: '',
    description_it: '',
    body_en: '',
    body_it: '',
    blurhashURL: '',
    post_tags: '',
  });

  // Drag and drop states
  const [dragStates, setDragStates] = useState<Record<string, boolean>>({});
  const [newPostImage, setNewPostImage] = useState<File | null>(null);

  useEffect(() => {
    fetchBlogData();
  }, []);

  const fetchBlogData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await blogActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch blog data');
      }

      const postsWithEditing = (result.data as BlogPost[]).map(
        (post: BlogPost) => ({
          ...post,
          isEditing: false,
        })
      );

      setBlogPosts(postsWithEditing);
    } catch (error) {
      console.error('Error fetching blog data:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch blog data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    postId: number,
    field: string,
    value: string | boolean | null
  ) => {
    setBlogPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, [field]: value } : post
      )
    );
  };

  const handleNewPostInputChange = (field: string, value: string) => {
    setNewBlogPost((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateBlog = async () => {
    if (!newPostImage) {
      setError('Please select an image for the blog post');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await blogActions({
        type: 'CREATE',
        data: {
          ...newBlogPost,
          image: '', // Will be set after image upload
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create blog post');
      }

      const newPost = result.data as BlogPost;

      // Upload image
      const imageResult = await blogActions({
        type: 'UPLOAD_IMAGE',
        blogId: newPost.id,
        file: newPostImage,
      });

      if (!imageResult.success) {
        throw new Error(imageResult.error || 'Failed to upload image');
      }

      // Reset form
      setNewBlogPost({
        title_en: '',
        title_it: '',
        image: '',
        description_en: '',
        description_it: '',
        body_en: '',
        body_it: '',
        blurhashURL: '',
        post_tags: '',
      });
      setNewPostImage(null);
      setIsCreating(false);

      // Refresh data
      await fetchBlogData();
    } catch (error) {
      console.error('Error creating blog post:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create blog post'
      );
      setIsCreating(false);
    }
  };

  const handleUpdateBlog = async (postId: number) => {
    const post = blogPosts.find((p) => p.id === postId);
    if (!post) return;

    setError(null);

    try {
      const result = await blogActions({
        type: 'UPDATE',
        id: postId,
        data: {
          title_en: post.title_en,
          title_it: post.title_it,
          description_en: post.description_en,
          description_it: post.description_it,
          body_en: post.body_en,
          body_it: post.body_it,
          post_tags: post.post_tags,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update blog post');
      }

      // Update local state
      setBlogPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isEditing: false } : p))
      );
    } catch (error) {
      console.error('Error updating blog post:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update blog post'
      );
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

      // Remove from local state
      setBlogPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Error deleting blog post:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete blog post'
      );
    }
  };

  const handleImageUpload = async (postId: number, file: File) => {
    setError(null);

    try {
      const post = blogPosts.find((p) => p.id === postId);
      if (!post) return;

      const result = await blogActions({
        type: 'UPLOAD_IMAGE',
        blogId: postId,
        file,
        currentImageUrl: post.image,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      // Refresh data to get updated image
      await fetchBlogData();
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    }
  };

  const handleDragOver = (e: React.DragEvent, postId: string) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [postId]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, postId: string) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [postId]: false }));
  };

  const handleDrop = (e: React.DragEvent, postId: string) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [postId]: false }));

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith('image/'));

    if (imageFile) {
      if (postId === 'new') {
        setNewPostImage(imageFile);
      } else {
        handleImageUpload(parseInt(postId), imageFile);
      }
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    postId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (postId === 'new') {
        setNewPostImage(file);
      } else {
        handleImageUpload(parseInt(postId), file);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-darktext dark:text-lighttext">
          Blog Posts
        </h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
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

      {isCreating && (
        <div className="p-6 bg-bglight dark:bg-darkgray rounded-lg border-2 border-main dark:border-main">
          <h3 className="text-lg font-semibold mb-4 text-darktext dark:text-lighttext">
            Create New Blog Post
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                English Title
              </label>
              <input
                type="text"
                value={newBlogPost.title_en}
                onChange={(e) => handleNewPostInputChange('title_en', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                placeholder="Enter English title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                Italian Title
              </label>
              <input
                type="text"
                value={newBlogPost.title_it}
                onChange={(e) => handleNewPostInputChange('title_it', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                placeholder="Enter Italian title"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                English Description
              </label>
              <textarea
                value={newBlogPost.description_en}
                onChange={(e) => handleNewPostInputChange('description_en', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={3}
                placeholder="Enter English description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                Italian Description
              </label>
              <textarea
                value={newBlogPost.description_it}
                onChange={(e) => handleNewPostInputChange('description_it', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={3}
                placeholder="Enter Italian description"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                English Content
              </label>
              <textarea
                value={newBlogPost.body_en}
                onChange={(e) => handleNewPostInputChange('body_en', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={5}
                placeholder="Enter English content"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-main dark:text-main mb-1">
                Italian Content
              </label>
              <textarea
                value={newBlogPost.body_it}
                onChange={(e) => handleNewPostInputChange('body_it', e.target.value)}
                className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                rows={5}
                placeholder="Enter Italian content"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-main dark:text-main mb-1">
              Tags
            </label>
            <input
              type="text"
              value={newBlogPost.post_tags}
              onChange={(e) => handleNewPostInputChange('post_tags', e.target.value)}
              className="w-full px-3 py-2 border-2 border-main dark:border-main rounded-lg focus:ring-2 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
              placeholder="Enter tags (comma separated)"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-main dark:text-main mb-2">
              Image
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
              {newPostImage ? (
                <div className="space-y-2">
                  <Image
                    src={URL.createObjectURL(newPostImage)}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="mx-auto rounded-lg"
                  />
                  <p className="text-sm text-darktext dark:text-lighttext2">
                    {newPostImage.name}
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
                onChange={(e) => handleFileInputChange(e, 'new')}
                className="hidden"
                id="new-post-image"
              />
              <label
                htmlFor="new-post-image"
                className="mt-2 inline-block px-4 py-2 bg-secondary text-white rounded-lg cursor-pointer hover:bg-tertiary transition-colors border-2 border-secondary hover:border-tertiary"
              >
                Select Image
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateBlog}
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-secondary disabled:opacity-50 transition-colors border-2 border-main hover:border-secondary"
            >
              <Save className="h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create Blog Post'}
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
        {blogPosts.map((post) => (
          <div
            key={post.id}
            className="bg-bglight dark:bg-darkgray rounded-lg border-2 border-main dark:border-main overflow-hidden"
          >
            <div className="relative">
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    dragStates[post.id.toString()]
                      ? 'border-main bg-main/10 dark:bg-main/20'
                      : 'border-main dark:border-main'
                  }`}
                  onDragOver={(e) => handleDragOver(e, post.id.toString())}
                  onDragLeave={(e) => handleDragLeave(e, post.id.toString())}
                  onDrop={(e) => handleDrop(e, post.id.toString())}
                >
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={post.title_en}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-lg"
                    placeholder="blur"
                    blurDataURL={post.blurhashURL}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center bg-bglight dark:bg-darkergray rounded-lg">
                    <ImageIcon className="h-8 w-8 text-main dark:text-main" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileInputChange(e, post.id.toString())}
                  className="hidden"
                  id={`image-${post.id}`}
                />
                <label
                  htmlFor={`image-${post.id}`}
                  className="mt-2 inline-block px-3 py-1 bg-secondary text-white rounded text-sm cursor-pointer hover:bg-tertiary transition-colors border border-secondary hover:border-tertiary"
                >
                  <Upload className="h-3 w-3 inline mr-1" />
                  Change Image
                </label>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-darktext dark:text-lighttext">
                  {post.title_en}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      handleInputChange(post.id, 'isEditing', !post.isEditing)
                    }
                    className="p-1 text-main hover:text-secondary transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBlog(post.id)}
                    className="p-1 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-darktext dark:text-lighttext2 mb-2">
                {post.description_en}
              </p>

              <div className="flex items-center gap-2 text-xs text-darktext dark:text-lighttext2">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                <FileText className="h-3 w-3" />
                <span>{post.views} views</span>
              </div>

              {post.isEditing && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      English Title
                    </label>
                    <input
                      type="text"
                      value={post.title_en}
                      onChange={(e) =>
                        handleInputChange(post.id, 'title_en', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Italian Title
                    </label>
                    <input
                      type="text"
                      value={post.title_it}
                      onChange={(e) =>
                        handleInputChange(post.id, 'title_it', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      English Description
                    </label>
                    <textarea
                      value={post.description_en}
                      onChange={(e) =>
                        handleInputChange(post.id, 'description_en', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Italian Description
                    </label>
                    <textarea
                      value={post.description_it}
                      onChange={(e) =>
                        handleInputChange(post.id, 'description_it', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      English Content
                    </label>
                    <textarea
                      value={post.body_en}
                      onChange={(e) =>
                        handleInputChange(post.id, 'body_en', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Italian Content
                    </label>
                    <textarea
                      value={post.body_it}
                      onChange={(e) =>
                        handleInputChange(post.id, 'body_it', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-main dark:text-main mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={post.post_tags}
                      onChange={(e) =>
                        handleInputChange(post.id, 'post_tags', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border-2 border-main dark:border-main rounded focus:ring-1 focus:ring-main focus:border-secondary dark:bg-darkergray dark:text-lighttext"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateBlog(post.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-main text-white text-sm rounded hover:bg-secondary transition-colors border border-main hover:border-secondary"
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </button>
                    <button
                      onClick={() =>
                        handleInputChange(post.id, 'isEditing', false)
                      }
                      className="px-3 py-1 bg-darkgray dark:bg-darkergray text-lighttext dark:text-lighttext text-sm rounded hover:bg-darkergray dark:hover:bg-darkestgray transition-colors border border-darkgray dark:border-darkergray hover:border-darkergray dark:hover:border-darkestgray"
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

      {blogPosts.length === 0 && !isCreating && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-main dark:text-main mb-4" />
          <p className="text-darktext dark:text-lighttext2">
            No blog posts found. Create your first blog post!
          </p>
        </div>
      )}
    </div>
  );
}