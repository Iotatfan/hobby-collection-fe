import { cloudinarySizes } from '@/utils/cloudinary';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildDisplayImages } from './itemModal.helpers';

type UseItemModalCarouselOptions = {
  cover?: string;
  images?: string[];
  isOpen: boolean;
};

const useItemModalCarousel = ({ cover, images, isOpen }: UseItemModalCarouselOptions) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages = useMemo(() => buildDisplayImages(cover, images), [cover, images]);
  const imageCount = displayImages.length;
  const currentImage = imageCount ? displayImages[currentIndex] : undefined;

  const preloadImage = useCallback((src?: string) => {
    if (!src) return;
    const img = new window.Image();
    img.src = cloudinarySizes(src).preview;
  }, []);

  const handleCarouselClick = useCallback(
    (index: number) => {
      if (!imageCount) return;
      setCurrentIndex(index);
    },
    [imageCount],
  );

  const handlePrev = useCallback(() => {
    if (imageCount < 2) return;
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? imageCount - 1 : prevIndex - 1));
  }, [imageCount]);

  const handleNext = useCallback(() => {
    if (imageCount < 2) return;
    setCurrentIndex((nextIndex) => (nextIndex === imageCount - 1 ? 0 : nextIndex + 1));
  }, [imageCount]);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(0);
  }, [isOpen, images]);

  useEffect(() => {
    if (!imageCount) return;
    if (currentIndex > imageCount - 1) {
      setCurrentIndex(0);
    }
  }, [currentIndex, imageCount]);

  useEffect(() => {
    if (!isOpen || imageCount < 2) return;

    const nextIndex = (currentIndex + 1) % imageCount;
    const prevIndex = (currentIndex - 1 + imageCount) % imageCount;

    preloadImage(displayImages[nextIndex]);
    preloadImage(displayImages[prevIndex]);
  }, [currentIndex, displayImages, imageCount, isOpen, preloadImage]);

  return {
    currentImage,
    currentIndex,
    displayImages,
    handleCarouselClick,
    handleNext,
    handlePrev,
    imageCount,
  };
};

export default useItemModalCarousel;
