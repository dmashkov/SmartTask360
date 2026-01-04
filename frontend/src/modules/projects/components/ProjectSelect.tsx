/**
 * SmartTask360 — Project select component for forms
 */

import { Select } from "../../../shared/ui";
import { useProjects } from "../hooks";

interface ProjectSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ProjectSelect({
  value,
  onChange,
  label = "Проект",
  placeholder = "Не выбран",
  className,
  required = false,
  disabled = false,
}: ProjectSelectProps) {
  const { data: projects = [], isLoading } = useProjects();

  const options = [
    { value: "", label: placeholder },
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
