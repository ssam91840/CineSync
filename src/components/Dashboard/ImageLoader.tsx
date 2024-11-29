import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface Props {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

const ImageLoader: React.FC<Props> = ({ src, alt, className = '', onLoad }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    if (!inView) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setIsLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      setError(true);
    };
  }, [src, inView, onLoad]);

  return (
    <div 
      ref={ref}
      className={`relative overflow-hidden ${className}`}
    >
      {inView && (
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${error ? 'hidden' : ''}
          `}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      
      {error && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <span className="text-gray-600 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default ImageLoader;