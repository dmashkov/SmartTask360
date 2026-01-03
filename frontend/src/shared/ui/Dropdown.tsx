import { useState, useRef, useEffect, ReactNode } from "react";
import { cn } from "../lib/utils";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

function Dropdown({ trigger, children, align = "left", className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[12rem] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div
            className="py-1"
            role="menu"
            onClick={() => setIsOpen(false)}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: ReactNode;
  className?: string;
}

function DropdownItem({
  children,
  onClick,
  disabled,
  danger,
  icon,
  className,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-4 py-2 text-sm text-left",
        "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
        disabled && "cursor-not-allowed opacity-50",
        danger && "text-red-600 hover:bg-red-50 focus:bg-red-50",
        !danger && "text-gray-700",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      role="menuitem"
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function DropdownDivider() {
  return <div className="my-1 border-t border-gray-100" role="separator" />;
}

export interface DropdownLabelProps {
  children: ReactNode;
  className?: string;
}

function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider",
        className
      )}
    >
      {children}
    </div>
  );
}

export { Dropdown, DropdownItem, DropdownDivider, DropdownLabel };
