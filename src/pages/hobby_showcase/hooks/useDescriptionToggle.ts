import { useEffect, useRef, useState } from 'react';

type UseDescriptionToggleOptions = {
  description: string;
  isLoading?: boolean;
  isOpen: boolean;
};

const useDescriptionToggle = ({ description, isLoading, isOpen }: UseDescriptionToggleOptions) => {
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const [isDescriptionLong, setIsDescriptionLong] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsDescriptionExpanded(false);
  }, [description, isOpen]);

  useEffect(() => {
    if (!isOpen || isLoading) return;

    const checkDescriptionOverflow = () => {
      const element = descriptionRef.current;
      if (!element) return;

      const hasOverflow = element.scrollHeight > element.clientHeight + 1;
      if (!isDescriptionExpanded) {
        setIsDescriptionLong(hasOverflow);
      }
    };

    const frameId = window.requestAnimationFrame(checkDescriptionOverflow);
    window.addEventListener('resize', checkDescriptionOverflow);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', checkDescriptionOverflow);
    };
  }, [description, isDescriptionExpanded, isLoading, isOpen]);

  return {
    descriptionRef,
    isDescriptionExpanded,
    isDescriptionLong,
    setIsDescriptionExpanded,
  };
};

export default useDescriptionToggle;
