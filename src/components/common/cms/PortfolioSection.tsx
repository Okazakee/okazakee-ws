'use client';

import { portfolioActions } from '@/app/actions/cms/sections/portfolioActions';
import type { PortfolioPost } from '@/types/fetchedData.types';
import {
  Briefcase,
  Calendar,
  Code,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Link,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';

type PortfolioPostWithEditing = PortfolioPost & {
  isEditing: boolean;
};

type NewPortfolioPost = {
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
};

export default function PortfolioSection() {
  const [portfolioPosts, setPortfolioPosts] = useState<
    PortfolioPostWithEditing[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPortfolioPost, setNewPortfolioPost] = useState<NewPortfolioPost>({
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
  });

  // Drag and drop states
  const [dragStates, setDragStates] = useState<Record<string, boolean>>({});
  const [newPostImage, setNewPostImage] = useState<File | null>(null);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await portfolioActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch portfolio data');
      }

      const postsWithEditing = (result.data as PortfolioPost[]).map(
        (post: PortfolioPost) => ({
          ...post,
          isEditing: false,
        })
      );

      setPortfolioPosts(postsWithEditing);
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

  const handleInputChange = (
    postId: number,
    field: string,
    value: string | boolean | null
  ) => {
    setPortfolioPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, [field]: value } : post
      )
    );
  };

  const handleNewPostChange = (field: string, value: string | null) => {
    setNewPortfolioPost((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEditing = (postId: number) => {
    setPortfolioPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isEditing: !post.isEditing } : post
      )
    );
  };

  const handleCreatePortfolio = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await portfolioActions({
        type: 'CREATE',
        data: newPortfolioPost,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create portfolio post');
      }

      // Upload image if provided
      if (newPostImage && result.data) {
        const createdPost = result.data as PortfolioPost;
        await portfolioActions({
          type: 'UPLOAD_IMAGE',
          portfolioId: createdPost.id,
          file: newPostImage,
        });
      }

      // Reset form
      setNewPortfolioPost({
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
      });
      setNewPostImage(null);

      // Refresh data
      await fetchPortfolioData();
    } catch (error) {
      console.error('Error creating portfolio post:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create portfolio post'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePortfolio = async (postId: number) => {
    setError(null);

    try {
      const post = portfolioPosts.find((p) => p.id === postId);
      if (!post) return;

      const result = await portfolioActions({
        type: 'UPDATE',
        id: postId,
        data: {
          title_en: post.title_en,
          title_it: post.title_it,
          image: post.image,
          source_link: post.source_link,
          demo_link: post.demo_link,
          description_en: post.description_en,
          description_it: post.description_it,
          body_en: post.body_en,
          body_it: post.body_it,
          blurhashURL: post.blurhashURL,
          post_tags: post.post_tags,
          store_link: post.store_link,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update portfolio post');
      }

      toggleEditing(postId);
      await fetchPortfolioData();
    } catch (error) {
      console.error('Error updating portfolio post:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update portfolio post'
      );
    }
  };

  const handleDeletePortfolio = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this portfolio post?'))
      return;

    setError(null);

    try {
      const result = await portfolioActions({
        type: 'DELETE',
        id: postId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete portfolio post');
      }

      await fetchPortfolioData();
    } catch (error) {
      console.error('Error deleting portfolio post:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete portfolio post'
      );
    }
  };

  const handleImageUpload = async (postId: number, file: File) => {
    setError(null);

    try {
      const post = portfolioPosts.find((p) => p.id === postId);
      if (!post) return;

      const result = await portfolioActions({
        type: 'UPLOAD_IMAGE',
        portfolioId: postId,
        file,
        currentImageUrl: post.image,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      await fetchPortfolioData();
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, postId: number) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [`image-${postId}`]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, postId: number) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [`image-${postId}`]: false }));
  };

  const handleDrop = (e: React.DragEvent, postId: number) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [`image-${postId}`]: false }));

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(postId, file);
      }
    }
  };

  // New post image handlers
  const handleNewPostDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, 'new-post-image': true }));
  };

  const handleNewPostDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, 'new-post-image': false }));
  };

  const handleNewPostDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, 'new-post-image': false }));

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setNewPostImage(file);
      }
    }
  };

  const handleNewPostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      setNewPostImage(file);
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
          Portfolio Section Editor
        </h1>
        <p className="text-lighttext2 text-lg">
          Manage your portfolio projects and showcase your work
        </p>
      </div>

      {/* Create New Portfolio Post */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4">
          Add New Portfolio Post
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="new-title-en"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Title (EN) *
            </label>
            <input
              id="new-title-en"
              type="text"
              value={newPortfolioPost.title_en}
              onChange={(e) => handleNewPostChange('title_en', e.target.value)}
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="e.g., E-commerce Platform"
            />
          </div>

          <div>
            <label
              htmlFor="new-title-it"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Title (IT) *
            </label>
            <input
              id="new-title-it"
              type="text"
              value={newPortfolioPost.title_it}
              onChange={(e) => handleNewPostChange('title_it', e.target.value)}
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="e.g., Piattaforma E-commerce"
            />
          </div>

          <div>
            <label
              htmlFor="new-source-link"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Source Code Link
            </label>
            <input
              id="new-source-link"
              type="url"
              value={newPortfolioPost.source_link}
              onChange={(e) =>
                handleNewPostChange('source_link', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="https://github.com/..."
            />
          </div>

          <div>
            <label
              htmlFor="new-demo-link"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Demo Link
            </label>
            <input
              id="new-demo-link"
              type="url"
              value={newPortfolioPost.demo_link}
              onChange={(e) => handleNewPostChange('demo_link', e.target.value)}
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="https://demo.example.com"
            />
          </div>

          <div>
            <label
              htmlFor="new-store-link"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Store Link
            </label>
            <input
              id="new-store-link"
              type="url"
              value={newPortfolioPost.store_link}
              onChange={(e) =>
                handleNewPostChange('store_link', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
              placeholder="https://appstore.com/..."
            />
          </div>

          <div>
            <label
              htmlFor="new-post-tags"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Tags
            </label>
            <input
              id="new-post-tags"
              type="text"
              value={newPortfolioPost.post_tags}
              onChange={(e) => handleNewPostChange('post_tags', e.target.value)}
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
              value={newPortfolioPost.description_en}
              onChange={(e) =>
                handleNewPostChange('description_en', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[80px]"
              placeholder="Brief description of the project..."
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
              value={newPortfolioPost.description_it}
              onChange={(e) =>
                handleNewPostChange('description_it', e.target.value)
              }
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[80px]"
              placeholder="Breve descrizione del progetto..."
            />
          </div>

          <div>
            <label
              htmlFor="new-body-en"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Full Content (EN) *
            </label>
            <textarea
              id="new-body-en"
              value={newPortfolioPost.body_en}
              onChange={(e) => handleNewPostChange('body_en', e.target.value)}
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[150px]"
              placeholder="Detailed project description with markdown support..."
            />
          </div>

          <div>
            <label
              htmlFor="new-body-it"
              className="block text-sm font-medium text-lighttext mb-2"
            >
              Full Content (IT) *
            </label>
            <textarea
              id="new-body-it"
              value={newPortfolioPost.body_it}
              onChange={(e) => handleNewPostChange('body_it', e.target.value)}
              className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[150px]"
              placeholder="Descrizione dettagliata del progetto con supporto markdown..."
            />
          </div>
        </div>

        {/* Image Upload for New Post */}
        <div className="mt-4">
          <label
            htmlFor="new-post-image-upload"
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Project Image
          </label>
          <div
            className="relative border-2 border-dashed border-lighttext2 rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-main"
            onDragOver={handleNewPostDragOver}
            onDragLeave={handleNewPostDragLeave}
            onDrop={handleNewPostDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleNewPostFileChange}
              className="hidden"
              id="new-post-image-upload"
            />
            <label htmlFor="new-post-image-upload" className="cursor-pointer">
              {newPostImage ? (
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-main" />
                    <p className="text-lighttext font-medium">
                      {newPostImage.name}
                    </p>
                    <p className="text-sm text-lighttext2">
                      Click to change image
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-lighttext2" />
                  <p className="text-lighttext2 font-medium">
                    Drop image here or click to browse
                  </p>
                </>
              )}
            </label>
            {dragStates['new-post-image'] && (
              <div className="absolute inset-0 bg-main/80 flex items-center justify-center rounded-lg border-2 border-dashed border-white">
                <div className="text-center text-white">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-medium">Drop image here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleCreatePortfolio}
            disabled={
              isCreating ||
              !newPortfolioPost.title_en ||
              !newPortfolioPost.title_it ||
              !newPortfolioPost.description_en ||
              !newPortfolioPost.description_it ||
              !newPortfolioPost.body_en ||
              !newPortfolioPost.body_it
            }
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Creating...' : 'Create Portfolio Post'}
          </button>
        </div>
      </div>

      {/* Manage Portfolio Posts */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4">
          Manage Portfolio Posts
        </h2>

        {portfolioPosts.length === 0 ? (
          <div className="text-center py-8 text-lighttext2">
            No portfolio posts found. Add your first portfolio post above.
          </div>
        ) : (
          <div className="space-y-6">
            {portfolioPosts.map((post) => (
              <div
                key={post.id}
                className="bg-darkestgray rounded-lg p-6 border border-lighttext2"
              >
                {post.isEditing ? (
                  <EditPortfolioForm
                    post={post}
                    onSave={() => handleUpdatePortfolio(post.id)}
                    onCancel={() => toggleEditing(post.id)}
                    onInputChange={handleInputChange}
                    onImageUpload={handleImageUpload}
                    dragStates={dragStates}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                  />
                ) : (
                  <PortfolioDisplay
                    post={post}
                    onEdit={() => toggleEditing(post.id)}
                    onDelete={() => handleDeletePortfolio(post.id)}
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

function PortfolioDisplay({
  post,
  onEdit,
  onDelete,
}: {
  post: PortfolioPostWithEditing;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4 flex-1">
        {post.image && (
          <div className="flex-shrink-0">
            <Image
              src={post.image}
              width={80}
              height={80}
              className="rounded-lg object-cover"
              alt={`${post.title_en} preview`}
              placeholder={post.blurhashURL ? 'blur' : 'empty'}
              blurDataURL={post.blurhashURL || undefined}
            />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-lighttext2" />
            <h3 className="text-lg font-bold text-lighttext">
              {post.title_en}
            </h3>
          </div>

          <div className="flex items-center gap-4 text-sm text-lighttext2 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            {post.post_tags && (
              <div className="flex items-center gap-1">
                <Code className="w-3 h-3" />
                <span>{post.post_tags}</span>
              </div>
            )}
          </div>

          <div className="text-sm text-lighttext2 line-clamp-2 mb-3">
            {post.description_en}
          </div>

          <div className="flex items-center gap-2 text-sm">
            {post.source_link && (
              <a
                href={post.source_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-main hover:underline"
              >
                <Code className="w-3 h-3" />
                Source
              </a>
            )}
            {post.demo_link && (
              <a
                href={post.demo_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-main hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Demo
              </a>
            )}
            {post.store_link && (
              <a
                href={post.store_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-main hover:underline"
              >
                <Link className="w-3 h-3" />
                Store
              </a>
            )}
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

function EditPortfolioForm({
  post,
  onSave,
  onCancel,
  onInputChange,
  onImageUpload,
  dragStates,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}: {
  post: PortfolioPostWithEditing;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: (
    postId: number,
    field: string,
    value: string | boolean | null
  ) => void;
  onImageUpload: (postId: number, file: File) => void;
  dragStates: Record<string, boolean>;
  handleDragOver: (e: React.DragEvent, postId: number) => void;
  handleDragLeave: (e: React.DragEvent, postId: number) => void;
  handleDrop: (e: React.DragEvent, postId: number) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      onImageUpload(post.id, file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`edit-title-en-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Title (EN) *
          </label>
          <input
            id={`edit-title-en-${post.id}`}
            type="text"
            value={post.title_en}
            onChange={(e) => onInputChange(post.id, 'title_en', e.target.value)}
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-title-it-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Title (IT) *
          </label>
          <input
            id={`edit-title-it-${post.id}`}
            type="text"
            value={post.title_it}
            onChange={(e) => onInputChange(post.id, 'title_it', e.target.value)}
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-source-link-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Source Code Link
          </label>
          <input
            id={`edit-source-link-${post.id}`}
            type="url"
            value={post.source_link}
            onChange={(e) =>
              onInputChange(post.id, 'source_link', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-demo-link-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Demo Link
          </label>
          <input
            id={`edit-demo-link-${post.id}`}
            type="url"
            value={post.demo_link}
            onChange={(e) =>
              onInputChange(post.id, 'demo_link', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-store-link-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Store Link
          </label>
          <input
            id={`edit-store-link-${post.id}`}
            type="url"
            value={post.store_link}
            onChange={(e) =>
              onInputChange(post.id, 'store_link', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-post-tags-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Tags
          </label>
          <input
            id={`edit-post-tags-${post.id}`}
            type="text"
            value={post.post_tags}
            onChange={(e) =>
              onInputChange(post.id, 'post_tags', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none"
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label
          htmlFor={`image-upload-${post.id}`}
          className="block text-sm font-medium text-lighttext mb-2"
        >
          Project Image
        </label>
        <div
          className="relative border-2 border-dashed border-lighttext2 rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-main"
          onDragOver={(e) => handleDragOver(e, post.id)}
          onDragLeave={(e) => handleDragLeave(e, post.id)}
          onDrop={(e) => handleDrop(e, post.id)}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={`image-upload-${post.id}`}
          />
          <label htmlFor={`image-upload-${post.id}`} className="cursor-pointer">
            {post.image ? (
              <div className="flex items-center justify-center">
                <Image
                  src={post.image}
                  width={120}
                  height={120}
                  className="rounded-lg object-cover"
                  alt={`${post.title_en} preview`}
                  placeholder={post.blurhashURL ? 'blur' : 'empty'}
                  blurDataURL={post.blurhashURL || undefined}
                />
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-lighttext2" />
                <p className="text-lighttext2 font-medium">
                  Drop image here or click to browse
                </p>
              </>
            )}
          </label>
          {dragStates[`image-${post.id}`] && (
            <div className="absolute inset-0 bg-main/80 flex items-center justify-center rounded-lg border-2 border-dashed border-white">
              <div className="text-center text-white">
                <Upload className="w-12 h-12 mx-auto mb-2" />
                <p className="font-medium">Drop image here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor={`edit-description-en-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Description (EN) *
          </label>
          <textarea
            id={`edit-description-en-${post.id}`}
            value={post.description_en}
            onChange={(e) =>
              onInputChange(post.id, 'description_en', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[80px]"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-description-it-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Description (IT) *
          </label>
          <textarea
            id={`edit-description-it-${post.id}`}
            value={post.description_it}
            onChange={(e) =>
              onInputChange(post.id, 'description_it', e.target.value)
            }
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[80px]"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-body-en-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Full Content (EN) *
          </label>
          <textarea
            id={`edit-body-en-${post.id}`}
            value={post.body_en}
            onChange={(e) => onInputChange(post.id, 'body_en', e.target.value)}
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[150px]"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-body-it-${post.id}`}
            className="block text-sm font-medium text-lighttext mb-2"
          >
            Full Content (IT) *
          </label>
          <textarea
            id={`edit-body-it-${post.id}`}
            value={post.body_it}
            onChange={(e) => onInputChange(post.id, 'body_it', e.target.value)}
            className="w-full px-3 py-2 bg-darkergray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-none resize-y min-h-[150px]"
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
