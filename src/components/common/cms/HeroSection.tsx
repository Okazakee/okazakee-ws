import React, { useState } from 'react';
import Image from 'next/image';
import { ErrorDiv } from '../ErrorDiv';
import { useLayoutStore } from '@/store/layoutStore';
import { updateHero } from '@/app/actions/cms/sections/updateHero';
import { encode } from 'blurhash';
import { Upload, Copy } from 'lucide-react';

type HeroUpdateData = {
  mainImage?: string;
  blurhashURL?: string;
  resume_en?: string;
  resume_it?: string;
};

export default function HeroSection() {
  const { heroSection } = useLayoutStore();

  // Local state for edits
  const [editedData, setEditedData] = useState({
    mainImage: heroSection?.mainImage || '',
    blurhashURL: heroSection?.blurhashURL || '',
    resume_en: heroSection?.resume_en || '',
    resume_it: heroSection?.resume_it || '',
  });

  // Track what fields have been modified
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const handleFileChange = (field: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange(field, reader.result as string);
      // Generate blurhash when file changes
      if (reader.result && field === 'mainImage') {
        generateBlurhash(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent, field: 'image' | 'resumeIt' | 'resumeEn') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [field]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, field: 'image' | 'resumeIt' | 'resumeEn') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [field]: false }));
  };

  const handleDrop = (e: React.DragEvent, field: 'image' | 'resumeIt' | 'resumeEn') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [field]: false }));
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fieldMap = {
        image: 'mainImage',
        resumeIt: 'resume_it',
        resumeEn: 'resume_en'
      };
      
      handleFileChange(fieldMap[field], file);
    }
  };

  const copyToClipboard = (url: string, label: string) => {
    navigator.clipboard.writeText(url).then(() => {
      alert(`${label} URL copied to clipboard!`);
    }).catch((err) => {
      console.error('Failed to copy URL:', err);
      setError('Failed to copy URL');
    });
  };

  const handleApplyChanges = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const updateData: HeroUpdateData = {};
      // Only include fields that have actually changed from original values
      if (editedData.mainImage !== heroSection.mainImage) {
        updateData.mainImage = editedData.mainImage;
      }
      if (editedData.blurhashURL !== heroSection.blurhashURL) {
        updateData.blurhashURL = editedData.blurhashURL;
      }
      if (editedData.resume_en !== heroSection.resume_en) {
        updateData.resume_en = editedData.resume_en;
      }
      if (editedData.resume_it !== heroSection.resume_it) {
        updateData.resume_it = editedData.resume_it;
      }

      console.log('Updating with data:', updateData);
      const result = await updateHero(updateData);

      console.log('Update result:', result);
      if (!result.success) {
        throw new Error(error || 'Failed to update hero section');
      }

      // Update local state to reflect changes
      useLayoutStore.getState().setHeroSection({
        ...heroSection,
        ...updateData,
      });
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

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-main mb-4">Hero Section Editor</h1>
        <p className="text-lighttext2 text-lg">
          Update your hero section content and image
        </p>
      </div>

      <div className="space-y-8">
        {/* Hero Image Section */}
        <div className="bg-darkergray rounded-xl p-6">
          <h2 className="text-2xl font-bold text-main mb-4">Hero Image</h2>
          
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
                <button
                  type="button"
                  onClick={() => copyToClipboard(editedData.mainImage, 'Hero Image')}
                  className="flex items-center gap-2 px-4 py-2 bg-darkestgray hover:bg-darkgray text-lighttext rounded-lg transition-all duration-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy URL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resume Links Section */}
        <div className="bg-darkergray rounded-xl p-6">
          <h2 className="text-2xl font-bold text-main mb-4">Resume Links</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Italian Resume */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-lighttext">
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
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileChange('resume_it', file);
                    }
                  }}
                />
                <label htmlFor="resume-it-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-lighttext2" />
                  <p className="text-lighttext2 font-medium">Drop PDF here or click to browse</p>
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
              <label className="block text-sm font-medium text-lighttext">
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
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileChange('resume_en', file);
                    }
                  }}
                />
                <label htmlFor="resume-en-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-lighttext2" />
                  <p className="text-lighttext2 font-medium">Drop PDF here or click to browse</p>
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

      {error && (
        <div className="mt-6 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="flex justify-end mt-8">
        <button
          type="submit"
          className="bg-main hover:bg-secondary text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={modifiedFields.size === 0 || isUpdating}
          onClick={handleApplyChanges}
        >
          {isUpdating ? 'Updating...' : 'Apply Changes'}
        </button>
      </div>
    </div>
  );
}
