/* ============================================
   Haptic Feedback Utilities
   Uses navigator.vibrate() API for mobile web
   ============================================ */

export const haptics = {
  light: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
  },
  success: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  warning: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([20, 40, 20]);
    }
  },
  error: () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([30, 30, 30, 30, 30]);
    }
  },
};
