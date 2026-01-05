/**
 * SmartTask360 — Notification Bell
 *
 * Header icon showing unread notification count.
 */

import { useState, useRef, useEffect } from "react";
import { useUnreadCount } from "../hooks";
import { NotificationsDropdown } from "./NotificationsDropdown";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: unreadCount } = useUnreadCount();

  const totalUnread = unreadCount?.total || 0;
  const hasHighPriority = (unreadCount?.high_priority || 0) > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
          isOpen
            ? "bg-gray-100 text-gray-900"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        }`}
        aria-label="Уведомления"
      >
        {/* Bell Icon */}
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Unread badge */}
        {totalUnread > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white rounded-full ${
              hasHighPriority ? "bg-red-500" : "bg-blue-500"
            }`}
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && <NotificationsDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
}
