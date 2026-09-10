"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Client-side detection of viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Single Unified Responsive Modal Container */}
          {/* Mobile: Bottom Sheet slide-in from bottom */}
          {/* Desktop: Centered Scale & Fade dialog */}
          <motion.div
            initial={
              isMobile
                ? { y: "100%", opacity: 0.8 }
                : { scale: 0.95, opacity: 0, y: 15 }
            }
            animate={
              isMobile
                ? { y: 0, opacity: 1 }
                : { scale: 1, opacity: 1, y: 0 }
            }
            exit={
              isMobile
                ? { y: "100%", opacity: 0 }
                : { scale: 0.95, opacity: 0, y: 15 }
            }
            transition={{
              type: "spring",
              damping: isMobile ? 30 : 25,
              stiffness: isMobile ? 300 : 280,
            }}
            className={`relative w-full ${maxWidth} max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-[28px] sm:rounded-3xl rounded-b-none sm:rounded-b-3xl p-5 sm:p-6 glass-card border-t border-x sm:border border-white/10 shadow-2xl sm:shadow-glass z-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]`}
          >
            {/* Mobile Grab / Drag Handle Bar */}
            <div className="sm:hidden w-12 h-1.5 bg-white/25 rounded-full mx-auto mb-4 cursor-grab" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-4 sm:mb-5">
              <div>
                {title && (
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                )}
              </div>

              {/* Close Button with >= 44px touch target on mobile */}
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Modal Content (Rendered exactly once) */}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
