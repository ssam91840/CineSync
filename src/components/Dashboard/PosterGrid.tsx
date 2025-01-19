import React from 'react';
import { motion } from 'framer-motion';
import PosterCard from './PosterCard';
import type { MovieInfo } from '../../types';

interface Props {
  movies: (MovieInfo & { onClick?: () => void })[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function MovieGrid({ movies }: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-flow-col auto-cols-max gap-4 min-w-full pb-4"
    >
      {movies.map((movie, index) => (
        <motion.div
          key={movie.path}
          variants={item}
          className="w-48 snap-start"
          style={{ 
            originX: 0.5,
            originY: 0.5
          }}
        >
          <PosterCard
            name={movie.name}
            posterUrl={movie.posterUrl}
            rating={movie.rating}
            year={movie.year}
            mediaType={movie.mediaType}
            onClick={movie.onClick}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}