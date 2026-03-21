/* ============================================
   Framer Motion Animation Presets
   iOS-native timing and feel
   ============================================ */

export const animations = {
  /* Page enter transition */
  pageEnter: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] },
  },

  /* Modal overlay fade */
  modalOverlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  /* Modal content scale + fade */
  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 },
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] },
  },

  /* Card enter (for staggered lists) */
  cardEnter: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] },
  },

  /* Stagger container */
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.05 } },
  },

  /* Fade in */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
  },

  /* Slide up (for bottom sheets) */
  slideUp: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
    transition: { type: "spring", stiffness: 400, damping: 35 },
  },
} as const;
