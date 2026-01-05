/**
 * SmartTask360 — Project select component for forms
 */

import { Select } from "../../../shared/ui";
import { useProjects } from "../hooks";

// Special value for "no project" - task without project assignment
export const NO_PROJECT_VALUE = "__no_project__";

interface ProjectSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  /** Show "Без проекта" option for filtering tasks without project */
  showNoProject?: boolean;
  /**
   * Allow empty/placeholder selection.
   * - true (default): shows placeholder option (for filters: "Все проекты")
   * - false: no placeholder, first option is "Без проекта" (for task forms)
   */
  allowEmpty?: boolean;
}

export function ProjectSelect({
  value,
  onChange,
  label = "Проект",
  placeholder = "Не выбран",
  className,
  required = false,
  disabled = false,
  showNoProject = false,
  allowEmpty = true,
}: ProjectSelectProps) {
  const { data: projects = [], isLoading } = useProjects();

  const options = [
    // Placeholder option (only if allowEmpty is true)
    ...(allowEmpty ? [{ value: "", label: placeholder }] : []),
    // "Без проекта" option - show if explicitly requested OR if allowEmpty is false (for forms)
    ...(showNoProject || !allowEmpty ? [{ value: NO_PROJECT_VALUE, label: "Без проекта" }] : []),
    // Projects list
    ...projects.map((project) => ({
      value: project.id,
      label: `${project.code} — ${project.name}`,
    })),
  ];

  return (
    <Select
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      className={className}
      required={required}
      disabled={disabled || isLoading}
    />
  );
}
