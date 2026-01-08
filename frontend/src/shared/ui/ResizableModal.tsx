/**
 * SmartTask360 — Resizable Modal Component
 *
 * Modal with drag-to-resize functionality.
 * Supports both width and height resizing via corner/edge handles.
 */

import { ReactNode, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";

export interface ResizableModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  storageKey?: string; // Key for localStorage persistence
}

interface Size {
  width: number;
  height: number;
}

export function ResizableModal({
  isOpen,
  onClose,
  children,
  title,
  initialWidth = 600,
  initialHeight = 500,
  minWidth = 400,
  minHeight = 300,
  maxWidth = 1200,
  maxHeight = 900,
  storageKey,
}: ResizableModalProps) {
  // Load initial size from localStorage if available
  const getInitialSize = (): Size => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`resizable-modal-${storageKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            width: Math.min(Math.max(parsed.width, minWidth), maxWidth),
            height: Math.min(Math.max(parsed.height, minHeight), maxHeight),
          };
        }
      } catch {
        // Ignore parse errors
      }
    }
    return { width: initialWidth, height: initialHeight };
  };

  const [size, setSize] = useState<Size>(getInitialSize);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  // Save size to localStorage when it changes
  useEffect(() => {
    if (storageKey && !isResizing) {
      localStorage.setItem(`resizable-modal-${storageKey}`, JSON.stringify(size));
    }
  }, [size, storageKey, isResizing]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeDirection) return;

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      // Calculate new dimensions based on resize direction
      if (resizeDirection.includes("e")) {
        newWidth = Math.min(Math.max(startSize.current.width + deltaX * 2, minWidth), maxWidth);
      }
      if (resizeDirection.includes("w")) {
        newWidth = Math.min(Math.max(startSize.current.width - deltaX * 2, minWidth), maxWidth);
      }
      if (resizeDirection.includes("s")) {
        newHeight = Math.min(Math.max(startSize.current.height + deltaY * 2, minHeight), maxHeight);
      }
      if (resizeDirection.includes("n")) {
        newHeight = Math.min(Math.max(startSize.current.height - deltaY * 2, minHeight), maxHeight);
      }

      setSize({ width: newWidth, height: newHeight });
    },
    [isResizing, resizeDirection, minWidth, maxWidth, minHeight, maxHeight]
  );

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Start resize
  const startResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width: size.width, height: size.height };

    // Set cursor based on direction
    const cursors: Record<string, string> = {
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
      ne: "nesw-resize",
      nw: "nwse-resize",
      se: "nwse-resize",
      sw: "nesw-resize",
    };
    document.body.style.cursor = cursors[direction] || "default";
  };

  // Reset to initial size
  const resetSize = () => {
    setSize({ width: initialWidth, height: initialHeight });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={cn(
            "relative bg-white rounded-lg shadow-xl transition-shadow",
            isResizing && "shadow-2xl"
          )}
          style={{
            width: size.width,
            height: size.height,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Resize handles */}
          {/* Top */}
          <div
            className="absolute top-0 left-4 right-4 h-1 cursor-ns-resize hover:bg-blue-400/50 transition-colors"
            onMouseDown={(e) => startResize(e, "n")}
          />
          {/* Bottom */}
          <div
            className="absolute bottom-0 left-4 right-4 h-1 cursor-ns-resize hover:bg-blue-400/50 transition-colors"
            onMouseDown={(e) => startResize(e, "s")}
          />
          {/* Left */}
          <div
            className="absolute left-0 top-4 bottom-4 w-1 cursor-ew-resize hover:bg-blue-400/50 transition-colors"
            onMouseDown={(e) => startResize(e, "w")}
          />
          {/* Right */}
          <div
            className="absolute right-0 top-4 bottom-4 w-1 cursor-ew-resize hover:bg-blue-400/50 transition-colors"
            onMouseDown={(e) => startResize(e, "e")}
          />
          {/* Top-Left */}
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize hover:bg-blue-400/50 transition-colors rounded-tl-lg"
            onMouseDown={(e) => startResize(e, "nw")}
          />
          {/* Top-Right */}
          <div
            className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize hover:bg-blue-400/50 transition-colors rounded-tr-lg"
            onMouseDown={(e) => startResize(e, "ne")}
          />
          {/* Bottom-Left */}
          <div
            className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize hover:bg-blue-400/50 transition-colors rounded-bl-lg"
            onMouseDown={(e) => startResize(e, "sw")}
          />
          {/* Bottom-Right - Main resize handle with visual indicator */}
          <div
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize group"
            onMouseDown={(e) => startResize(e, "se")}
          >
            <svg
              className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
            </svg>
          </div>

          {/* Size indicator during resize */}
          {isResizing && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {Math.round(size.width)} × {Math.round(size.height)}
            </div>
          )}

          {/* Reset size button */}
          <button
            onClick={resetSize}
            className="absolute top-2 right-10 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Сбросить размер"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          {/* Content */}
          <div className="h-full flex flex-col overflow-hidden rounded-lg">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
