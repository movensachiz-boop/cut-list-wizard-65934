import { useState, useEffect } from 'react';
import { loadImage, removeBackground } from '@/lib/backgroundRemoval';

export const useBackgroundRemoval = (imageSrc: string) => {
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processImage = async () => {
      try {
        setIsProcessing(true);
        const img = await loadImage(imageSrc);
        const result = await removeBackground(img);
        setProcessedImage(result);
      } catch (err) {
        console.error('Failed to remove background:', err);
        setError('Failed to process image');
        // Fallback to original image
        setProcessedImage(imageSrc);
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();
  }, [imageSrc]);

  return { processedImage, isProcessing, error };
};
