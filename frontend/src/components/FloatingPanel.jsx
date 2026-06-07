import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';

const FloatingPanel = ({ children, isExpanded, onToggle, onClose }) => {
  // Phase 4: drag fix.
  //
  // The previous implementation combined manual onMouseDown/Move/Up
  // handlers with Framer Motion's `drag` prop, which made the panel
  // jitter and stick to the cursor because both systems were trying
  // to own the position at the same time. The fix is to let Framer
  // Motion own the drag state and only use manual handlers for the
  // window resize animation.
  const dragRef = useRef(null);

  return (
    <motion.div
      ref={dragRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={false}
      animate={{
        width: isExpanded ? 500 : 400,
        height: isExpanded ? 600 : 80,
      }}
      transition={{ duration: 0.2 }}
      className="fixed top-24 left-24 rounded-2xl bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-gray-800 overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      {/* Header — this is the drag handle. Buttons stop propagation
          so they don't trigger drag when clicked. */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700 cursor-move select-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-200">Airis AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Minimize panel' : 'Maximize panel'}
          >
            {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingPanel;
