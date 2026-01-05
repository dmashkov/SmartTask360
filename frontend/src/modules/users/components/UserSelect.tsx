/**
 * SmartTask360 — User Select Component
 *
 * Searchable dropdown for selecting users.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { Avatar, Spinner } from "../../../shared/ui";
import { useUsers } from "../hooks/useUsers";
import type { User } from "../types";

interface UserSelectProps {
  /** Currently selected user ID */
  value?: string | null;
  /** Callback when user is selected */
  onSelect: (user: User) => void;
  /** Placeholder text */
  placeholder?: string;
  /** User IDs to exclude from the list */
  excludeIds?: string[];
  /** Disable the select */
  disabled?: boolean;
  /** Auto focus the search input */
  autoFocus?: boolean;
}

export function UserSelect({
  value,
  onSelect,
  placeholder = "Выберите пользователя",
  excludeIds = [],
  disabled = false,
  autoFocus = false,
}: UserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: users = [], isLoading } = useUsers();

  // Filter users based on search and excludeIds
  const filteredUsers = useMemo(() => {
    const excludeSet = new Set(excludeIds);
    return users.filter((user) => {
      if (excludeSet.has(user.id)) return false;
      if (!user.is_active) return false;
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    });
  }, [users, excludeIds, search]);

  // Find selected user
  const selectedUser = useMemo(() => {
    if (!value) return null;
    return users.find((u) => u.id === value) || null;
  }, [users, value]);

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

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus) {
      setIsOpen(true);
    }
  }, [autoFocus]);

  const handleSelect = (user: User) => {
    onSelect(user);
    setIsOpen(false);
    setSearch("");
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearch("");
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-gray-400 cursor-pointer"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      >
        {selectedUser ? (
          <>
            <Avatar name={selectedUser.name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium text-gray-900">
                {selectedUser.name}
              </div>
              <div className="truncate text-xs text-gray-500">
                {selectedUser.email}
              </div>
            </div>
          </>
        ) : (
          <span className="text-gray-500 flex-1">{placeholder}</span>
        )}
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или email..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Users list */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {search ? "Пользователи не найдены" : "Нет доступных пользователей"}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                >
                  <Avatar name={user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
