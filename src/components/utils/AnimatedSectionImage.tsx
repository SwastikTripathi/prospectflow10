
'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface AnimatedSectionImageProps extends Omit<ImageProps, 'alt' | 'src'> {
  src: string;
  alt: string;
  animationDirection: 'left' | 'right' | 'up';
  wrapperClassName?: string;
}

export function AnimatedSectionImage({
  src,
  alt,
  animationDirection,
  wrapperClassName = '',
  className,
  ...imageProps
}: AnimatedSectionImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setLastScrollY(window.scrollY);
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Reset visibility when the element is not intersecting to allow re-animation
          setIsVisible(false);
        }
      },
      {
        threshold: 0.01,
        rootMargin: "-0.1px 0px -0.1px 0px",
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  let initialTransform = '';
  if (animationDirection === 'left') {
    initialTransform = '-translate-x-full';
  } else if (animationDirection === 'right') {
    initialTransform = 'translate-x-full';
  } else if (animationDirection === 'up') {
    // For vertical animations, direction depends on scroll
    if (scrollDirection === 'down') {
      initialTransform = '-translate-y-24'; // Start above, animate down
    } else {
      initialTransform = 'translate-y-24';  // Start below, animate up (for scrolling up or initial load if no scroll yet)
    }
  }

  const dynamicClasses = isVisible
    ? 'opacity-100 translate-x-0 translate-y-0'
    : `opacity-0 ${initialTransform}`;

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out transform',
        wrapperClassName,
        dynamicClasses
      )}
    >
      <Image
        src={src}
        alt={alt}
        className={className}
        {...imageProps}
      />
    </div>
  );
}
