import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface RockyTourGuideProps {
  message: string;
  isLeft?: boolean;
}

export const RockyTourGuide: React.FC<RockyTourGuideProps> = ({ message, isLeft = false }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`flex items-end gap-3 max-w-sm ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
      >
        <div className="flex-shrink-0 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative w-16 h-16 rounded-full border-2 border-white/50 overflow-hidden bg-white shadow-xl">
            <img 
              src="/assets/rocky/idea-transparent.webp" 
              alt="Rocky" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=Rocky';
              }}
            />
          </div>
          <div className="absolute -top-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
            <MessageSquare className="w-3 h-3" />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-75"></div>
          <div className="relative bg-white/90 backdrop-blur-sm border border-white/20 p-4 rounded-2xl shadow-xl">
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              {message}
            </p>
            {/* Tooltip arrow */}
            <div className={`absolute bottom-4 ${isLeft ? '-left-2' : '-right-2'} w-4 h-4 bg-white/90 transform rotate-45 border-b border-l border-white/20 -z-10`}></div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
