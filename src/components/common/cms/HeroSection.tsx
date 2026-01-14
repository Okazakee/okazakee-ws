import { heroActions } from '@/app/actions/cms/sections/heroActions';
import { useLayoutStore } from '@/store/layoutStore';
import { encode } from 'blurhash';
import { Copy, Download, Home, Upload, FileText, Eye, X } from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useRef, useState } from 'react';
import { ErrorDiv } from '../ErrorDiv';
import { PreviewModal } from './PreviewModal';
import { HeroPreview } from './previews/HeroPreview';

type HeroUpdateData = {
  mainImage?: string;
  blurhashURL?: string;
  resume_en?: string;
  resume_it?: string;
};

export default function HeroSection() {
  const { heroSection } = useLayoutStore();

  // Add refs for file inputs
  const resumeItInputRef = useRef<HTMLInputElement>(null);
  const resumeEnInputRef = useRef<HTMLInputElement>(null);

  // Local state for edits
  const [editedData, setEditedData] = useState({
    mainImage: heroSection?.mainImage || '',
    blurhashURL: heroSection?.blurhashURL || '',
    resume_en: heroSection?.resume_en || '',
    resume_it: heroSection?.resume_it || '',
    // Add file storage
    mainImage_file: null as File | null,
    resume_en_file: null as File | null,
    resume_it_file: null as File | null,
  });

  // Track what fields have been modified
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Drag and drop states
  const [dragStates, setDragStates] = useState({
    image: false,
    resumeIt: false,
    resumeEn: false,
  });

  if (!heroSection) {
    return <ErrorDiv>Error loading Hero data</ErrorDiv>;
  }

  const handleInputChange = (field: string, value: string) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
    setModifiedFields((prev) => new Set(prev).add(field));
  };

  const generateBlurhash = async (imageUrl: string) => {
    try {
      const img = new HTMLImageElement();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      await img.decode();

      // Create canvas to get image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const blurhash = encode(
        imageData.data,
        imageData.width,
        imageData.height,
        4,
        4
      );

      handleInputChange('blurhashURL', blurhash);
    } catch (error) {
      setError('Failed to generate blurhash');
      console.error(error);
    }
  };

  const handleFileChange = async (field: string, file: File) => {
    try {
      // Store file in state for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(field, reader.result as string);
      };
      reader.readAsDataURL(file);

      // Store the actual File object for upload
      setEditedData((prev) => ({
        ...prev,
        [`${field}_file`]: file,
      }));
      setModifiedFields((prev) => new Set(prev).add(field));
    } catch (error) {
      console.error('Error handling file change:', error);
      setError('Failed to process file');
    }
  };

  // Add the missing handleResumeChange function
  const handleResumeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'resume_en' | 'resume_it'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(field, file);
    }
  };

  const handleDragOver = (
    e: React.DragEvent,
    field: 'image' | 'resumeIt' | 'resumeEn'
  ) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [field]: true }));
  };

  const handleDragLeave = (
    e: React.DragEvent,
    field: 'image' | 'resumeIt' | 'resumeEn'
  ) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [field]: false }));
  };

  const handleDrop = (
    e: React.DragEvent,
    field: 'image' | 'resumeIt' | 'resumeEn'
  ) => {
    e.preventDefault();
    setDragStates((prev) => ({ ...prev, [field]: false }));

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fieldMap = {
        image: 'mainImage',
        resumeIt: 'resume_it',
        resumeEn: 'resume_en',
      };

      handleFileChange(fieldMap[field], file);
    }
  };

  const copyToClipboard = (url: string, label: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert(`${label} URL copied to clipboard!`);
      })
      .catch((err) => {
        console.error('Failed to copy URL:', err);
        setError('Failed to copy URL');
      });
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download image:', error);
      setError('Failed to download image');
    }
  };

  const handleApplyChanges = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      // Collect files that need to be uploaded
      const filesToUpload: Record<string, File> = {};
      const currentData: Record<string, string> = {};

      // Check which fields have file changes
      if (editedData.mainImage_file) {
        filesToUpload.mainImage = editedData.mainImage_file;
        currentData.mainImage = heroSection?.mainImage || '';
      }
      if (editedData.resume_en_file) {
        filesToUpload.resume_en = editedData.resume_en_file;
        currentData.resume_en = heroSection?.resume_en || '';
      }
      if (editedData.resume_it_file) {
        filesToUpload.resume_it = editedData.resume_it_file;
        currentData.resume_it = heroSection?.resume_it || '';
      }

      // If we have files to upload, use the file upload action
      if (Object.keys(filesToUpload).length > 0) {
        const result = await heroActions({
          type: 'UPDATE_WITH_FILES',
          files: filesToUpload,
          currentData,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to update hero section');
        }

        // Update local state to reflect changes
        if (result.data) {
          const data = result.data as {
            propic?: string;
            blurhashURL?: string;
            resume_en?: string;
            resume_it?: string;
          };

          useLayoutStore.getState().setHeroSection({
            ...heroSection,
            mainImage: data.propic || heroSection?.mainImage,
            blurhashURL: data.blurhashURL || heroSection?.blurhashURL,
            resume_en: data.resume_en || heroSection?.resume_en,
            resume_it: data.resume_it || heroSection?.resume_it,
          });
        }
      } else {
        // Handle non-file updates (like manual URL changes)
        const updateData: HeroUpdateData = {};
        if (editedData.mainImage !== heroSection?.mainImage) {
          updateData.mainImage = editedData.mainImage;
        }
        if (editedData.blurhashURL !== heroSection?.blurhashURL) {
          updateData.blurhashURL = editedData.blurhashURL;
        }
        if (editedData.resume_en !== heroSection?.resume_en) {
          updateData.resume_en = editedData.resume_en;
        }
        if (editedData.resume_it !== heroSection?.resume_it) {
          updateData.resume_it = editedData.resume_it;
        }

        if (Object.keys(updateData).length > 0) {
          const result = await heroActions({
            type: 'UPDATE',
            data: updateData,
          });
          if (!result.success) {
            throw new Error(result.error || 'Failed to update hero section');
          }
        }
      }

      setModifiedFields(new Set());
      alert('Hero section updated successfully!');
    } catch (error) {
      console.error('Error updating hero section:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update hero section'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelAllChanges = () => {
    if (!confirm('Are you sure you want to cancel all changes? All unsaved edits will be lost.')) {
      return;
    }

    // Reset to original data
    setEditedData({
      mainImage: heroSection?.mainImage || '',
      blurhashURL: heroSection?.blurhashURL || '',
      resume_en: heroSection?.resume_en || '',
      resume_it: heroSection?.resume_it || '',
      mainImage_file: null,
      resume_en_file: null,
      resume_it_file: null,
    });
    setModifiedFields(new Set());
    setError(null);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-main mb-4">
          Hero Section
        </h1>
        <p className="text-lighttext2 text-lg">
          Update your hero section content and image
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
            disabled={modifiedFields.size === 0 || isUpdating}
            onClick={cancelAllChanges}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={modifiedFields.size === 0 || isUpdating}
            onClick={handleApplyChanges}
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

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Hero Image Section */}
        <div className="bg-darkergray rounded-xl p-6">
          <h2 className="text-xl font-bold text-main mb-4 flex items-center gap-2">
            <Home className="w-5 h-5" />
            Hero Image
          </h2>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div
                className="relative cursor-pointer"
                onDragOver={(e) => handleDragOver(e, 'image')}
                onDragLeave={(e) => handleDragLeave(e, 'image')}
                onDrop={(e) => handleDrop(e, 'image')}
              >
                <Image
                  placeholder="blur"
                  blurDataURL={editedData.blurhashURL}
                  src={editedData.mainImage || '/placeholder-image.jpg'}
                  width={280}
                  height={280}
                  className="rounded-lg border-2 border-main shadow-lg"
                  alt="Hero Image Preview"
                />
                {!editedData.mainImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-darkestgray rounded-lg border-2 border-dashed border-lighttext2">
                    <span className="text-lighttext2">No image</span>
                  </div>
                )}
                {/* Drag overlay */}
                {dragStates.image && (
                  <div className="absolute inset-0 bg-main/80 flex items-center justify-center rounded-lg border-2 border-dashed border-white">
                    <div className="text-center text-white">
                      <Upload className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-medium">Drop image here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-center mt-2">
              <input
                id="main-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileChange('mainImage', file);
                  }
                }}
              />
              <label
                htmlFor="main-image-upload"
                className="flex items-center gap-2 px-4 py-2 bg-main hover:bg-secondary text-white font-medium rounded-lg cursor-pointer transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                Choose Image
              </label>
              {editedData.mainImage && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(editedData.mainImage, 'Hero Image')
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-darkestgray hover:bg-darkgray text-lighttext rounded-lg transition-all duration-200"
                  >
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadImage(editedData.mainImage, 'hero-image.jpg')
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Resume Links Section */}
        <div className="bg-darkergray rounded-xl p-6">
          <h2 className="text-xl font-bold text-main mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Links
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Italian Resume */}
            <div className="space-y-2">
              <label
                htmlFor="resume-it-upload"
                className="block text-sm font-medium text-lighttext"
              >
                Upload Resume (Italian)
              </label>
              <div
                className="relative border-2 border-dashed border-lighttext2 rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-main"
                onDragOver={(e) => handleDragOver(e, 'resumeIt')}
                onDragLeave={(e) => handleDragLeave(e, 'resumeIt')}
                onDrop={(e) => handleDrop(e, 'resumeIt')}
              >
                <input
                  id="resume-it-upload"
                  ref={resumeItInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleResumeChange(e, 'resume_it')}
                  className="hidden"
                />
                <label htmlFor="resume-it-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-lighttext2" />
                  <p className="text-lighttext2 font-medium">
                    Drop PDF here or click to browse
                  </p>
                </label>
                {/* Drag overlay */}
                {dragStates.resumeIt && (
                  <div className="absolute inset-0 bg-main/80 flex items-center justify-center rounded-lg border-2 border-dashed border-white">
                    <div className="text-center text-white">
                      <Upload className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-medium">Drop PDF here</p>
                    </div>
                  </div>
                )}
              </div>
              {editedData.resume_it?.endsWith('.pdf') && (
                <div className="w-full mt-4 flex justify-center">
                  <iframe
                    src={editedData.resume_it}
                    title="Resume (Italian) Preview"
                    className="w-full max-w-xl h-72 rounded-lg border-2 border-main bg-white"
                  />
                </div>
              )}
            </div>

            {/* English Resume */}
            <div className="space-y-2">
              <label
                htmlFor="resume-en-upload"
                className="block text-sm font-medium text-lighttext"
              >
                Upload Resume (English)
              </label>
              <div
                className="relative border-2 border-dashed border-lighttext2 rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-main"
                onDragOver={(e) => handleDragOver(e, 'resumeEn')}
                onDragLeave={(e) => handleDragLeave(e, 'resumeEn')}
                onDrop={(e) => handleDrop(e, 'resumeEn')}
              >
                <input
                  id="resume-en-upload"
                  ref={resumeEnInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleResumeChange(e, 'resume_en')}
                  className="hidden"
                />
                <label htmlFor="resume-en-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-lighttext2" />
                  <p className="text-lighttext2 font-medium">
                    Drop PDF here or click to browse
                  </p>
                </label>
                {/* Drag overlay */}
                {dragStates.resumeEn && (
                  <div className="absolute inset-0 bg-main/80 flex items-center justify-center rounded-lg border-2 border-dashed border-white">
                    <div className="text-center text-white">
                      <Upload className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-medium">Drop PDF here</p>
                    </div>
                  </div>
                )}
              </div>
              {editedData.resume_en?.endsWith('.pdf') && (
                <div className="w-full mt-4 flex justify-center">
                  <iframe
                    src={editedData.resume_en}
                    title="Resume (English) Preview"
                    className="w-full max-w-xl h-72 rounded-lg border-2 border-main bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Hero Section Preview"
      >
        <HeroPreview
          mainImage={editedData.mainImage || heroSection?.mainImage || ''}
          blurhashURL={editedData.blurhashURL || heroSection?.blurhashURL || ''}
        />
      </PreviewModal>
    </div>
  );
}
