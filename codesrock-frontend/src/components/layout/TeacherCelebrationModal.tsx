import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2, ArrowRight, PartyPopper } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const TeacherCelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onClose, onProceed }) => {
  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header with Background Pattern */}
            <div className="h-32 bg-gradient-to-br from-primary to-secondary relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-12 -translate-y-12" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-16 translate-y-16" />
              </div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-4 rounded-2xl shadow-xl border-4 border-primary/20 relative"
              >
                <img 
                  src="/assets/rocky/celebration-transparent.webp" 
                  alt="Celebration Rocky" 
                  className="absolute -top-12 -right-12 w-24 h-24 object-contain animate-float"
                />
                <Award className="w-12 h-12 text-primary" />
              </motion.div>
            </div>

            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                  You're a Pioneer! <PartyPopper className="text-yellow-500 w-8 h-8" />
                </h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                  Congratulations! You've successfully completed your first module and earned the <span className="font-semibold text-primary">Pioneer Teacher</span> badge.
                </p>
              </motion.div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl text-left border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Training Completed</h4>
                    <p className="text-xs text-emerald-700">You've mastered the essentials of the platform.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl text-left border border-blue-100">
                  <Award className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">Pioneer Badge Unlocked</h4>
                    <p className="text-xs text-blue-700">Wear it with pride on your profile!</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onProceed}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
              >
                Let's Set Up Your Class
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
