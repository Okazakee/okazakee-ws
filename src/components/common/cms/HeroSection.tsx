import React, { useState, useCallback } from 'react';
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
    setEditedData(prev => ({ ...prev, [field]: value }));
    setModifiedFields(prev => new Set(prev).add(field));
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
      const blurhash = encode(imageData.data, imageData.width, imageData.height, 4, 4);
      
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
        throw new Error(result.error || 'Failed to update hero section');
      }

      // Update local state to reflect changes
      useLayoutStore.getState().setHeroSection({
        ...heroSection,
        ...updateData
      });
      setModifiedFields(new Set());
      alert('Hero section updated successfully!');
    } catch (error) {
      console.error('Error updating hero section:', error);
      setError(error instanceof Error ? error.message : 'Failed to update hero section');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="mx-5 text-xl w-full flex flex-col gap-10">
      <h1 className="text-2xl">
        Here you can edit Hero Section data to show on the website
      </h1>
      <div className="flex-col items-center">
        <div className="flex items-center gap-5">
          <h2>Hero image:</h2>
          <Image
            placeholder="blur"
            blurDataURL={editedData.blurhashURL}
            src={editedData.mainImage}
            width={280}
            height={280}
            className="rounded-md border border-main"
            alt="mainImage"
          />
        </div>
        <label className="mt-10 flex text-lighttext gap-5">
          Image URL
          <input
            className="text-darktext w-[50rem] rounded-md"
            type="text"
            placeholder="Image URL"
            value={editedData.mainImage}
            onChange={(e) => {
              handleInputChange('mainImage', e.target.value);
              // Generate blurhash when image URL changes
              if (e.target.value) {
                generateBlurhash(e.target.value);
              }
            }}
          />
        </label>
      </div>
      <div className="flex flex-col gap-4">
        <h2>Resume links:</h2>
        <label className="flex text-lighttext gap-5">
          Resume IT
          <input
            className="text-darktext w-[50rem] rounded-md"
            type="text"
            placeholder="Resume IT"
            value={editedData.resume_it}
            onChange={(e) => handleInputChange('resume_it', e.target.value)}
          />
        </label>
        <label className="flex text-lighttext gap-5">
          Resume EN
          <input
            className="text-darktext w-[50rem] rounded-md"
            type="text"
            placeholder="Resume EN"
            value={editedData.resume_en}
            onChange={(e) => handleInputChange('resume_en', e.target.value)}
          />
        </label>
      </div>

      {error && (
        <div className="text-red-500">{error}</div>
      )}

      <button
        type='submit'
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        disabled={modifiedFields.size === 0 || isUpdating}
        onClick={handleApplyChanges}
      >
        {isUpdating ? 'Updating...' : 'Apply Changes'}
      </button>
    </section>
  );
}
