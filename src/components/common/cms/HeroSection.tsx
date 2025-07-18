import React, { useState } from 'react';
import Image from 'next/image';
import { ErrorDiv } from '../ErrorDiv';
import { useLayoutStore } from '@/store/layoutStore';
import { updateHero } from '@/app/actions/cms/sections/updateHero';
import { encode } from 'blurhash';

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

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-6">
          <div className="bg-darkergray rounded-xl p-6">
            <h2 className="text-2xl font-bold text-main mb-4">Hero Image</h2>
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
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
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="image-url" className="block text-sm font-medium text-lighttext">
                  Image URL
                </label>
                <input
                  id="image-url"
                  className="w-full px-4 py-3 bg-darkestgray border border-darkgray rounded-lg text-lighttext placeholder-lighttext2 focus:border-main focus:ring-2 focus:ring-main/20 transition-all duration-200"
                  type="text"
                  placeholder="Enter image URL"
                  value={editedData.mainImage}
                  onChange={(e) => {
                    handleInputChange('mainImage', e.target.value);
                    // Generate blurhash when image URL changes
                    if (e.target.value) {
                      generateBlurhash(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resume Links Section */}
        <div className="space-y-6">
          <div className="bg-darkergray rounded-xl p-6">
            <h2 className="text-2xl font-bold text-main mb-4">Resume Links</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="resume-it" className="block text-sm font-medium text-lighttext">
                  Resume (Italian)
                </label>
                <input
                  id="resume-it"
                  className="w-full px-4 py-3 bg-darkestgray border border-darkgray rounded-lg text-lighttext placeholder-lighttext2 focus:border-main focus:ring-2 focus:ring-main/20 transition-all duration-200"
                  type="text"
                  placeholder="Enter Italian resume URL"
                  value={editedData.resume_it}
                  onChange={(e) => handleInputChange('resume_it', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="resume-en" className="block text-sm font-medium text-lighttext">
                  Resume (English)
                </label>
                <input
                  id="resume-en"
                  className="w-full px-4 py-3 bg-darkestgray border border-darkgray rounded-lg text-lighttext placeholder-lighttext2 focus:border-main focus:ring-2 focus:ring-main/20 transition-all duration-200"
                  type="text"
                  placeholder="Enter English resume URL"
                  value={editedData.resume_en}
                  onChange={(e) => handleInputChange('resume_en', e.target.value)}
                />
              </div>
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
